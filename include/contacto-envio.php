<?php
/**
 * Recibe los formularios de contacto del sitio (portada y página de contacto)
 * y envía el mensaje a la casilla definida en mail-config.php.
 *
 * Responde en JSON cuando el formulario se envía por AJAX y, si el visitante
 * tiene JavaScript desactivado, vuelve a la página con un aviso en la URL.
 */

require_once __DIR__ . '/mail-config.php';
require_once __DIR__ . '/enviar-correo.php';

/* --------------------------------------------------------------------------
   Utilidades
   -------------------------------------------------------------------------- */

/**
 * Deja el texto en UTF-8 válido. Si el navegador envía otra codificación,
 * las expresiones regulares con /u fallarían y se perdería el contenido.
 */
function sdi_normalizar($valor)
{
	$valor = is_string($valor) ? $valor : '';

	if (!mb_check_encoding($valor, 'UTF-8')) {
		$valor = mb_convert_encoding($valor, 'UTF-8', 'ISO-8859-1');
	}

	return $valor;
}

/** Limpia el texto y evita que se inyecten cabeceras en el correo. */
function sdi_limpiar($valor, $largoMaximo = 200)
{
	$valor = sdi_normalizar($valor);
	$valor = str_replace(array("\r", "\n", "%0a", "%0d"), ' ', $valor);

	$limpio = preg_replace('/\s+/u', ' ', $valor);
	$valor  = trim($limpio === null ? $valor : $limpio);

	return mb_substr($valor, 0, $largoMaximo, 'UTF-8');
}

/** Igual que la anterior, pero conserva los saltos de línea del mensaje. */
function sdi_limpiar_texto($valor, $largoMaximo = 4000)
{
	$valor = sdi_normalizar($valor);
	$valor = str_replace("\r\n", "\n", $valor);

	// Quita caracteres de control, menos el salto de línea.
	$limpio = preg_replace('/[^\P{C}\n]+/u', '', $valor);
	$valor  = trim($limpio === null ? $valor : $limpio);

	return mb_substr($valor, 0, $largoMaximo, 'UTF-8');
}

function sdi_es_ajax()
{
	return isset($_SERVER['HTTP_X_REQUESTED_WITH'])
		&& strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

function sdi_registrar($mensaje)
{
	if (!defined('MAIL_LOG') || MAIL_LOG === '') {
		return;
	}

	$carpeta = dirname(MAIL_LOG);

	if (!is_dir($carpeta)) {
		@mkdir($carpeta, 0755, true);
	}

	@file_put_contents(
		MAIL_LOG,
		'[' . date('Y-m-d H:i:s') . '] ' . $mensaje . PHP_EOL,
		FILE_APPEND
	);
}

/** Cierra la petición: JSON para AJAX, redirección para envíos normales. */
function sdi_responder($ok, $mensaje, $volverA = '')
{
	if (sdi_es_ajax()) {
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode(array('ok' => $ok, 'mensaje' => $mensaje));
		exit;
	}

	$destino = $volverA !== '' ? $volverA : '../index.php';
	$destino = strtok($destino, '#');
	$union   = strpos($destino, '?') === false ? '?' : '&';

	header('Location: ' . $destino . $union . 'contacto=' . ($ok ? 'ok' : 'error') . '#contacto');
	exit;
}

/* --------------------------------------------------------------------------
   Validación de los datos recibidos
   -------------------------------------------------------------------------- */

$volverA = isset($_POST['origen']) ? sdi_limpiar($_POST['origen'], 120) : '';
$volverA = preg_match('/^[a-zA-Z0-9._-]+\.php$/', $volverA) ? '../' . $volverA : '';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	sdi_responder(false, 'Solicitud no válida.', $volverA);
}

// Campo trampa: los robots de spam lo completan, las personas no lo ven.
if (!empty($_POST['sitio_web'])) {
	sdi_responder(true, 'Gracias por escribirnos. Te responderemos a la brevedad.', $volverA);
}

