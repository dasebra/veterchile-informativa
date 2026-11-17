/**
 * Asistente "Agendar hora veterinaria" (agendamiento.php).
 *
 * Lee los tipos de atención, las regiones, los profesionales con sus lugares
 * de atención y las horas disponibles desde la API de VeterChile
 * (vetsdi_laravel13) y crea la reserva en ese mismo sistema. La URL base de la
 * API llega en el atributo data-api del contenedor #agenda.
 */
(function () {
	"use strict";

	var raiz = document.getElementById("agenda");

	if (!raiz || !window.fetch) {
		return;
	}

	var API = (raiz.getAttribute("data-api") || "").replace(/\/+$/, "");

	var AYUDA = 'Escríbenos a <a href="mailto:contacto@veterchile.cl">contacto@veterchile.cl</a> o por ' +
		'<a href="https://wa.me/56984882443" target="_blank" rel="noopener noreferrer">WhatsApp</a> y te ayudamos a agendar.';

	var PASOS = ["Necesidad", "Ubicación", "Profesional y lugar", "Día y hora", "Tutor y mascota"];
	var DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
	var DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
	var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
	var DIAS_VISIBLES = 14;
	var DIAS_BUSQUEDA = 7;   // días que se recorren solos hasta encontrar horas
	var MARGEN_MINUTOS = 30; // no se ofrecen horas que empiezan en menos de media hora

	/* Texto de apoyo de cada tipo de atención del catálogo */
	var DETALLE_AREA = {
		consulta_veterinaria: "Consulta general, controles y microchip",
		consulta_especialista: "Cardiología, dermatología, traumatología y más",
		vacunacion: "Vacunas para perros y gatos",
		procedimientos_examenes: "Exámenes de sangre, radiografías y ecografías",
		visita_hospital: "Visita a tu mascota hospitalizada",
		peluqueria: "Baño, corte y mantención"
	};

	var estado = {
		paso: 1,
		catalogo: null,
		area: null,
		servicio: "",
		idRegion: "",
		nombreRegion: "",
		idCiudad: "",
		nombreCiudad: "",
		busqueda: "",
		profesionales: [],
		profesional: null,
		lugar: null,
		indiceDia: 0,
		hora: "",
		turnoHoras: 0
	};

	var hoy = new Date();
	hoy.setHours(0, 0, 0, 0);

	/* ===================== Utilidades ===================== */
	function el(id) {
		return document.getElementById(id);
	}

	function esc(valor) {
		return String(valor == null ? "" : valor)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function dosDigitos(n) {
		return n < 10 ? "0" + n : String(n);
	}

	function fechaDe(indice) {
		var d = new Date(hoy);
		d.setDate(d.getDate() + indice);
		return d;
	}

	function fechaIso(d) {
		return d.getFullYear() + "-" + dosDigitos(d.getMonth() + 1) + "-" + dosDigitos(d.getDate());
	}

	function fechaLarga(d) {
		return DIAS_LARGOS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()];
	}

	function iniciales(nombre) {
		return String(nombre || "")
			.replace(/^(Dr\.|Dra\.)\s*/i, "")
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map(function (p) { return p.charAt(0); })
			.join("")
			.toUpperCase();
	}

	/* ===================== Iconos ===================== */
	var TRAZO = ' fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

	var ICONOS_AREA = {
		consulta_veterinaria: '<path d="M5 3v6a4 4 0 0 0 8 0V3"/><path d="M9 13v2a5 5 0 0 0 10 0v-3"/><circle cx="19" cy="10" r="2"/>',
		consulta_especialista: '<path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.4l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z"/>',
		vacunacion: '<path d="M17.5 3.5l3 3"/><path d="M19 5l-2.5 2.5"/><path d="M14 6l4 4"/><path d="M15.5 7.5L6.5 16.5V19h2.5l9-9"/><path d="M5.5 18.5L3 21"/><path d="M10.5 12.5l1.5 1.5"/>',
		procedimientos_examenes: '<path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M20 8V5a1 1 0 0 0-1-1h-3"/><path d="M4 16v3a1 1 0 0 0 1 1h3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><circle cx="12" cy="12" r="3.2"/>',
		visita_hospital: '<path d="M5 21V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v15"/><path d="M3 21h18"/><path d="M12 7.5v5"/><path d="M9.5 10h5"/><path d="M10 21v-4h4v4"/>',
		peluqueria: '<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8.2 7.7L20 18"/><path d="M8.2 16.3L20 6"/>'
	};

	var ICONO_HUELLA = '<ellipse cx="6.5" cy="10.5" rx="1.6" ry="2.1"/><ellipse cx="10" cy="7" rx="1.6" ry="2.2"/><ellipse cx="14" cy="7" rx="1.6" ry="2.2"/><ellipse cx="17.5" cy="10.5" rx="1.6" ry="2.1"/><path d="M12 12c-2.6 0-5 2.5-5 4.8 0 1.6 1.2 2.4 2.6 2.4.9 0 1.5-.4 2.4-.4s1.5.4 2.4.4c1.4 0 2.6-.8 2.6-2.4 0-2.3-2.4-4.8-5-4.8z"/>';

	function icono(trazos, medida) {
		return '<svg width="' + medida + '" height="' + medida + '" viewBox="0 0 24 24"' + TRAZO + '>' + trazos + '</svg>';
	}

	function iconoArea(id) {
		return icono(ICONOS_AREA[id] || ICONO_HUELLA, 20);
	}

	function iconoPin() {
		return icono('<path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/>', 14);
	}

	function iconoCalendario() {
		return icono('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3 10h18"/>', 16);
	}

	function iconoPersona() {
		return icono('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5"/>', 16);
	}

	function iconoLupa() {
		return icono('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', 46);
	}

	/* ===================== Comunicación con la API ===================== */
	function leer(respuesta) {
		return respuesta.json()
			.catch(function () { return {}; })
			.then(function (cuerpo) {
				return { ok: respuesta.ok, codigo: respuesta.status, cuerpo: cuerpo || {} };
			});
	}

	function pedir(ruta, parametros) {
		var consulta = Object.keys(parametros || {})
			.filter(function (clave) { return parametros[clave] !== "" && parametros[clave] != null; })
			.map(function (clave) { return encodeURIComponent(clave) + "=" + encodeURIComponent(parametros[clave]); })
			.join("&");

		return fetch(API + "/" + ruta + (consulta ? "?" + consulta : ""), {
			headers: { "Accept": "application/json" }
		}).then(leer);
	}

	function enviar(ruta, datos) {
		return fetch(API + "/" + ruta, {
			method: "POST",
			headers: { "Accept": "application/json", "Content-Type": "application/json" },
			body: JSON.stringify(datos)
		}).then(leer);
	}

	/* ===================== Avisos y estados ===================== */
	function avisar(html) {
		var caja = el("agAlerta");
		caja.innerHTML = html;
		caja.hidden = false;
	}

	function quitarAviso() {
		var caja = el("agAlerta");
		caja.hidden = true;
		caja.innerHTML = "";
	}

	function cargando(texto) {
		return '<div class="ag-cargando" role="status">' + esc(texto) + '</div>';
	}

	function vacio(titulo, texto) {
		return '<div class="empty-state">' + iconoLupa() + '<b>' + esc(titulo) + '</b><p>' + esc(texto) + '</p></div>';
	}

	/* ===================== Pasos ===================== */
	function pintarPasos() {
		el("agPasos").innerHTML = PASOS.map(function (nombre, i) {
			var n = i + 1;
			var clase = "step-item" + (estado.paso === n ? " active" : "") + (estado.paso > n ? " done" : "");
			var punto = estado.paso > n
				? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12.5L9.5 18L20 6" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
				: n;
			var actual = estado.paso === n ? ' aria-current="step"' : "";
			var conector = n < PASOS.length ? '<div class="step-connector' + (estado.paso > n ? " done" : "") + '" aria-hidden="true"></div>' : "";

			return '<div class="' + clase + '" role="listitem"' + actual + '><div class="step-dot">' + punto + '</div>' +
				'<div class="step-label">' + esc(nombre) + '</div></div>' + conector;
		}).join("");
	}

	function irA(n) {
		estado.paso = n;
		quitarAviso();

		Array.prototype.forEach.call(raiz.querySelectorAll(".panel"), function (panel) {
			panel.classList.toggle("active", parseInt(panel.getAttribute("data-paso"), 10) === n);
		});

		pintarPasos();

		var suave = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
		window.scrollTo({ top: 0, behavior: suave ? "smooth" : "auto" });

		var titulo = el("agTitulo" + n);
		if (titulo) {
			titulo.focus({ preventScroll: true });
		}
	}

	Array.prototype.forEach.call(raiz.querySelectorAll("[data-volver]"), function (boton) {
		boton.addEventListener("click", function () {
			irA(parseInt(boton.getAttribute("data-volver"), 10));
		});
	});

	/* ===================== Paso 1: qué necesita ===================== */
	function pintarAreas() {
		var areas = (estado.catalogo && estado.catalogo.areas_veterinarias) || [];

		if (!areas.length) {
			el("agAreas").innerHTML = vacio("Sin tipos de atención disponibles", "Intenta nuevamente en unos minutos.");
			return;
		}

		el("agAreas").innerHTML = areas.map(function (area) {
			var elegida = !!estado.area && estado.area.id === area.id;

			return '<button type="button" class="tipo-card' + (elegida ? " selected" : "") + '" data-area="' + esc(area.id) + '" aria-pressed="' + elegida + '">' +
				'<span class="check" aria-hidden="true"></span>' +
				'<span class="ic" aria-hidden="true">' + iconoArea(area.id) + '</span>' +
				'<b>' + esc(area.nombre) + '</b>' +
				'<span>' + esc(DETALLE_AREA[area.id] || "") + '</span>' +
				'</button>';
		}).join("");
	}

	function pintarServicios(etiqueta, servicios) {
		var caja = el("agServicios");

		if (!servicios.length) {
			caja.hidden = true;
			return;
		}

		el("agServiciosTitulo").innerHTML = esc(etiqueta || "Servicio") + ' <small>(opcional)</small>';
		el("agChips").innerHTML = [{ id: "", nombre: "Cualquiera" }].concat(servicios).map(function (servicio) {
			return '<button type="button" class="ag-chip" data-servicio="' + esc(servicio.id) + '" aria-pressed="' + (estado.servicio === servicio.id) + '">' +
				esc(servicio.nombre) + '</button>';
		}).join("");
		caja.hidden = false;
	}

	el("agAreas").addEventListener("click", function (evento) {
		var tarjeta = evento.target.closest("[data-area]");

		if (!tarjeta) {
			return;
		}

		var id = tarjeta.getAttribute("data-area");
		var areas = estado.catalogo.areas_veterinarias || [];

		estado.area = areas.filter(function (a) { return a.id === id; })[0] || null;
		estado.servicio = "";
		pintarAreas();
		el("agA2").disabled = !estado.area;
		el("agServicios").hidden = true;

		var boton = el("agAreas").querySelector('[data-area="' + id + '"]');
		if (boton) {
			boton.focus({ preventScroll: true });
		}

		pedir("tipos_especialidad", { area: id }).then(function (r) {
			// Si mientras tanto se eligió otra tarjeta, esta respuesta ya no sirve
			if (!r.ok || !estado.area || estado.area.id !== id) {
				return;
			}
			pintarServicios(r.cuerpo.label_item, r.cuerpo.tipos_especialidad || []);
		}).catch(function () {
			/* Los servicios son un filtro opcional: sin ellos el asistente sigue */
		});
	});

	el("agChips").addEventListener("click", function (evento) {
		var chip = evento.target.closest("[data-servicio]");

		if (!chip) {
			return;
		}

		estado.servicio = chip.getAttribute("data-servicio");
		Array.prototype.forEach.call(el("agChips").querySelectorAll("[data-servicio]"), function (otro) {
			otro.setAttribute("aria-pressed", String(otro === chip));
		});
	});

	el("agA2").addEventListener("click", function () {
		irA(2);
	});

	/* ===================== Paso 2: dónde ===================== */
	var selectorRegion = el("agRegion");
	var selectorCiudad = el("agCiudad");

	function pintarRegiones() {
		// El catálogo trae una región de relleno ("Sin Registro cargado") que no es una ubicación real
		var regiones = ((estado.catalogo && estado.catalogo.regiones) || []).filter(function (region) {
			return !/^sin registro/i.test(region.nombre);
		});

		selectorRegion.innerHTML = '<option value="">Todas las regiones</option>' + regiones.map(function (region) {
			return '<option value="' + esc(region.id) + '">' + esc(region.nombre) + '</option>';
		}).join("");
	}

	function reiniciarCiudades(texto) {
		selectorCiudad.innerHTML = '<option value="">' + esc(texto) + '</option>';
		selectorCiudad.disabled = true;
		estado.idCiudad = "";
		estado.nombreCiudad = "";
	}

	selectorRegion.addEventListener("change", function () {
		var idRegion = selectorRegion.value;

		estado.idRegion = idRegion;
		estado.nombreRegion = idRegion ? selectorRegion.options[selectorRegion.selectedIndex].text : "";

		if (!idRegion) {
			reiniciarCiudades("Elige primero una región");
			return;
		}

		reiniciarCiudades("Cargando comunas…");

		pedir("ciudades", { id_region: idRegion }).then(function (r) {
			if (selectorRegion.value !== idRegion) {
				return;
			}

			var ciudades = (r.ok && r.cuerpo.ciudades) || [];

			selectorCiudad.innerHTML = '<option value="">Todas las comunas</option>' + ciudades.map(function (ciudad) {
				return '<option value="' + esc(ciudad.id) + '">' + esc(ciudad.nombre) + '</option>';
			}).join("");
			selectorCiudad.disabled = !ciudades.length;
		}).catch(function () {
			if (selectorRegion.value === idRegion) {
				reiniciarCiudades("Todas las comunas");
			}
		});
	});

	selectorCiudad.addEventListener("change", function () {
		estado.idCiudad = selectorCiudad.value;
		estado.nombreCiudad = selectorCiudad.value ? selectorCiudad.options[selectorCiudad.selectedIndex].text : "";
	});

	el("agA3").addEventListener("click", buscarProfesionales);

	el("agBusqueda").addEventListener("keydown", function (evento) {
		if (evento.key === "Enter") {
			evento.preventDefault();
			buscarProfesionales();
		}
	});

	/* ===================== Paso 3: profesional y lugar ===================== */
	function textoBusqueda(total) {
		var partes = [];

		if (estado.area) {
			partes.push('<b>' + esc(estado.area.nombre) + (estado.servicio ? " · " + esc(estado.servicio) : "") + '</b>');
		}

		var lugar = estado.nombreCiudad || estado.nombreRegion;
		partes.push(lugar ? 'en <b>' + esc(lugar) + '</b>' : 'en <b>todas las regiones</b>');

		return total + (total === 1 ? " resultado" : " resultados") + " para " + partes.join(" ");
	}

	function avatar(profesional) {
		// La foto solo se usa si el profesional subió una; si no, van sus iniciales
		if (profesional.imagen && /img_perfil/.test(profesional.imagen)) {
			return '<img class="ag-foto" src="' + esc(profesional.imagen) + '" alt="" loading="lazy" width="52" height="52">';
		}

		return '<div class="avatar" aria-hidden="true">' + esc(iniciales(profesional.nombre)) + '</div>';
	}

	function tarjetaProfesional(profesional) {
		var lugares = profesional.lugares_atencion || [];
		var especialidad = [profesional.especialidad, profesional.tipo_especialidad].filter(Boolean).join(" · ");

		var filas = lugares.map(function (lugar) {
			return '<div class="ag-lugar">' +
				'<div class="ag-lugar__info">' +
				'<p class="ag-lugar__nombre">' + esc(lugar.nombre) + '</p>' +
				(lugar.direccion ? '<p class="ag-lugar__dir">' + iconoPin() + '<span>' + esc(lugar.direccion) + '</span></p>' : "") +
				'</div>' +
				'<button type="button" class="btn btn-primary btn-sm" data-profesional="' + esc(profesional.id) + '" data-lugar="' + esc(lugar.id) + '">Ver horas</button>' +
				'</div>';
		}).join("");

		return '<article class="prof-card">' +
			'<div class="prof-top">' + avatar(profesional) +
			'<div class="prof-info">' +
			'<p class="pname">' + esc(profesional.nombre) + '</p>' +
			(especialidad ? '<p class="pspec">' + esc(especialidad) + '</p>' : "") +
			'</div></div>' +
			'<div class="ag-lugares">' +
			'<p class="ag-label">' + (lugares.length === 1 ? "Lugar de atención" : "Lugares de atención") + '</p>' + filas +
			'</div></article>';
	}

	function buscarProfesionales() {
		estado.busqueda = el("agBusqueda").value.trim();
		estado.profesional = null;
		estado.lugar = null;

		irA(3);
		el("agResumenBusqueda").innerHTML = "";
		el("agResultados").innerHTML = cargando("Buscando profesionales y servicios…");

		// La API filtra por ubicación del lugar de atención. El tipo de atención se
		// envía igual, pero hoy el sistema no relaciona profesionales con servicios.
		pedir("profesionales", {
			veterinaria_area: estado.area ? estado.area.id : "",
			veterinaria_item: estado.servicio,
			id_region: estado.idRegion,
			id_ciudad: estado.idCiudad,
			q: estado.busqueda
		}).then(function (r) {
			if (!r.ok) {
				throw new Error("busqueda");
			}

			// Solo se listan quienes tienen al menos un lugar de atención: sin lugar no hay agenda que reservar
			var todos = r.cuerpo.registros || [];
			estado.profesionales = todos.filter(function (profesional) {
				return (profesional.lugares_atencion || []).length > 0;
			});
			var sinAgenda = todos.length - estado.profesionales.length;

			el("agResumenBusqueda").innerHTML = textoBusqueda(estado.profesionales.length);

			if (!estado.profesionales.length && sinAgenda) {
				el("agResultados").innerHTML = vacio(
					"Aún no hay agenda en línea en esa ubicación",
					"Encontramos " + sinAgenda + (sinAgenda === 1 ? " profesional" : " profesionales") + ", pero todavía no publican sus horas. Prueba con otra región o escríbenos y te ayudamos a agendar."
				);
				return;
			}

			if (!estado.profesionales.length) {
				el("agResultados").innerHTML = vacio(
					"No encontramos resultados en esa ubicación",
					estado.idCiudad
						? "Prueba ampliando la búsqueda a toda la región."
						: "Prueba con otra región o busca en todas las regiones."
				);
				return;
			}

			el("agResultados").innerHTML = estado.profesionales.map(tarjetaProfesional).join("") +
				(sinAgenda ? '<p class="ag-sin-agenda">Otros ' + sinAgenda + (sinAgenda === 1 ? " profesional" : " profesionales") + ' de esta ubicación aún no publican su agenda en línea.</p>' : "");
		}).catch(function () {
			el("agResultados").innerHTML = "";
			avisar("No pudimos consultar la agenda en este momento. " + AYUDA);
		});
	}

	el("agResultados").addEventListener("click", function (evento) {
		var boton = evento.target.closest("[data-lugar]");

		if (!boton) {
			return;
		}

		var idProfesional = boton.getAttribute("data-profesional");
		var idLugar = boton.getAttribute("data-lugar");

		estado.profesional = estado.profesionales.filter(function (p) { return String(p.id) === idProfesional; })[0] || null;
		estado.lugar = estado.profesional
			? (estado.profesional.lugares_atencion || []).filter(function (l) { return String(l.id) === idLugar; })[0] || null
			: null;

		if (!estado.profesional || !estado.lugar) {
			return;
		}

		estado.indiceDia = 0;
		estado.hora = "";
		irA(4);
		pintarElegido();
		cargarHoras(true);
	});

	/* ===================== Paso 4: día y hora ===================== */
	function pintarElegido() {
		el("agElegido").innerHTML = avatar(estado.profesional) +
			'<div class="ag-resumen__info">' +
			'<p class="ag-resumen__nombre">' + esc(estado.profesional.nombre) + '</p>' +
			'<p class="ag-resumen__lugar">' + esc(estado.lugar.nombre) + (estado.lugar.direccion ? " · " + esc(estado.lugar.direccion) : "") + '</p>' +
			'</div>';
	}

	function pintarDias() {
		var html = "";

		for (var i = 0; i < DIAS_VISIBLES; i++) {
			var d = fechaDe(i);
			var elegido = estado.indiceDia === i;

			html += '<button type="button" class="day-pill' + (i === 0 ? " today" : "") + (elegido ? " selected" : "") + '" data-dia="' + i + '" aria-pressed="' + elegido + '" aria-label="' + esc(fechaLarga(d)) + '">' +
				'<span class="dname">' + (i === 0 ? "hoy" : DIAS[d.getDay()]) + '</span>' +
				'<span class="dnum">' + d.getDate() + '</span>' +
				'<span class="dmes">' + MESES[d.getMonth()].slice(0, 3) + '</span>' +
				'</button>';
		}

		el("agDias").innerHTML = html;

		var activo = el("agDias").querySelector(".day-pill.selected");
		if (activo && activo.scrollIntoView) {
			activo.scrollIntoView({ block: "nearest", inline: "nearest" });
		}
	}

	function horasVigentes(horarios, indice) {
		if (indice !== 0) {
			return horarios;
		}

		var ahora = new Date();
		var limite = ahora.getHours() * 60 + ahora.getMinutes() + MARGEN_MINUTOS;

		return horarios.filter(function (bloque) {
			var partes = String(bloque.hora).split(":");
			return parseInt(partes[0], 10) * 60 + parseInt(partes[1], 10) > limite;
		});
	}

	/**
	 * Carga las horas del día elegido. Con buscarSiguiente, si ese día no tiene
	 * horas avanza solo al siguiente (hasta DIAS_BUSQUEDA días) para que la
	 * persona vea de inmediato la primera fecha disponible.
	 */
	function cargarHoras(buscarSiguiente, intentos) {
		var turno = ++estado.turnoHoras;
		var indice = estado.indiceDia;
		var dia = fechaDe(indice);

		intentos = intentos || 1;
		estado.hora = "";
		el("agA5").disabled = true;
		pintarDias();
		el("agDiaTexto").innerHTML = "";
		el("agHoras").innerHTML = cargando(buscarSiguiente && intentos > 1 ? "Buscando el primer día con horas…" : "Cargando horas disponibles…");

		pedir("horas", {
			id_profesional: estado.profesional.id,
			id_lugar_atencion: estado.lugar.id,
			fecha: fechaIso(dia)
		}).then(function (r) {
			if (turno !== estado.turnoHoras) {
				return;
			}

			if (!r.ok) {
				throw new Error("horas");
			}

			var horarios = horasVigentes(r.cuerpo.horarios || [], indice);

			if (!horarios.length && buscarSiguiente && intentos < DIAS_BUSQUEDA && indice < DIAS_VISIBLES - 1) {
				estado.indiceDia = indice + 1;
				cargarHoras(true, intentos + 1);
				return;
			}

			if (!horarios.length) {
				el("agDiaTexto").innerHTML = "";
				el("agHoras").innerHTML = vacio("Sin horas para este día", "No hay disponibilidad el " + fechaLarga(dia) + ". Prueba con otro día.");
				return;
			}

			el("agDiaTexto").innerHTML = "<b>" + horarios.length + (horarios.length === 1 ? " hora disponible" : " horas disponibles") + "</b> el " + esc(fechaLarga(dia));
			el("agHoras").innerHTML = '<div class="slot-grid" role="group" aria-label="Horas disponibles">' + horarios.map(function (bloque) {
				return '<button type="button" class="slot-btn" data-hora="' + esc(bloque.hora) + '" aria-pressed="false">' + esc(bloque.hora) + '</button>';
			}).join("") + '</div>';
		}).catch(function () {
			if (turno !== estado.turnoHoras) {
				return;
			}
			el("agHoras").innerHTML = "";
			avisar("No pudimos leer las horas de este lugar. " + AYUDA);
		});
	}

	el("agDias").addEventListener("click", function (evento) {
		var dia = evento.target.closest("[data-dia]");

		if (!dia) {
			return;
		}

		quitarAviso();
		estado.indiceDia = parseInt(dia.getAttribute("data-dia"), 10);
		cargarHoras(false);

		var activo = el("agDias").querySelector(".day-pill.selected");
		if (activo) {
			activo.focus({ preventScroll: true });
		}
	});

	el("agHoras").addEventListener("click", function (evento) {
		var hora = evento.target.closest("[data-hora]");

		if (!hora) {
			return;
		}

		estado.hora = hora.getAttribute("data-hora");
		Array.prototype.forEach.call(el("agHoras").querySelectorAll("[data-hora]"), function (otra) {
			otra.setAttribute("aria-pressed", String(otra === hora));
		});
		el("agA5").disabled = false;
	});

	el("agA5").addEventListener("click", function () {
		if (!estado.hora) {
			return;
		}
		irA(5);
		pintarResumenFinal();
	});

	/* ===================== Paso 5: tutor y mascota ===================== */
	function limpiarRut(valor) {
		return String(valor).replace(/[^0-9kK]/g, "").toUpperCase();
	}

	function formatearRut(valor) {
		var limpio = limpiarRut(valor);

		if (limpio.length < 2) {
			return limpio;
		}

		return limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + limpio.slice(-1);
	}

	function rutValido(valor) {
		var limpio = limpiarRut(valor);

		if (limpio.length < 2 || !/^\d+$/.test(limpio.slice(0, -1))) {
			return false;
		}

		var cuerpo = limpio.slice(0, -1);
		var suma = 0;
		var factor = 2;

		for (var i = cuerpo.length - 1; i >= 0; i--) {
			suma += parseInt(cuerpo.charAt(i), 10) * factor;
			factor = factor === 7 ? 2 : factor + 1;
		}

		var resto = 11 - (suma % 11);
		var digito = resto === 11 ? "0" : (resto === 10 ? "K" : String(resto));

		return digito === limpio.slice(-1);
	}

	el("agRut").addEventListener("input", function (evento) {
		var campo = evento.target;
		var alFinal = campo.selectionStart === campo.value.length;

		campo.value = formatearRut(campo.value);

		if (alFinal) {
			campo.setSelectionRange(campo.value.length, campo.value.length);
		}
	});

	function pintarEspecies() {
		var especies = (estado.catalogo && estado.catalogo.especies) || [];

		el("agEspecie").innerHTML = '<option value="">Selecciona</option>' + especies.map(function (especie) {
			return '<option value="' + esc(especie.id) + '">' + esc(especie.nombre) + '</option>';
		}).join("");
	}

	function filaResumen(iconoHtml, etiqueta, valor, detalle) {
		return '<div class="confirm-row"><div class="ic">' + iconoHtml + '</div><div>' +
			'<div class="clabel">' + esc(etiqueta) + '</div>' +
			'<div class="cval">' + esc(valor) + (detalle ? '<small>' + esc(detalle) + '</small>' : "") + '</div>' +
			'</div></div>';
	}

	function pintarResumenFinal() {
		var dia = fechaDe(estado.indiceDia);
		var atencion = estado.area ? estado.area.nombre + (estado.servicio ? " · " + estado.servicio : "") : "";

		el("agResumenFinal").innerHTML =
			filaResumen(iconoPersona(), "Profesional", estado.profesional.nombre, atencion) +
			filaResumen(iconoCalendario(), "Fecha y hora", fechaLarga(dia), estado.hora + " hrs") +
			filaResumen(iconoPin(), "Lugar de atención", estado.lugar.nombre, estado.lugar.direccion);

		el("agVistaDatos").hidden = false;
		el("agVistaExito").hidden = true;
	}

	/* Cada campo obligatorio con la regla que debe cumplir */
	var REGLAS = [
		{ campo: "agCampoRut", entrada: "agRut", valido: rutValido },
		{ campo: "agCampoNombres", entrada: "agNombres", valido: function (v) { return v.length >= 2; } },
		{ campo: "agCampoApellido1", entrada: "agApellido1", valido: function (v) { return v.length >= 2; } },
		{ campo: "agCampoCorreo", entrada: "agCorreo", valido: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); } },
		{ campo: "agCampoTelefono", entrada: "agTelefono", valido: function (v) { return v.replace(/\D/g, "").length >= 8; } },
		{ campo: "agCampoMascota", entrada: "agMascota", valido: function (v) { return v.length >= 1; } },
		{ campo: "agCampoEspecie", entrada: "agEspecie", valido: function (v) { return v !== ""; } }
	];

	function validarFormulario() {
		var primeroConError = null;

		REGLAS.forEach(function (regla) {
			var entrada = el(regla.entrada);
			var correcto = regla.valido(entrada.value.trim());

			el(regla.campo).classList.toggle("has-error", !correcto);
			entrada.setAttribute("aria-invalid", String(!correcto));

			if (!correcto && !primeroConError) {
				primeroConError = entrada;
			}
		});

		if (primeroConError) {
			primeroConError.focus();
		}

		return !primeroConError;
	}

	REGLAS.forEach(function (regla) {
		el(regla.entrada).addEventListener("input", function () {
			el(regla.campo).classList.remove("has-error");
			el(regla.entrada).removeAttribute("aria-invalid");
		});
	});

	function textoErrores(errores) {
		var lista = [];

		Object.keys(errores || {}).forEach(function (clave) {
			[].concat(errores[clave]).forEach(function (mensaje) {
				lista.push(esc(mensaje));
			});
		});

		return lista.join(" ");
	}

	el("agFormulario").addEventListener("submit", function (evento) {
		evento.preventDefault();
		quitarAviso();

		if (!validarFormulario()) {
			return;
		}

		var boton = el("agConfirmar");
		var textoBoton = boton.innerHTML;
		var correo = el("agCorreo").value.trim();
		var mascota = el("agMascota").value.trim();

		// La reserva no tiene un campo propio para el tipo de atención elegido en el
		// paso 1: se antepone a las observaciones para que el profesional lo vea.
		var solicitado = estado.area ? "Atención solicitada: " + estado.area.nombre + (estado.servicio ? " · " + estado.servicio : "") + ". " : "";
		var comentarios = (solicitado + el("agComentarios").value.trim()).slice(0, 1000);

		boton.disabled = true;
		boton.innerHTML = "Agendando…";

		enviar("reservar", {
			id_profesional: estado.profesional.id,
			id_lugar_atencion: estado.lugar.id,
			fecha: fechaIso(fechaDe(estado.indiceDia)),
			hora: estado.hora,
			responsable_rut: el("agRut").value.trim(),
			responsable_nombres: el("agNombres").value.trim(),
			responsable_apellido_uno: el("agApellido1").value.trim(),
			responsable_apellido_dos: el("agApellido2").value.trim(),
			responsable_email: correo,
			responsable_telefono: el("agTelefono").value.trim(),
			mascota_nombre: mascota,
			mascota_especie_id: el("agEspecie").value,
			comentarios: comentarios
		}).then(function (r) {
			boton.disabled = false;
			boton.innerHTML = textoBoton;

			if (r.ok && r.cuerpo.estado === 1) {
				mostrarExito(r.cuerpo.registro || {}, correo, mascota);
				return;
			}

			// 409: alguien tomó esa hora mientras se completaban los datos
			if (r.codigo === 409) {
				estado.hora = "";
				irA(4);
				pintarElegido();
				cargarHoras(false);
				avisar("Esa hora se acaba de ocupar. Elige otra de las disponibles.");
				return;
			}

			avisar(esc(r.cuerpo.msj || "No pudimos agendar la hora.") + " " + textoErrores(r.cuerpo.errores) + " " + AYUDA);
		}).catch(function () {
			boton.disabled = false;
			boton.innerHTML = textoBoton;
			avisar("No hay conexión con la agenda en este momento. " + AYUDA);
		});
	});

	function mostrarExito(registro, correo, mascota) {
		var dia = fechaDe(estado.indiceDia);

		el("agTextoExito").textContent = "La hora de " + (registro.mascota || mascota) + " con " +
			(registro.profesional || estado.profesional.nombre) + " quedó agendada para el " + fechaLarga(dia) +
			" a las " + (registro.hora || estado.hora) + " hrs en " + (registro.lugar_atencion || estado.lugar.nombre) + ".";
		el("agAvisoExito").innerHTML = 'Enviamos la confirmación a <strong>' + esc(correo) + '</strong>';

		el("agVistaDatos").hidden = true;
		el("agVistaExito").hidden = false;
		pintarPasos();
		window.scrollTo({ top: 0, behavior: "auto" });
		el("agTituloExito").focus({ preventScroll: true });
	}

	el("agOtra").addEventListener("click", function () {
		estado.area = null;
		estado.servicio = "";
		estado.profesional = null;
		estado.lugar = null;
		estado.hora = "";
		estado.indiceDia = 0;

		// Se conservan los datos del tutor; cambian la mascota y el motivo
		el("agMascota").value = "";
		el("agEspecie").value = "";
		el("agComentarios").value = "";
		el("agServicios").hidden = true;
		el("agA2").disabled = true;
		el("agVistaDatos").hidden = false;
		el("agVistaExito").hidden = true;

		pintarAreas();
		irA(1);
	});

	/* ===================== Inicio ===================== */
	pintarPasos();
	irA(1);

	pedir("catalogo").then(function (r) {
		if (!r.ok || !r.cuerpo.areas_veterinarias) {
			throw new Error("catalogo");
		}

		estado.catalogo = r.cuerpo;
		pintarAreas();
		pintarRegiones();
		pintarEspecies();
	}).catch(function () {
		el("agAreas").innerHTML = "";
		avisar("La agenda en línea no está disponible en este momento. " + AYUDA);
	});
})();
