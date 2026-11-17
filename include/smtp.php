<?php
/**
 * Cliente SMTP mínimo, sin librerías externas ni Composer.
 * Se usa solo para enviar el formulario de contacto del sitio.
 *
 * Uso:
 *   $envio = new SdiSmtp($host, $puerto, $seguridad, $usuario, $clave);
 *   $envio->enviar($de, $deNombre, $para, $paraNombre, $asunto, $cuerpoHtml, $responderA, $bcc);
 */
class SdiSmtp
{
	private $host;
	private $puerto;
	private $seguridad;   // 'tls', 'ssl' o 'ninguna'
	private $usuario;
	private $clave;
	private $tiempoLimite;
	private $conexion;

	public $error = '';

	public function __construct($host, $puerto, $seguridad, $usuario, $clave, $tiempoLimite = 20)
	{
		$this->host         = $host;
		$this->puerto       = (int) $puerto;
		$this->seguridad    = strtolower($seguridad);
		$this->usuario      = $usuario;
		$this->clave        = $clave;
		$this->tiempoLimite = $tiempoLimite;
	}

	/**
	 * Envía un correo. Devuelve true si el servidor lo aceptó.
	 */
	public function enviar($de, $deNombre, $para, $paraNombre, $asunto, $cuerpoHtml, $responderA = '', $bcc = '')
	{
		if (!$this->conectar())      { return false; }
		if (!$this->saludar())       { $this->cerrar(); return false; }
		if (!$this->autenticar())    { $this->cerrar(); return false; }

		if (!$this->comando('MAIL FROM:<' . $de . '>', array(250))) { $this->cerrar(); return false; }
		if (!$this->comando('RCPT TO:<' . $para . '>', array(250, 251))) { $this->cerrar(); return false; }

		if ($bcc !== '' && !$this->comando('RCPT TO:<' . $bcc . '>', array(250, 251))) {
			$this->cerrar();
			return false;
		}

		if (!$this->comando('DATA', array(354))) { $this->cerrar(); return false; }

		$mensaje = $this->armarMensaje($de, $deNombre, $para, $paraNombre, $asunto, $cuerpoHtml, $responderA);

		$this->escribir($mensaje . "\r\n.\r\n");
		if (!$this->esperar(array(250))) { $this->cerrar(); return false; }

		$this->comando('QUIT', array(221));
		$this->cerrar();

		return true;
	}

	/* ------------------------------------------------------------------ */

	private function conectar()
	{
		$destino = ($this->seguridad === 'ssl' ? 'ssl://' : '') . $this->host . ':' . $this->puerto;

		$contexto = stream_context_create(array(
			'ssl' => array('verify_peer' => true, 'verify_peer_name' => true),
		));

		$numero = 0;
		$texto  = '';

		$this->conexion = @stream_socket_client(
			$destino,
			$numero,
			$texto,
			$this->tiempoLimite,
			STREAM_CLIENT_CONNECT,
			$contexto
		);

		if (!$this->conexion) {
			$this->error = 'No se pudo conectar con el servidor de correo (' . $texto . ')';
			return false;
		}

		stream_set_timeout($this->conexion, $this->tiempoLimite);

		return $this->esperar(array(220));
	}

	private function saludar()
	{
		$dominio = isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost';

		if (!$this->comando('EHLO ' . $dominio, array(250))) {
			return false;
		}

		if ($this->seguridad === 'tls') {
			if (!$this->comando('STARTTLS', array(220))) {
				return false;
			}

			$cifrado = STREAM_CRYPTO_METHOD_TLS_CLIENT;
			if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
				$cifrado |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
			}
			if (defined('STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT')) {
				$cifrado |= STREAM_CRYPTO_METHOD_TLSv1_1_CLIENT;
			}

			if (!@stream_socket_enable_crypto($this->conexion, true, $cifrado)) {
				$this->error = 'No se pudo activar el cifrado TLS con el servidor de correo.';
				return false;
			}

			// Tras STARTTLS hay que volver a saludar.
			if (!$this->comando('EHLO ' . $dominio, array(250))) {
				return false;
			}
		}

