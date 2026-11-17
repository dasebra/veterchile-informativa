/**
 * Envío del formulario de contacto sin recargar la página.
 * Si el navegador no ejecuta este archivo, el formulario se envía igual
 * de la forma tradicional y vuelve a la página con el aviso correspondiente.
 */
(function () {
	"use strict";

	var formulario = document.getElementById("form-contact");

	if (!formulario || !window.FormData) {
		return;
	}

	var boton = formulario.querySelector("button[type=submit]");
	var textoBoton = boton ? boton.innerHTML : "";

	function mostrarAviso(texto, esOk) {
		var aviso = formulario.querySelector(".lp-form-msg");

		if (!aviso) {
			aviso = document.createElement("div");
			formulario.insertBefore(aviso, formulario.firstChild);
		}

		aviso.className = "lp-form-msg " + (esOk ? "lp-form-msg--ok" : "lp-form-msg--error");
		aviso.setAttribute("role", esOk ? "status" : "alert");
		aviso.innerHTML = texto;
	}

	formulario.addEventListener("submit", function (evento) {
		// Deja que el navegador muestre sus propios avisos de campo obligatorio.
		if (typeof formulario.checkValidity === "function" && !formulario.checkValidity()) {
			formulario.reportValidity();
			evento.preventDefault();
			return;
		}

		evento.preventDefault();

		if (boton) {
			boton.disabled = true;
			boton.innerHTML = "ENVIANDO...";
		}

		var peticion = new XMLHttpRequest();
		peticion.open("POST", formulario.getAttribute("action"), true);
		peticion.setRequestHeader("X-Requested-With", "XMLHttpRequest");

		peticion.onload = function () {
			var respuesta = { ok: false, mensaje: "" };

			try {
				respuesta = JSON.parse(peticion.responseText);
			} catch (e) {
				respuesta.mensaje = "No pudimos procesar el envío. Intenta nuevamente en unos minutos.";
			}

			mostrarAviso(respuesta.mensaje, respuesta.ok);

			if (respuesta.ok) {
				formulario.reset();
			}

			if (boton) {
				boton.disabled = false;
				boton.innerHTML = textoBoton;
			}
		};

		peticion.onerror = function () {
			mostrarAviso("No hay conexión con el servidor. Intenta nuevamente en unos minutos.", false);

			if (boton) {
				boton.disabled = false;
				boton.innerHTML = textoBoton;
			}
		};

		peticion.send(new FormData(formulario));
	});
})();
