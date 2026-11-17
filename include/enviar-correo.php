<?php
/**
 * Envío del correo con dos caminos, en este orden:
 *
 *   1. SMTP autenticado, si en mail-config.php hay una contraseña real.
 *   2. La función mail() del servidor, como respaldo.
 *
 * El respaldo importa: en los hosting tipo cPanel, el sitio y la casilla
 * viven en el mismo servidor, así que mail() entrega el mensaje de forma
 * local sin necesidad de contraseña. En un servidor local (Laragon, XAMPP)
 * ese camino no funciona y hay que configurar el SMTP.
 */

require_once __DIR__ . '/mail-config.php';

/** ¿La contraseña SMTP está realmente configurada? */
function sdi_smtp_configurado()
{
	if (!defined('MAIL_METODO') || MAIL_METODO !== 'smtp') {
		return false;
	}

	if (!defined('SMTP_CLAVE') || trim(SMTP_CLAVE) === '') {
		return false;
	}

	// Valor de ejemplo que viene en el archivo de configuración.
	return stripos(SMTP_CLAVE, 'COMPLETAR') === false;
}

/** Envía por SMTP. Devuelve array(ok, detalle). */
function sdi_enviar_por_smtp($asunto, $cuerpo, $responderA)
{
	require_once __DIR__ . '/smtp.php';

	$smtp = new SdiSmtp(SMTP_HOST, SMTP_PUERTO, SMTP_SEGURIDAD, SMTP_USUARIO, SMTP_CLAVE);

	$ok = $smtp->enviar(
		MAIL_REMITENTE,
		MAIL_REMITENTE_NOMBRE,
		MAIL_DESTINO,
		MAIL_DESTINO_NOMBRE,
		$asunto,
		$cuerpo,
		$responderA,
		MAIL_COPIA_OCULTA
	);

	return array(
		'ok'      => $ok,
		'detalle' => $ok ? '' : 'SMTP: ' . $smtp->error,
	);
}

/** Envía con la función mail() del servidor. Devuelve array(ok, detalle). */
function sdi_enviar_por_mail($asunto, $cuerpo, $responderA)
{
	if (!function_exists('mail')) {
		return array('ok' => false, 'detalle' => 'mail(): la función está deshabilitada en el servidor.');
	}

	$cabeceras  = 'MIME-Version: 1.0' . "\r\n";
	$cabeceras .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";
	$cabeceras .= 'From: =?UTF-8?B?' . base64_encode(MAIL_REMITENTE_NOMBRE) . '?= <' . MAIL_REMITENTE . '>' . "\r\n";
	$cabeceras .= 'Reply-To: <' . $responderA . '>' . "\r\n";

	if (MAIL_COPIA_OCULTA !== '') {
		$cabeceras .= 'Bcc: ' . MAIL_COPIA_OCULTA . "\r\n";
	}

	$ok = @mail(
		MAIL_DESTINO,
		'=?UTF-8?B?' . base64_encode($asunto) . '?=',
		$cuerpo,
		$cabeceras,
		'-f' . MAIL_REMITENTE
	);

	return array(
		'ok'      => (bool) $ok,
		'detalle' => $ok ? '' : 'mail(): el servidor no pudo entregar el mensaje.',
	);
}

/**
 * Envía el correo probando los caminos disponibles.
 * Devuelve array('ok' => bool, 'detalle' => string, 'via' => string).
 */
function sdi_enviar_correo($asunto, $cuerpo, $responderA)
{
	$fallos = array();

	if (sdi_smtp_configurado()) {
		$intento = sdi_enviar_por_smtp($asunto, $cuerpo, $responderA);

		if ($intento['ok']) {
			return array('ok' => true, 'detalle' => '', 'via' => 'smtp');
		}

		$fallos[] = $intento['detalle'];
	} else {
		$fallos[] = 'SMTP: sin contraseña configurada, se omite este camino.';
	}

	$intento = sdi_enviar_por_mail($asunto, $cuerpo, $responderA);

	if ($intento['ok']) {
		return array('ok' => true, 'detalle' => '', 'via' => 'mail');
	}

	$fallos[] = $intento['detalle'];

	return array('ok' => false, 'detalle' => implode(' | ', $fallos), 'via' => '');
}
