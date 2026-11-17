<?php
/**
 * Diagnóstico del envío de correo.
 *
 * Sirve para comprobar si el servidor puede entregar los mensajes del
 * formulario de contacto y, si no puede, ver el motivo exacto.
 *
 * CÓMO USARLO
 *   1. En include/mail-config.php, dale un valor a MAIL_DIAG_CLAVE
 *      (una palabra cualquiera que solo tú conozcas).
 *   2. Abre en el navegador:  /probar-correo.php?clave=TU_PALABRA
 *   3. Cuando termines de configurar, BORRA este archivo del servidor.
 *
 * Mientras MAIL_DIAG_CLAVE esté vacía, esta página no funciona.
 */

require_once __DIR__ . '/include/mail-config.php';
require_once __DIR__ . '/include/enviar-correo.php';

header('Content-Type: text/html; charset=utf-8');

$clave = defined('MAIL_DIAG_CLAVE') ? MAIL_DIAG_CLAVE : '';

if ($clave === '' || !isset($_GET['clave']) || !hash_equals($clave, (string) $_GET['clave'])) {
	http_response_code(404);
	echo 'No encontrado.';
	exit;
}

$probar = isset($_GET['enviar']);
$envio  = null;

if ($probar) {
	$cuerpo = '<p>Mensaje de prueba enviado desde el diagnóstico del sitio el '
		. date('d-m-Y H:i') . '.</p><p>Si lo estás leyendo, el formulario de contacto '
		. 'puede entregar correos correctamente.</p>';

	$envio = sdi_enviar_correo('Prueba de configuración del formulario', $cuerpo, MAIL_REMITENTE);
}

/** Pinta una fila del cuadro de estado. */
function fila($titulo, $valor, $estado = '')
{
	$colores = array('ok' => '#0B7C7C', 'mal' => '#9E2A2A', '' => '#3A3A46');
	$color   = isset($colores[$estado]) ? $colores[$estado] : $colores[''];

	echo '<tr><td style="padding:9px 14px;border-bottom:1px solid #E5E5EA;color:#55617A">'
		. htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8')
		. '</td><td style="padding:9px 14px;border-bottom:1px solid #E5E5EA;color:' . $color . ';font-weight:600">'
		. htmlspecialchars($valor, ENT_QUOTES, 'UTF-8') . '</td></tr>';
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Diagnóstico de correo</title>
	<style>
		body { font-family: Arial, Helvetica, sans-serif; background: #F6F8FC; color: #16203A; margin: 0; padding: 36px 18px; }
		.caja { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #E3E8F2; border-radius: 16px; padding: 28px 30px; }
		h1 { font-size: 21px; margin: 0 0 6px; color: #0B2148; }
		p.sub { margin: 0 0 22px; color: #6B7690; font-size: 14px; }
		table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 22px; }
		.aviso { padding: 14px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; margin-bottom: 20px; }
		.aviso--ok { background: #E1F5F4; border: 1px solid rgba(15,156,156,.35); color: #0B7C7C; }
		.aviso--mal { background: #FDECEC; border: 1px solid rgba(190,60,60,.28); color: #9E2A2A; }
		.btn { display: inline-block; padding: 12px 22px; border-radius: 999px; background: #113b8c; color: #fff; text-decoration: none; font-size: 14px; font-weight: 700; }
		code { background: #F4F6FA; padding: 2px 6px; border-radius: 5px; font-size: 13px; }
	</style>
</head>
<body>
	<div class="caja">
		<h1>Diagnóstico de correo</h1>
		<p class="sub">Comprueba si el servidor puede entregar los mensajes del formulario de contacto.</p>

		<?php if ($envio !== null) : ?>
			<?php if ($envio['ok']) : ?>
				<div class="aviso aviso--ok">
					<strong>Mensaje enviado.</strong> Se entregó por
					<code><?php echo htmlspecialchars($envio['via'], ENT_QUOTES, 'UTF-8'); ?></code>.
					Revisa la bandeja de <?php echo htmlspecialchars(MAIL_DESTINO, ENT_QUOTES, 'UTF-8'); ?>
					(mira también la carpeta de spam). El formulario ya está operativo.
				</div>
			<?php else : ?>
				<div class="aviso aviso--mal">
					<strong>No se pudo enviar.</strong><br>
					<?php echo htmlspecialchars($envio['detalle'], ENT_QUOTES, 'UTF-8'); ?>
				</div>
			<?php endif; ?>
		<?php endif; ?>

		<table>
			<?php
			fila('Destinatario', MAIL_DESTINO);
			fila('Remitente', MAIL_REMITENTE);
			fila('Método configurado', MAIL_METODO);
			fila('Servidor SMTP', SMTP_HOST . ':' . SMTP_PUERTO . ' (' . SMTP_SEGURIDAD . ')');
			fila('Usuario SMTP', SMTP_USUARIO);
			fila(
				'Contraseña SMTP',
				sdi_smtp_configurado() ? 'configurada' : 'sin configurar (se usará mail() como respaldo)',
				sdi_smtp_configurado() ? 'ok' : 'mal'
			);
			fila(
				'Función mail() del servidor',
				function_exists('mail') ? 'disponible' : 'deshabilitada',
				function_exists('mail') ? 'ok' : 'mal'
			);
			fila('Versión de PHP', PHP_VERSION);
			?>
		</table>

		<a class="btn" href="?clave=<?php echo urlencode($_GET['clave']); ?>&amp;enviar=1">Enviar un correo de prueba</a>

		<p style="margin-top:24px;font-size:13px;color:#6B7690;line-height:1.6">
			Cuando el envío funcione, <strong>borra este archivo del servidor</strong>
			(<code>probar-correo.php</code>). No es necesario para que el sitio funcione.
		</p>
	</div>
</body>
</html>
