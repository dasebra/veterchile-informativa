<?php
/**
 * Formulario de contacto del sitio.
 * Se incluye tal cual en la portada (index.php) y en la página de contacto
 * (contactosdi.php) para que ambos sean idénticos.
 *
 * Los mensajes se envían con include/contacto-envio.php.
 */

$sdi_pagina = basename($_SERVER['PHP_SELF']);
$sdi_aviso  = isset($_GET['contacto']) ? $_GET['contacto'] : '';
?>
<form id="form-contact" class="lp-form" action="include/contacto-envio.php" method="post" novalidate>

	<input type="hidden" name="origen" value="<?php echo htmlspecialchars($sdi_pagina, ENT_QUOTES, 'UTF-8'); ?>">

	<?php if ($sdi_aviso === 'ok') : ?>
		<div class="lp-form-msg lp-form-msg--ok" role="status">¡Gracias por escribirnos! Recibimos tu mensaje y te responderemos a la brevedad.</div>
	<?php elseif ($sdi_aviso === 'error') : ?>
		<div class="lp-form-msg lp-form-msg--error" role="alert">No pudimos enviar tu mensaje. Escríbenos directamente a contacto@veterchile.cl o llámanos al +569 8488 2443.</div>
	<?php endif; ?>

	<div class="form-row">
		<div class="form-group col-12">
			<label for="nombre">Nombre y Apellido *</label>
			<input id="nombre" name="nombre" type="text" class="form-control form-control-sm rounded-xl" autocomplete="name" maxlength="120" required>
		</div>
	</div>
	<div class="form-row">
		<div class="form-group col-12 col-md-6">
			<label for="email">Correo electrónico *</label>
			<input id="email" name="email" type="email" class="form-control form-control-sm rounded-xl" autocomplete="email" maxlength="150" required>
		</div>
		<div class="form-group col-12 col-md-6">
			<label for="fono">Teléfono *</label>
			<input id="fono" name="fono" type="tel" class="form-control form-control-sm rounded-xl" autocomplete="tel" maxlength="40" required>
		</div>
	</div>
	<div class="form-row">
		<div class="form-group col-12">
			<label for="asunto">Asunto *</label>
			<input id="asunto" name="asunto" type="text" class="form-control form-control-sm rounded-xl" maxlength="150" required>
		</div>
		<div class="form-group col-12">
			<label for="comentario">Mensaje *</label>
			<textarea class="form-control form-control-sm rounded-xl" placeholder="Cuéntanos qué rol necesitas y cómo podemos ayudarte" id="comentario" name="comentario" rows="5" maxlength="4000" required></textarea>
		</div>

		<!-- Campo trampa contra el spam: queda oculto para las personas. -->
		<div class="lp-form-trampa" aria-hidden="true">
			<label for="sitio_web">No completar este campo</label>
			<input id="sitio_web" name="sitio_web" type="text" tabindex="-1" autocomplete="off">
		</div>

		<div class="form-group col-12 mb-0">
			<button type="submit" class="btn btn-azul btn-block  rounded-xl" name="button" id="button" value="Enviar">ENVIAR MENSAJE</button>
		</div>
	</div>
</form>