$nombre     = sdi_limpiar(isset($_POST['nombre']) ? $_POST['nombre'] : '', 120);
$email      = sdi_limpiar(isset($_POST['email']) ? $_POST['email'] : '', 150);
$fono       = sdi_limpiar(isset($_POST['fono']) ? $_POST['fono'] : '', 40);
$asunto     = sdi_limpiar(isset($_POST['asunto']) ? $_POST['asunto'] : '', 150);
$comentario = sdi_limpiar_texto(isset($_POST['comentario']) ? $_POST['comentario'] : '', 4000);

$errores = array();

if ($nombre === '') {
	$errores[] = 'el nombre';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
	$errores[] = 'un correo electrónico válido';
}
if ($fono === '') {
	$errores[] = 'el teléfono';
}
if ($asunto === '') {
	$errores[] = 'el asunto';
}
if ($comentario === '') {
	$errores[] = 'el mensaje';
}

if (!empty($errores)) {
	sdi_responder(false, 'Falta completar ' . implode(', ', $errores) . '.', $volverA);
}

/* --------------------------------------------------------------------------
   Armado del correo
   -------------------------------------------------------------------------- */

$origenPagina = $volverA !== '' ? str_replace('../', '', $volverA) : 'sitio web';
$fecha        = date('d-m-Y H:i');

$asuntoCorreo = 'Contacto web: ' . $asunto;

$cuerpo  = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#16203A;line-height:1.6">';
$cuerpo .= '<h2 style="font-size:17px;color:#0B2148;margin:0 0 14px">Nuevo mensaje del formulario de contacto</h2>';
$cuerpo .= '<table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse;font-size:14px">';
$cuerpo .= '<tr><td style="color:#55617A"><b>Nombre</b></td><td>' . htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') . '</td></tr>';
$cuerpo .= '<tr><td style="color:#55617A"><b>Correo</b></td><td>' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</td></tr>';
$cuerpo .= '<tr><td style="color:#55617A"><b>Teléfono</b></td><td>' . htmlspecialchars($fono, ENT_QUOTES, 'UTF-8') . '</td></tr>';
$cuerpo .= '<tr><td style="color:#55617A"><b>Asunto</b></td><td>' . htmlspecialchars($asunto, ENT_QUOTES, 'UTF-8') . '</td></tr>';
$cuerpo .= '</table>';
$cuerpo .= '<p style="margin:16px 0 6px;color:#55617A"><b>Mensaje</b></p>';
$cuerpo .= '<p style="margin:0;padding:12px 14px;background:#F6F8FC;border-left:3px solid #0F9C9C">'
	. nl2br(htmlspecialchars($comentario, ENT_QUOTES, 'UTF-8')) . '</p>';
$cuerpo .= '<p style="margin:18px 0 0;font-size:12px;color:#6B7690">Enviado el ' . $fecha
	. ' desde ' . htmlspecialchars($origenPagina, ENT_QUOTES, 'UTF-8') . '.</p>';
$cuerpo .= '</div>';

/* --------------------------------------------------------------------------
   Envío
   -------------------------------------------------------------------------- */

$resultado = sdi_enviar_correo($asuntoCorreo, $cuerpo, $email);
$enviado   = $resultado['ok'];
$detalle   = $resultado['detalle'];

if ($enviado) {
	// Se registra también el envío correcto: si un mensaje no llega, el registro
	// dice por qué camino salió y ayuda a ubicar dónde se perdió.
	sdi_registrar('OK via ' . $resultado['via'] . ' | desde ' . $origenPagina . ' | de ' . $email);

	sdi_responder(true, '¡Gracias por escribirnos! Recibimos tu mensaje y te responderemos a la brevedad.', $volverA);
}

sdi_registrar('FALLO | desde ' . $origenPagina . ' | de ' . $email . ' | ' . $detalle);

sdi_responder(
	false,
	'No pudimos enviar tu mensaje en este momento. Escríbenos directamente a ' . MAIL_DESTINO . ' o llámanos al +569 8488 2443.',
	$volverA
);
