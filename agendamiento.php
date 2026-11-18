<!DOCTYPE html>
<html lang="es">

	<?php
	// Página pública "Reservar hora". El buscador sigue el mismo flujo que el modal
	// "Reservar hora" del escritorio del tutor en VeterChile:
	// 1 Mascota → 2 Búsqueda → 3 Resultado → 4 Fecha y hora → 5 Confirmar.
	// La versión anterior de esta página quedó respaldada en agendamiento_bak_20261113.php.
	$estilos_extra = array(
		'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap',
		'https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.6.13/flatpickr.min.css',
		'assets/css/agenda.css',
		'assets/css/buscador-reserva.css'
	);
	require_once('include/head.php');
	require_once('include/agenda-config.php');

	/**
	 * De dónde saca los datos el buscador:
	 *   'ejemplo' → datos ficticios de assets/js/buscador-reserva-datos.js (sirve para revisar el diseño).
	 *   'api'     → la API de VeterChile ($agenda_api). Ver NOTA_PROGRAMADOR_BUSCADOR.md.
	 */
	$buscador_modo = 'api';
	?>


<body class="ag">

	<?php
	require_once('include/header.php');
	?>

	<main class="shell ag-page" id="agenda">

		<div class="hero-line">
			<h1>Agenda tu hora veterinaria</h1>
			<p>Encuentra al profesional o servicio que tu mascota necesita, cerca de ti, y reserva en pocos pasos.</p>
		</div>

		<section class="bq" id="buscadorReserva"
			data-modo="<?php echo htmlspecialchars($buscador_modo, ENT_QUOTES, 'UTF-8'); ?>"
			data-api="<?php echo htmlspecialchars($agenda_api, ENT_QUOTES, 'UTF-8'); ?>"
			aria-label="Reservar hora">

			<div class="bq-cuerpo">

				<!-- Indicador de pasos: lo arma el JS -->
				<ol class="bq-pasos" id="bqPasos" aria-label="Pasos de la reserva"></ol>

				<div class="bq-alerta" id="bqAlerta" role="alert" hidden></div>

				<!-- PASO 1: MASCOTA -->
				<div class="bq-panel" data-paso="1">
					<div class="bq-panel-encabezado">
						<h3 tabindex="-1">¿Para qué mascota necesitas la hora?</h3>
						<p>Ingresa tu RUT. Si ya estás registrado verás tus mascotas; si no, te registras aquí mismo.</p>
					</div>

					<form class="bq-rut" id="bqFormRut" novalidate>
						<div class="field bq-campo" id="bqCampoRut">
							<label for="bqRut">RUT del tutor</label>
							<input type="text" id="bqRut" placeholder="12.345.678-5" maxlength="12" autocomplete="off" inputmode="text">
							<div class="bq-error">El RUT no es válido. Revisa el dígito verificador.</div>
						</div>
						<button type="submit" class="btn btn-primary" id="bqBuscarRut">Buscar</button>
					</form>

					<!-- Lo que aparece después de buscar el RUT -->
					<div id="bqTutor"></div>
				</div>

				<!-- PASO 2: BÚSQUEDA -->
				<div class="bq-panel" data-paso="2">
					<div class="bq-panel-encabezado">
						<h3 tabindex="-1">¿Cómo quieres buscar tu hora?</h3>
						<p>Elige una forma de búsqueda y completa los datos.</p>
					</div>

					<div class="bq-opciones bq-opciones-3" id="bqModos" role="radiogroup" aria-label="Forma de búsqueda"></div>

					<div class="bq-filtros" id="bqFiltros">
						<div class="field bq-campo" id="bqCampoNombre" hidden>
							<label for="bqNombre">Nombre o RUT del veterinario/a</label>
							<input type="search" id="bqNombre" maxlength="80" autocomplete="off" placeholder="Ej: Patricia Acevedo">
							<div class="bq-error">Ingresa el nombre o el RUT del veterinario/a.</div>
						</div>
						<!-- Servicio y su detalle (especialidad, procedimiento o examen), como en el modal del escritorio -->
						<div class="bq-dos">
							<div class="field bq-campo" id="bqModoServicio">
								<label for="bqServicio">Servicio</label>
								<select id="bqServicio">
									<option value="">Selecciona</option>
								</select>
								<div class="bq-error">Selecciona el servicio.</div>
							</div>
							<div class="field bq-campo" id="bqCampoItem" hidden>
								<label for="bqItem" id="bqItemTitulo">Especialidad</label>
								<select id="bqItem"></select>
								<div class="bq-error">Selecciona una opción.</div>
							</div>
						</div>
						<div class="bq-dos" id="bqUbicacion">
							<div class="field bq-campo" id="bqCampoRegion">
								<label for="bqRegion">Región</label>
								<select id="bqRegion">
									<option value="">Selecciona</option>
								</select>
								<div class="bq-error">Selecciona la región.</div>
							</div>
							<div class="field bq-campo">
								<label for="bqCiudad">Comuna <small>(opcional)</small></label>
								<select id="bqCiudad" disabled>
									<option value="">Elige primero una región</option>
								</select>
							</div>
						</div>
					</div>

					<div class="bq-vacio-servicio" id="bqCementerio" hidden>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>
						<span>Muy pronto podrás reservar cementerio y cremación desde aquí.</span>
					</div>
				</div>

				<!-- PASO 3: RESULTADO -->
				<div class="bq-panel" data-paso="3">
					<div class="bq-panel-encabezado">
						<h3 tabindex="-1" id="bqResultadoTitulo">Elige un veterinario</h3>
						<p id="bqResultadoDetalle">Cada tarjeta muestra la próxima hora disponible. Puedes revisar la ficha antes de reservar.</p>
					</div>
					<div class="bq-resultados" id="bqResultados" aria-live="polite"></div>
				</div>

				<!-- PASO 4: FECHA Y HORA -->
				<div class="bq-panel" data-paso="4">
					<div class="bq-panel-encabezado">
						<h3 tabindex="-1" id="bqFechaTitulo">Elige día y hora</h3>
						<p id="bqFechaDetalle">Los días marcados tienen atención. Al elegir uno verás sus horas libres.</p>
					</div>
					<div id="bqElegido"></div>
					<div id="bqFecha"></div>
				</div>

				<!-- PASO 5: CONFIRMAR -->
				<div class="bq-panel" data-paso="5">
					<div id="bqVistaConfirmar">
						<div class="bq-panel-encabezado">
							<h3 tabindex="-1">Confirma tu reserva</h3>
							<p>Revisa que todo esté bien antes de confirmar. Te enviaremos el comprobante por correo.</p>
						</div>
						<div class="bq-resumen" id="bqResumen"></div>
						<!-- Motivo u observaciones: oculto por ahora (se envía vacío al reservar) -->
						<div class="field" hidden>
							<label for="bqComentarios" id="bqComentariosTitulo">Motivo de la consulta u observaciones <small>(opcional)</small></label>
							<textarea id="bqComentarios" rows="3" maxlength="850" placeholder="Cuéntanos brevemente qué le pasa a tu mascota"></textarea>
						</div>
						<p class="bq-nota">Al confirmar aceptas los <a href="terminosycondiciones.php" target="_blank" rel="noopener">Términos y Condiciones</a> y la <a href="politicasyprivacidad.php" target="_blank" rel="noopener">Política de Privacidad</a>.</p>
					</div>

					<div class="bq-exito" id="bqVistaExito" hidden>
						<div class="bq-exito-icono" aria-hidden="true">
							<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M4 12.5L9.5 18L20 6" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
						</div>
						<h3 tabindex="-1" id="bqExitoTitulo">¡Hora reservada!</h3>
						<p id="bqExitoTexto"></p>
					</div>
				</div>

			</div>

			<!-- Pie: los botones cambian según el paso -->
			<footer class="bq-pie" id="bqPie"></footer>
		</section>

		<!-- Ficha del profesional o del servicio -->
		<div class="bq-modal" id="bqModal" hidden>
			<div class="bq-modal-fondo" data-cerrar-modal></div>
			<div class="bq-modal-caja" role="dialog" aria-modal="true" aria-labelledby="bqModalTitulo">
				<div class="bq-modal-cabecera">
					<h3 id="bqModalTitulo">Ficha</h3>
					<button type="button" class="bq-modal-cerrar" data-cerrar-modal aria-label="Cerrar">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>
					</button>
				</div>
				<div class="bq-modal-cuerpo" id="bqModalCuerpo"></div>
				<div class="bq-modal-pie">
					<button type="button" class="btn btn-ghost btn-sm" data-cerrar-modal>Cerrar</button>
					<button type="button" class="btn btn-primary btn-sm" id="bqModalReservar">Reservar hora</button>
				</div>
			</div>
		</div>

		<noscript>
			<div class="ag-alerta">Para reservar en línea necesitas activar JavaScript. También puedes escribirnos a <a href="mailto:contacto@veterchile.cl">contacto@veterchile.cl</a>.</div>
		</noscript>

	</main>

	<footer>
		<?php
		require_once('include/footer_es.php');
		?>
	</footer>

	<script src="assets/js/jquery-3.6.0.min.js"></script>
	<script src="assets/js/bootstrap.min.js"></script>
	<script src="assets/js/popper.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.6.13/flatpickr.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/flatpickr/4.6.13/l10n/es.min.js"></script>
	<script src="<?php echo sdi_version('assets/js/buscador-reserva-datos.js'); ?>"></script>
	<script src="<?php echo sdi_version('assets/js/buscador-reserva.js'); ?>"></script>

</body>
</html>
