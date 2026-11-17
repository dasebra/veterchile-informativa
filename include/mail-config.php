<?php
/**
 * Configuración del envío de correos del formulario de contacto.
 *
 * Solo hay que editar los valores de este archivo. Si el hosting permite
 * enviar con la función mail() de PHP, deja MAIL_METODO en 'mail'.
 * Si el correo se envía desde una casilla propia (recomendado y lo que
 * normalmente exige el hosting), deja 'smtp' y completa los datos.
 */

// ---------------------------------------------------------------------------
// Destinatario: aquí llegan todos los mensajes del formulario de contacto.
// ---------------------------------------------------------------------------
define('MAIL_DESTINO',        'contacto@veterchile.cl');
define('MAIL_DESTINO_NOMBRE', 'VeterChile');

// ---------------------------------------------------------------------------
// Remitente: debe ser una casilla del propio dominio. Nunca uses el correo
// que escribe el visitante, porque los servidores lo rechazan como spam.
// El correo del visitante se agrega como "Responder a", así que al pulsar
// Responder en el gestor de correo se le contesta directamente a él.
// ---------------------------------------------------------------------------
define('MAIL_REMITENTE',        'contacto@med-sdi.cl');
define('MAIL_REMITENTE_NOMBRE', 'Formulario web SDI');

// ---------------------------------------------------------------------------
// Método de envío: 'smtp' o 'mail'
//
// Con 'smtp' el sitio intenta primero el envío autenticado y, si no lo logra
// (por ejemplo, porque falta la contraseña), usa la función mail() del
// servidor como respaldo. En los hosting donde el sitio y la casilla están en
// el mismo servidor, ese respaldo suele bastar sin configurar nada más.
// ---------------------------------------------------------------------------
define('MAIL_METODO', 'smtp');

// ---------------------------------------------------------------------------
// Datos SMTP (solo se usan si MAIL_METODO es 'smtp').
// Pídelos al proveedor de hosting o del correo corporativo.
//   SMTP_SEGURIDAD: 'tls' (puerto 587), 'ssl' (puerto 465) o 'ninguna' (25)
// ---------------------------------------------------------------------------
define('SMTP_HOST',      'mail.med-sdi.cl');
define('SMTP_PUERTO',    587);
define('SMTP_SEGURIDAD', 'tls');
define('SMTP_USUARIO',   'contacto@med-sdi.cl');
define('SMTP_CLAVE',     'COMPLETAR-CLAVE-DEL-CORREO');

// ---------------------------------------------------------------------------
// Copia oculta opcional (deja '' si no se necesita).
// ---------------------------------------------------------------------------
define('MAIL_COPIA_OCULTA', '');

// ---------------------------------------------------------------------------
// Registro de envíos fallidos. Sirve para revisar problemas de configuración.
// ---------------------------------------------------------------------------
define('MAIL_LOG', __DIR__ . '/../logs/contacto.log');

// ---------------------------------------------------------------------------
// Palabra clave para abrir la página de diagnóstico probar-correo.php.
// Con el valor vacío, esa página queda desactivada (responde "no encontrado").
// Pon una palabra que solo tú conozcas, revisa el envío y luego vuelve a
// dejarla vacía o borra el archivo probar-correo.php del servidor.
// ---------------------------------------------------------------------------
define('MAIL_DIAG_CLAVE', '');
