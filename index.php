<!DOCTYPE html>
<html lang="es">

	<?php
	require_once('include/head.php');
	?>


<body class="lp">

	<script>document.documentElement.className += " lp-js";</script>

	<?php
	require_once('include/header.php');
	?>

	<!--HERO-->
	<section class="lp-hero" id="inicio">
		<div class="lp-container">
			<div class="lp-hero__grid">
				<div class="lp-reveal">
					<h1 class="lp-h1 lp-shine">Una sola plataforma para tutores y mascotas, profesionales y centros veterinarios</h1>
					<p class="lp-lead">Contrata el plan del rol que necesitas hoy y suma otros cuando tu operación crezca.</p>

					<div class="lp-btn-row mt-4">
						<a class="lp-btn lp-btn--primary ancla" href="#planes" data-ancla="planes">Ver planes por rol <i class="fa-solid fa-arrow-right"></i></a>
						<a class="lp-btn lp-btn--ghost ancla" href="#contacto" data-ancla="contacto">Hablar con un ejecutivo</a>
					</div>

					<p class="lp-hero__aside">¿Solo necesitas una hora veterinaria para tu mascota? <a href="agendamiento.php">Agenda tu hora aquí</a>.</p>				</div>

				<div class="lp-hero__media lp-reveal" data-delay="1">
					<img src="assets/images/banner.png" width="612" height="408" alt="Plataforma VeterChile en notebook y teléfono móvil">
				</div>
			</div>
		</div>
	</section>

	<!--MÉTRICAS-->
	<section class="lp-metrics">
		<div class="lp-container">
			<div class="lp-metrics__grid">
				<div class="lp-metric lp-reveal">
					<img class="lp-metric__img" src="assets/images/agenda-sdi.png" width="256" height="256" alt="Citas agendadas">
					<h3 class="counter" data-target="30000">30.000</h3>
					<p>Citas agendadas</p>
				</div>
				<div class="lp-metric lp-reveal" data-delay="1">
					<img class="lp-metric__img" src="assets/images/usuario-sdi.png" width="256" height="256" alt="Usuarios activos">
					<h3 class="counter" data-target="10000">10.000</h3>
					<p>Usuarios activos</p>
				</div>
				<div class="lp-metric lp-reveal" data-delay="2">
					<img class="lp-metric__img" src="assets/images/soporte-sdi.png" width="256" height="256" alt="Soporte las 24 horas">
					<h3>24/7</h3>
					<p>Soporte las 24 horas</p>
				</div>
			</div>
		</div>
	</section>

	<!--ROLES-->
	<section class="lp-section" id="roles">
		<div class="lp-container">
			<div class="lp-head lp-reveal">
				<h2 class="lp-h2 lp-shine">Cuatro roles, una misma cuenta</h2>
				<p class="lp-lead">Cada perfil trabaja con las herramientas que realmente necesita. Elige el punto de partida y encuentra tu escritorio listo para operar. Un ecosistema donde cada rol trabaja conectado con los demás.</p>
			</div>

			<div class="lp-plans" id="planes">
				<article class="lp-plan lp-plan--teal lp-reveal">
					<span class="lp-plan__ancla" id="plan-paciente" aria-hidden="true"></span>
					<img class="lp-plan__img" src="assets/images/veterchile/tutor.svg" width="44" height="44" alt="" loading="lazy">
					<h3 class="lp-h3">Plan Tutor</h3>
					<p class="lp-small">Para tutores y sus mascotas</p>
					<span class="lp-plan__meta">Consulta el valor vigente</span>
					<ul>
						<li>Historial clínico digital de cada mascota</li>
						<li>Acceso a documentos clínicos 24/7 (exámenes, informes, imágenes)</li>
						<li>Acceso a la app VeterChile</li>
						<li>Autorizaciones en línea</li>
						<li>Recordatorios por correo y WhatsApp</li>
						<li>Reserva de horas online</li>
						<li>Módulo para mascotas con enfermedades crónicas</li>
						<li>Gestión de todas tus mascotas en una cuenta</li>
						<li>Recetas y órdenes veterinarias digitales</li>
						<li>Teleconsulta integrada</li>
						<li>Historial de pagos, boletas y bonos</li>
					</ul>
					<div class="lp-plan__foot">
						<a class="lp-btn lp-btn--ghost lp-btn--sm lp-btn--block ancla" href="#contacto" data-ancla="contacto">Quiero este plan</a>
					</div>
				</article>

				<article class="lp-plan lp-plan--blue lp-plan--featured lp-reveal" data-delay="1">
					<span class="lp-plan__ancla" id="plan-profesional" aria-hidden="true"></span>
					<img class="lp-plan__img" src="assets/images/veterchile/profesional.svg" width="44" height="44" alt="" loading="lazy">
					<span class="lp-plan__flag">Más contratado</span>
					<h3 class="lp-h3">Plan Profesional</h3>
					<p class="lp-small">Para médicos veterinarios y especialistas</p>
					<span class="lp-plan__meta">Consulta el valor vigente</span>
					<ul>
						<li>Ficha clínica personalizable por especialidad</li>
						<li>Agenda digital</li>
						<li>Recetas y órdenes electrónicas con firma digital</li>
						<li>Teleconsulta</li>
						<li>Consentimientos informados</li>
						<li>Recordatorios automáticos para reducir inasistencias</li>
						<li>Seguimiento de mascotas con enfermedades crónicas</li>
						<li>Interconsultas y derivaciones internas</li>
						<li>Reportes y estadísticas</li>
						<li>Acceso multi-dispositivo con sesión segura</li>
						<li>Delegación de agenda a un asistente</li>
						<li>Historial de atenciones previas de cada mascota</li>
						<li>Notas privadas no visibles para el tutor</li>
						<li>Flujo de caja</li>
						<li>Transcripción de exámenes</li>
					</ul>
					<div class="lp-plan__foot">
						<a class="lp-btn lp-btn--primary lp-btn--sm lp-btn--block ancla" href="#contacto" data-ancla="contacto">Quiero este plan</a>
					</div>
				</article>

				<article class="lp-plan lp-plan--purple lp-reveal" data-delay="2">
					<span class="lp-plan__ancla" id="plan-asistente" aria-hidden="true"></span>
					<img class="lp-plan__img" src="assets/images/veterchile/asistente.svg" width="44" height="44" alt="" loading="lazy">
					<h3 class="lp-h3">Plan Asistente</h3>
					<p class="lp-small">Para secretarias y apoyo clínico</p>
					<span class="lp-plan__meta">Consulta el valor vigente</span>
					<ul>
						<li>Gestión completa de agenda</li>
						<li>Confirmación y anulación de horas</li>
						<li>Envío de recordatorios por correo y WhatsApp</li>
						<li>Registro y actualización de tutores y mascotas</li>
						<li>Apoyo a uno o varios profesionales</li>
						<li>Acceso a las agendas de los profesionales vinculados</li>
						<li>Vinculación a centros veterinarios y sus profesionales</li>
						<li>Modalidad de trabajo remota o presencial</li>
						<li>Perfil publicado en el buscador de asistentes</li>
						<li>Notas internas de gestión de cada tutor y mascota</li>
					</ul>
					<div class="lp-plan__foot">
						<a class="lp-btn lp-btn--ghost lp-btn--sm lp-btn--block ancla" href="#contacto" data-ancla="contacto">Quiero este plan</a>
					</div>
				</article>

				<article class="lp-plan lp-plan--amber lp-reveal" data-delay="3">
					<span class="lp-plan__ancla" id="plan-institucion" aria-hidden="true"></span>
					<img class="lp-plan__img" src="assets/images/veterchile/institucion.svg" width="44" height="44" alt="" loading="lazy">
					<h3 class="lp-h3">Plan Institución</h3>
					<p class="lp-small">Para centros y clínicas veterinarias</p>
					<span class="lp-plan__meta">Cotización a medida</span>
					<ul>
						<li>Múltiples profesionales, especialidades y boxes</li>
						<li>Gestión de casa matriz y sucursales</li>
						<li>Agenda centralizada en tiempo real</li>
						<li>Gestión de boxes y salas de atención</li>
						<li>Módulo monitor de llamados en sala de espera</li>
						<li>Vinculación de profesionales y asistentes al centro</li>
						<li>Administración de usuarios y permisos por rol</li>
						<li>Administración de personal</li>
						<li>Teleconsulta integrada</li>
						<li>Recordatorios automáticos por correo y WhatsApp</li>
						<li>Control de inventario e insumos</li>
						<li>Pagos, boletas y bonos</li>
						<li>Flujos de caja</li>
						<li>Reportes y estadísticas</li>
						<li>Acceso multi-dispositivo con sesión segura</li>
					</ul>
					<div class="lp-plan__foot">
						<a class="lp-btn lp-btn--ghost lp-btn--sm lp-btn--block ancla" href="#contacto" data-ancla="contacto">Solicitar cotización</a>
					</div>
				</article>
			</div>
		</div>
	</section>

	<!--FUNCIONALIDADES-->
	<section class="lp-section" id="funcionalidad" style="background:#FFFFFF;">
		<div class="lp-container">
			<div class="lp-reveal text-center">
				<!--<span class="lp-eyebrow">Funcionalidades</span>-->
				<h2 class="lp-h2 lp-h2--brand lp-shine">Todo lo que necesita una atención de calidad</h2>
			</div>

			<!--Ficha veterinaria única-->
			<div class="lp-feature lp-reveal">
				<div>
					<h3 class="lp-h2">Historial veterinario completo y siempre disponible</h3>
					<p class="lp-body">Accede al historial clínico de cada mascota en un solo lugar, incluyendo sus antecedentes, controles, tratamientos y evolución a lo largo del tiempo. Esta información es clave para brindar una atención veterinaria precisa, ya sea en controles habituales o en situaciones de urgencia, permitiendo tomar decisiones informadas y oportunas junto a su tutor.</p>
				</div>
				<div class="lp-feature__media">
					<img src="assets/images/fmu.png" width="1000" height="905" alt="Ficha veterinaria única de la mascota" loading="lazy">
				</div>
			</div>

			<!--Repositorio de documentos-->
			<div class="lp-feature lp-feature--flip lp-reveal">
				<div>
					<h3 class="lp-h2">Repositorio de documentos, disponible 24/7</h3>
					<p class="lp-body">Tanto tutores como profesionales veterinarios pueden acceder en todo momento a los documentos clínicos de cada mascota desde cualquier dispositivo. Resultados de exámenes, certificados, recetas, informes y más.</p>
				</div>
				<div class="lp-feature__media">
					<img src="assets/images/ro.png" width="1000" height="1000" alt="Repositorio de documentos clínicos" loading="lazy">
				</div>
			</div>

			<!--Fichas por especialidad-->
			<div class="lp-feature lp-reveal">
				<div>
					<h3 class="lp-h2">Fichas clínicas adaptadas a cada especialidad</h3>
					<p class="lp-body">Nuestras fichas de atención han sido diseñadas para responder a las necesidades específicas de cada tipo de mascota y de las distintas especialidades veterinarias. Permiten registrar, visualizar y gestionar la información clínica de manera clara, ordenada y segura, facilitando un diagnóstico preciso y una atención de calidad para cada mascota.</p>
				</div>
				<div class="lp-feature__media">
					<img src="assets/images/atencion-sdi.png" width="1000" height="1000" alt="Fichas clínicas veterinarias por especialidad" loading="lazy">
				</div>
			</div>

			<!--Crónicos-->
			<div class="lp-feature lp-feature--flip lp-reveal">
				<div>
					<h3 class="lp-h2">Atención especializada para mascotas con enfermedades crónicas</h3>
					<p class="lp-body">Contamos con un espacio exclusivo para el seguimiento de mascotas con enfermedades crónicas. Disponemos de una sección dedicada a controles, información para el tutor, recetas y profesionales especialistas.</p>
				</div>
				<div class="lp-feature__media">
					<img src="assets/images/enfermo-cronico.png" width="1000" height="1000" alt="Seguimiento de mascotas con enfermedades crónicas" loading="lazy">
				</div>
			</div>

			<!--Agenda-->
			<div class="lp-feature lp-reveal">
				<div>
					<h3 class="lp-h2">Agenda inteligente para una gestión eficiente</h3>
					<p class="lp-body">Nuestra agenda digital está integrada a cada escritorio de profesionales, tutores, asistentes e instituciones, permitiendo una coordinación fluida en todo momento. Accede fácilmente desde cualquier lugar y dispositivo: computador, tablet o smartphone. Optimiza la gestión de atenciones con programación automatizada, recordatorios por correo o WhatsApp, disponibilidad en tiempo real y organización por especialidades, reduciendo ausencias y mejorando la eficiencia de tu consulta o centro veterinario.</p>
					<div class="lp-feature__tags">
						<span class="lp-tag">Recordatorios</span>
						<span class="lp-tag">Tiempo real</span>
						<span class="lp-tag">Menos ausencias</span>
					</div>
				</div>
				<div class="lp-feature__media">
					<img src="assets/images/agenda_sdi_.png" width="1000" height="1000" alt="Agenda digital" loading="lazy">
				</div>
			</div>

			<!--Gestión administrativa-->
			<div class="lp-feature lp-feature--flip lp-reveal">
				<div>
					<h3 class="lp-h2">Gestión administrativa sin complicaciones</h3>
					<p class="lp-body">Optimiza procesos con herramientas para pagos, estadísticas, control de inventario, reportes y mucho más. Todo lo que tu centro veterinario necesita para una administración eficiente.</p>
					<div class="lp-feature__tags">
						<span class="lp-tag">Pagos</span>
						<span class="lp-tag">Estadísticas</span>
						<span class="lp-tag">Inventario</span>
						<span class="lp-tag">Reportes</span>
					</div>
				</div>
				<div class="lp-feature__media">
					<img src="assets/images/cm.png" width="800" height="800" alt="Gestión administrativa del centro veterinario" loading="lazy">
				</div>
			</div>
		</div>
	</section>

	<!--CÓMO FUNCIONA-->
	<section class="lp-section lp-section--tight" id="como-funciona">
		<div class="lp-container">
			<div class="lp-head lp-reveal">
				<span class="lp-eyebrow">¿Cómo empezar?</span>
				<h2 class="lp-h2 lp-shine">Operativo en cuatro pasos</h2>
				<p class="lp-lead">Sin instalaciones ni servidores propios. Creas tu cuenta, activas el rol que necesitas y comienzas a trabajar.</p>
			</div>

			<div class="lp-steps">
				<div class="lp-step lp-reveal">
					<div class="lp-step__num"></div>
					<h3 class="lp-h3">Crea tu cuenta</h3>
					<p class="lp-body">Registra tu correo electrónico y contraseña, e indica el tipo de inscripción que necesitas.</p>
				</div>
				<div class="lp-step lp-reveal" data-delay="1">
					<div class="lp-step__num"></div>
					<h3 class="lp-h3">Elige tu rol</h3>
					<p class="lp-body">Tutor, profesional, asistente o institución. Cada rol activa su propio escritorio y plan.</p>
				</div>
				<div class="lp-step lp-reveal" data-delay="2">
					<div class="lp-step__num"></div>
					<h3 class="lp-h3">Configura y comienza</h3>
					<p class="lp-body">Carga tus datos, tu agenda y tu equipo. Nuestro soporte te acompaña en la puesta en marcha.</p>
				</div>
				<div class="lp-step lp-reveal" data-delay="3">
					<div class="lp-step__num"></div>
					<h3 class="lp-h3">Suma roles cuando quieras</h3>
					<p class="lp-body">Agrega otro plan a la misma cuenta y cambia de escritorio sin perder tu información.</p>
				</div>
			</div>
		</div>
	</section>


	<!--ALIANZAS-->
	<section class="lp-section lp-section--tight" id="alianzas">
		<div class="lp-container">
			<div class="lp-head lp-reveal">
				<h2 class="lp-h2 lp-shine">Nuestras alianzas</h2>
			</div>
			<div class="lp-logos lp-reveal">
				<img src="assets/images/veterchile/veterfarma.png" alt="Veterfarma" width="381" height="84" loading="lazy">
				<img src="assets/images/veterchile/veterfood.svg" alt="Veterfood" width="595" height="158" loading="lazy">
			</div>
		</div>
	</section>

	<!--PREGUNTAS FRECUENTES-->
	<section class="lp-section lp-section--tight" style="background:#FFFFFF;">
		<div class="lp-container lp-container--narrow">
			<div class="lp-head lp-reveal">
				<h2 class="lp-h2">Preguntas frecuentes</h2>
			</div>

			<div id="miAcordeon" class="accordion lp-faq lp-reveal">
				<div class="card">
					<div class="card-header border-bottom" id="cabecera2">
						<h2 class="mb-0">
							<button class="btn btn-acc collapsed" type="button"
									data-toggle="collapse" data-target="#colapso2"
									aria-expanded="false" aria-controls="colapso2">
								¿Cómo me registro?
							</button>
						</h2>
					</div>
					<div id="colapso2" class="collapse" aria-labelledby="cabecera2" data-parent="#miAcordeon">
						<div class="card-body">
							<p>Completa el formulario de <strong>contacto</strong> de esta página o escríbenos a través de <a href="https://veterchile.cl/Ingreso" target="_blank" rel="noopener">www.veterchile.cl</a>. Uno de nuestros ejecutivos te responderá con los planes disponibles para tu rol. Para crear una cuenta <a href="https://veterchile.cl/Ingreso" target="_blank" rel="noopener">pincha acá</a>.</p>
						</div>
					</div>
				</div>

				<div class="card">
					<div class="card-header border-bottom" id="cabecera3">
						<h2 class="mb-0">
							<button class="btn btn-acc collapsed" type="button"
									data-toggle="collapse" data-target="#colapso3"
									aria-expanded="false" aria-controls="colapso3">
								¿Puedo tener más de un rol en la misma cuenta?
							</button>
						</h2>
					</div>
					<div id="colapso3" class="collapse" aria-labelledby="cabecera3" data-parent="#miAcordeon">
						<div class="card-body">
							<p>Sí. Los roles se suman a una misma cuenta contratando el plan correspondiente a cada uno. Un profesional puede ser también tutor de sus propias mascotas, y un tutor puede administrar un centro veterinario. Cada rol tiene su propio escritorio y cambias entre ellos sin volver a registrarte.</p>
						</div>
					</div>
				</div>

				<div class="card">
					<div class="card-header border-bottom" id="cabecera4">
						<h2 class="mb-0">
							<button class="btn btn-acc collapsed" type="button"
									data-toggle="collapse" data-target="#colapso4"
									aria-expanded="false" aria-controls="colapso4">
								¿Necesito instalar algo para usar la plataforma?
							</button>
						</h2>
					</div>
					<div id="colapso4" class="collapse" aria-labelledby="cabecera4" data-parent="#miAcordeon">
						<div class="card-body">
							<p>No. Se accede desde cualquier lugar y dispositivo con conexión a internet: computador, tablet o smartphone.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!--CONTACTO-->
	<section class="lp-section lp-contact" id="contacto">
		<div class="lp-container">
			<div class="lp-head lp-reveal">
				<h2 class="lp-h2">Contacto</h2>
				<p class="lp-lead">Envíanos tu mensaje y nuestro equipo te responderá a la brevedad</p>
			</div>

			<div class="lp-contact__card lp-reveal">
				<div class="lp-contact__form">
					<?php require('include/form-contacto.php'); ?>
				</div>

				<div class="lp-contact__side">
					<h3 class="lp-h3">Datos de contacto</h3>

					<div class="lp-info">
						<img class="lp-info__img" src="assets/images/ubicacion.svg" width="64" height="64" alt="Dirección">
						<div>
							<b>Dirección</b>
							<span>Las Pimpinelas 765, Concón, Región de Valparaíso.</span>
						</div>
					</div>

					<div class="lp-info">
						<img class="lp-info__img" src="assets/images/email.svg" width="64" height="64" alt="Correo electrónico">
						<div>
							<b>Correo electrónico</b>
							<span><a href="mailto:contacto@veterchile.cl">contacto@veterchile.cl</a></span>
						</div>
					</div>

					<div class="lp-info">
						<img class="lp-info__img" src="assets/images/telefono.svg" width="64" height="64" alt="Teléfono">
						<div>
							<b>Teléfono</b>
							<span><a href="https://api.whatsapp.com/send?phone=56984882443" target="_blank" rel="noopener" title="Escríbenos por WhatsApp">+569 8488 2443</a></span>
						</div>
					</div>

					<div class="lp-map">
						<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.808718081063!2d-71.54673352531734!3d-32.92965167360025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9689c2c9420f795d%3A0xf877657f474acdef!2sLas%20Pimpinelas%20765%2C%202510080%20Conc%C3%B3n%2C%20Valpara%C3%ADso!5e0!3m2!1ses!2scl!4v1756266144402!5m2!1ses!2scl" width="100%" height="330" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Ubicación de VeterChile"></iframe>
					</div>
				</div>
			</div>
		</div>
	</section>


	<footer>
		<?php
		require_once('include/footer_es.php');
		?>
	</footer>

	<script src="assets/js/jquery-3.6.0.min.js"></script>
	<script src="assets/js/bootstrap.min.js"></script>
	<script src="assets/js/popper.min.js"></script>
	<script src="assets/js/modals.js"></script>
	<script src="assets/js/aos.js"></script>
	<script src="assets/js/contacto.js"></script>

	<script>
    // Animación de contador
    $(".counter").each(function () {
      var $this = $(this);
      var target = +$this.attr("data-target");
      var count = 0;
      var speed = target / 500; // velocidad

      var interval = setInterval(function () {
        count += Math.ceil(speed);
        if (count >= target) {
          count = target;
          clearInterval(interval);
        }
        $this.text(count.toLocaleString()); // con separador de miles
      }, 30); // refresco cada 30ms
    });
  </script>

	<script>
	  $(document).ready(function(){
	    $(".ancla").click(function(evento){
	      evento.preventDefault();
	      var codigo = "#" + $(this).data("ancla");
	      $("html,body").animate({scrollTop: $(codigo).offset().top - 90}, 900);
	    });
	  });
	</script>
	<script>
	  $(document).ready(function(){
	    $("#boton").click(function(evento){
	      $("html,body").animate({scrollTop:0}, "slow");
	    });
	  });
	</script>
	<script>
	  AOS.init();
	</script>

	<script>
	// Aparición progresiva de las secciones al hacer scroll
	(function () {
		var bloques = document.querySelectorAll(".lp-reveal");

		function mostrarTodo() {
			for (var i = 0; i < bloques.length; i++) {
				bloques[i].classList.add("is-visible");
			}
		}

		if (!("IntersectionObserver" in window)) {
			mostrarTodo();
			return;
		}

		var observador = new IntersectionObserver(function (entradas) {
			entradas.forEach(function (entrada) {
				if (entrada.isIntersecting) {
					entrada.target.classList.add("is-visible");
					observador.unobserve(entrada.target);
				}
			});
		}, { threshold: 0.15, rootMargin: "0px 0px -110px 0px" });

		for (var i = 0; i < bloques.length; i++) {
			observador.observe(bloques[i]);
		}

		/* Resguardo: solo si el observador nunca llegó a marcar nada, lo que
		   indicaría que falló. Antes esto mostraba todo a los 2,5 segundos y se
		   perdía la aparición al hacer scroll en las secciones de más abajo. */
		setTimeout(function () {
			if (!document.querySelector(".lp-reveal.is-visible")) {
				mostrarTodo();
			}
		}, 3000);
	})();
	</script>

	<script>
document.addEventListener("scroll", function() {
    document.querySelectorAll(".fade-block").forEach(el => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight - 80) {
            el.classList.add("visible");
        }
    });
});
</script>

<script>
window.addEventListener("scroll", function() {
    const nav = document.querySelector(".navbar");
    nav.classList.toggle("scrolled", window.scrollY > 50);
});
</script>


</body>
</html>
