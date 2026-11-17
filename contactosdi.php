<!DOCTYPE html>
<html lang="es">

	<?php
	require_once('include/head.php');
	?>


<body class="lp">

	<script>document.documentElement.className += " lp-js";</script>

	<?php
	require_once('include/header-dos.php');
	?>

	<!--CONTACTO-->
	<section class="lp-section lp-section--page-top lp-contact" id="contacto">
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

	<!-- PREGUNTAS FRECUENTES (oculto por ahora)
	<div class="container">
		<div class="row">
			<div class="col-md-8 mx-auto">
				<div id="miAcordeon" class="accordion mt-8 mb-5">
					<h5 class="mb-3 t-azul-oscuro">Preguntas frecuentes</h5>

					<div class="card">
						<div class="card-header border-bottom" id="cabecera1">
							<h2 class="mb-0">
								<button class="btn btn-acc collapsed" type="button"
										data-toggle="collapse" data-target="#colapso1"
										aria-expanded="false" aria-controls="colapso1">
									¿Cómo inscribirse en SALUD DIGITAL INTEGRADA?
								</button>
							</h2>
						</div>
						<div id="colapso1" class="collapse" aria-labelledby="cabecera1" data-parent="#miAcordeon">
							<div class="card-body text-justify">
								<p>Ingresa a www.med-sdi.cl e ingresar correo electrónico, contraseña y seleccione el tipo de inscripción que requiere (Paciente, Profesionales, Servicios, Instituciones).</p>
							</div>
						</div>
					</div>

					<div class="card">
						<div class="card-header border-bottom" id="cabecera2">
							<h2 class="mb-0">
								<button class="btn btn-acc" type="button"
										data-toggle="collapse" data-target="#colapso2"
										aria-expanded="true" aria-controls="colapso2">
									¿Cómo inscribirse en Salud Digital Integrada?
								</button>
							</h2>
						</div>
						<div id="colapso2" class="collapse" aria-labelledby="cabecera2" data-parent="#miAcordeon">
							<div class="card-body border-bottom text-justify">
								Escríbenos a través de nuestra página web www.med-sdi.cl, completa el formulario de CONTACTO y uno de nuestros ejecutivos te responderá lo antes posible.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	-->

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
		}, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

		for (var i = 0; i < bloques.length; i++) {
			observador.observe(bloques[i]);
		}

		// Resguardo: si el observador no alcanza a actuar, el contenido igual se muestra.
		setTimeout(mostrarTodo, 2500);
	})();
	</script>

	<script>
	window.addEventListener("scroll", function() {
	    const nav = document.querySelector(".navbar");
	    nav.classList.toggle("scrolled", window.scrollY > 50);
	});
	</script>

</body>
</html>