		return true;
	}

	private function autenticar()
	{
		if ($this->usuario === '' && $this->clave === '') {
			return true; // servidor sin autenticación
		}

		if (!$this->comando('AUTH LOGIN', array(334)))                    { return false; }
		if (!$this->comando(base64_encode($this->usuario), array(334)))   { return false; }
		if (!$this->comando(base64_encode($this->clave), array(235)))     { return false; }

		return true;
	}

	private function armarMensaje($de, $deNombre, $para, $paraNombre, $asunto, $cuerpoHtml, $responderA)
	{
		$limite   = '=_sdi_' . md5(uniqid('', true));
		$cuerpoTxt = trim(html_entity_decode(strip_tags(str_replace(
			array('<br>', '<br />', '</p>', '</tr>'),
			"\n",
			$cuerpoHtml
		)), ENT_QUOTES, 'UTF-8'));

		$cabeceras = array();
		$cabeceras[] = 'Date: ' . date('r');
		$cabeceras[] = 'From: ' . $this->nombreCodificado($deNombre) . ' <' . $de . '>';
		$cabeceras[] = 'To: ' . $this->nombreCodificado($paraNombre) . ' <' . $para . '>';

		if ($responderA !== '') {
			$cabeceras[] = 'Reply-To: <' . $responderA . '>';
		}

		$cabeceras[] = 'Subject: ' . $this->nombreCodificado($asunto);
		$cabeceras[] = 'Message-ID: <' . md5(uniqid('', true)) . '@' . $this->host . '>';
		$cabeceras[] = 'MIME-Version: 1.0';
		$cabeceras[] = 'Content-Type: multipart/alternative; boundary="' . $limite . '"';

		$cuerpo   = array();
		$cuerpo[] = '--' . $limite;
		$cuerpo[] = 'Content-Type: text/plain; charset=UTF-8';
		$cuerpo[] = 'Content-Transfer-Encoding: 8bit';
		$cuerpo[] = '';
		$cuerpo[] = $this->protegerPuntos($cuerpoTxt);
		$cuerpo[] = '';
		$cuerpo[] = '--' . $limite;
		$cuerpo[] = 'Content-Type: text/html; charset=UTF-8';
		$cuerpo[] = 'Content-Transfer-Encoding: 8bit';
		$cuerpo[] = '';
		$cuerpo[] = $this->protegerPuntos($cuerpoHtml);
		$cuerpo[] = '';
		$cuerpo[] = '--' . $limite . '--';

		return implode("\r\n", $cabeceras) . "\r\n\r\n" . implode("\r\n", $cuerpo);
	}

	/** Codifica acentos y ñ en las cabeceras del correo. */
	private function nombreCodificado($texto)
	{
		if (preg_match('/^[\x20-\x7E]*$/', $texto)) {
			return $texto;
		}

		return '=?UTF-8?B?' . base64_encode($texto) . '?=';
	}

	/** Una línea con un solo punto cierra el mensaje: hay que duplicarlo. */
	private function protegerPuntos($texto)
	{
		$texto = str_replace(array("\r\n", "\r", "\n"), "\r\n", $texto);
		return preg_replace('/^\./m', '..', $texto);
	}

	private function comando($linea, $codigosEsperados)
	{
		$this->escribir($linea . "\r\n");
		return $this->esperar($codigosEsperados);
	}

	private function escribir($datos)
	{
		if (is_resource($this->conexion)) {
			fwrite($this->conexion, $datos);
		}
	}

	private function esperar($codigosEsperados)
	{
		$respuesta = '';

		while (is_resource($this->conexion) && ($linea = fgets($this->conexion, 515)) !== false) {
			$respuesta .= $linea;

			// Las respuestas de varias líneas usan "250-"; la última usa "250 ".
			if (isset($linea[3]) && $linea[3] === ' ') {
				break;
			}

			$estado = stream_get_meta_data($this->conexion);
			if (!empty($estado['timed_out'])) {
				break;
			}
		}

		$codigo = (int) substr(trim($respuesta), 0, 3);

		if (!in_array($codigo, $codigosEsperados, true)) {
			$this->error = 'El servidor de correo respondió: ' . trim($respuesta);
			return false;
		}

		return true;
	}

	private function cerrar()
	{
		if (is_resource($this->conexion)) {
			fclose($this->conexion);
		}

		$this->conexion = null;
	}
}
