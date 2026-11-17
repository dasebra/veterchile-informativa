/**
 * Buscador "Reservar hora" de la página pública (agendamiento.php).
 *
 * Sigue el mismo flujo que el modal "Reservar hora" del escritorio del tutor:
 * 1 Mascota → 2 Búsqueda → 3 Resultado → 4 Fecha y hora → 5 Confirmar.
 *
 * Toda la información pasa por el objeto "fuente". En modo 'ejemplo' responde
 * con los datos de buscador-reserva-datos.js; en modo 'api' llama a las rutas
 * de RUTAS sobre la URL de data-api. Las dos devuelven lo mismo, así que para
 * conectar el backend no hay que tocar el resto del archivo.
 * El detalle de cada llamada está en NOTA_PROGRAMADOR_BUSCADOR.md.
 */
(function () {
	"use strict";

	var raiz = document.getElementById("buscadorReserva");

	if (!raiz || !window.Promise) {
		return;
	}

	var MODO = raiz.getAttribute("data-modo") === "api" ? "api" : "ejemplo";
	var API = (raiz.getAttribute("data-api") || "").replace(/\/+$/, "");

	/* Nombres de las rutas en modo 'api'. Se pueden cambiar sin tocar este archivo
	   declarando window.BUSCADOR_RESERVA_RUTAS antes de cargarlo. */
	var RUTAS = {
		catalogo: "catalogo",
		ciudades: "ciudades",
		responsable: "responsable",
		buscar: "buscar",
		proximaHoraLugar: "proxima_hora_lugar",
		ficha: "ficha",
		dias: "dias",
		horas: "horas",
		reservar: "reservar"
	};
	if (window.BUSCADOR_RESERVA_RUTAS) {
		Object.keys(window.BUSCADOR_RESERVA_RUTAS).forEach(function (clave) {
			RUTAS[clave] = window.BUSCADOR_RESERVA_RUTAS[clave];
		});
	}

	var PASOS = ["Mascota", "Búsqueda", "Resultado", "Fecha y hora", "Confirmar"];
	var DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
	var DIAS_CORTOS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
	var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
	var MARGEN_MINUTOS = 30;  // no se ofrecen horas que empiezan en menos de media hora
	var DIAS_AGENDA = 60;     // hasta cuántos días hacia adelante se puede reservar

	var estado = nuevoEstado();
	var catalogo = null;
	var calendario = null;

	function nuevoEstado() {
		return {
			paso: 1,
			alcanzado: 1,
			rutBuscado: "",
			tutor: null,          // { encontrado, responsable, mascotas }
			mascotaElegida: "",   // id de una mascota registrada o "nueva"
			datosTutor: null,     // lo que se envía al reservar
			datosMascota: null,
			modo: "servicio",     // servicio | veterinario | video
			servicio: "",
			item: "",
			idRegion: "",
			nombreRegion: "",
			idCiudad: "",
			nombreCiudad: "",
			q: "",
			resultados: [],
			prestador: null,
			lugar: null,
			fecha: "",
			hora: "",
			procedimientos: [],   // peluquería: ids elegidos
			estadia: "",          // hotel: hotel | guarderia
			ingreso: "",
			salida: "",
			plan: "semana",
			cantidad: 1,
			reservando: false,
			reservado: false
		};
	}

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

	function copia(valor) {
		return JSON.parse(JSON.stringify(valor));
	}

	function dosDigitos(n) {
		return n < 10 ? "0" + n : String(n);
	}

	function hoy() {
		var d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}

	function sumarDias(d, n) {
		var nueva = new Date(d);
		nueva.setDate(nueva.getDate() + n);
		return nueva;
	}

	function fechaIso(d) {
		return d.getFullYear() + "-" + dosDigitos(d.getMonth() + 1) + "-" + dosDigitos(d.getDate());
	}

	function leerIso(texto) {
		var p = String(texto || "").split("-");
		return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
	}

	function fechaCorta(iso) {
		var d = leerIso(iso);
		return dosDigitos(d.getDate()) + "/" + dosDigitos(d.getMonth() + 1) + "/" + d.getFullYear();
	}

	function fechaLarga(iso) {
		var d = leerIso(iso);
		return DIAS_LARGOS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()];
	}

	function diaSemana(d) {
		return d.getDay() || 7; // 1 = lunes … 7 = domingo
	}

	function aMinutos(hora) {
		var p = String(hora).split(":");
		return Number(p[0]) * 60 + Number(p[1]);
	}

	function aHora(minutos) {
		return dosDigitos(Math.floor(minutos / 60)) + ":" + dosDigitos(minutos % 60);
	}

	function peso(valor) {
		return "$" + Math.round(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	}

	function capitalizar(texto) {
		return String(texto || "").trim().toLocaleLowerCase("es").split(/\s+/).filter(Boolean).map(function (parte) {
			return parte.charAt(0).toLocaleUpperCase("es") + parte.slice(1);
		}).join(" ");
	}

	/* Igual que en el escritorio: primer nombre y los dos apellidos */
	function nombreCorto(p) {
		if (p.tipo !== "veterinario") {
			return p.nombre;
		}
		var primero = String(p.nombre || "").trim().split(/\s+/)[0] || "";
		return [primero, p.apellido_uno, p.apellido_dos].map(capitalizar).filter(Boolean).join(" ");
	}

	function iniciales(texto) {
		return String(texto || "").split(/\s+/).filter(Boolean).slice(0, 2).map(function (p) {
			return p.charAt(0);
		}).join("").toUpperCase();
	}

	function sinTildes(texto) {
		return String(texto || "").toLowerCase().normalize ? String(texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : String(texto || "").toLowerCase();
	}

	/* ---- RUT ---- */
	function limpiarRut(rut) {
		return String(rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
	}

	function rutValido(rut) {
		var limpio = limpiarRut(rut);
		if (limpio.length < 2) {
			return false;
		}
		var cuerpo = limpio.slice(0, -1);
		var dv = limpio.slice(-1);
		if (!/^\d+$/.test(cuerpo)) {
			return false;
		}
		var suma = 0;
		var factor = 2;
		for (var i = cuerpo.length - 1; i >= 0; i--) {
			suma += Number(cuerpo.charAt(i)) * factor;
			factor = factor === 7 ? 2 : factor + 1;
		}
		var resto = 11 - (suma % 11);
		var esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
		return dv === esperado;
	}

	function formatearRut(rut) {
		var limpio = limpiarRut(rut);
		if (limpio.length < 2) {
			return limpio;
		}
		var cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		return cuerpo + "-" + limpio.slice(-1);
	}

	function correoValido(correo) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(correo || "").trim());
	}

	/* ===================== Iconos ===================== */
	var TRAZO = ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

	var ICONOS = {
		corazon: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
		persona: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5"/>',
		video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3.5v11L16 14"/>',
		consulta: '<path d="M5 3v6a4 4 0 0 0 8 0V3"/><path d="M9 13v2a5 5 0 0 0 10 0v-3"/><circle cx="19" cy="10" r="2"/>',
		procedimiento: '<path d="M17.5 3.5l3 3"/><path d="M19 5l-2.5 2.5"/><path d="M14 6l4 4"/><path d="M15.5 7.5L6.5 16.5V19h2.5l9-9"/><path d="M5.5 18.5L3 21"/>',
		examenes: '<path d="M9 3h6"/><path d="M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 14h9"/>',
		peluqueria: '<circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><path d="M8.2 7.7L20 18"/><path d="M8.2 16.3L20 6"/>',
		hotel: '<path d="M3 21V10l9-6 9 6v11"/><path d="M9 21v-6h6v6"/>',
		cementerio: '<path d="M7 21V9a5 5 0 0 1 10 0v12"/><path d="M4 21h16"/><path d="M12 9v5"/><path d="M10 11h4"/>',
		huella: '<ellipse cx="6.5" cy="10.5" rx="1.6" ry="2.1"/><ellipse cx="10" cy="7" rx="1.6" ry="2.2"/><ellipse cx="14" cy="7" rx="1.6" ry="2.2"/><ellipse cx="17.5" cy="10.5" rx="1.6" ry="2.1"/><path d="M12 12c-2.6 0-5 2.5-5 4.8 0 1.6 1.2 2.4 2.6 2.4.9 0 1.5-.4 2.4-.4s1.5.4 2.4.4c1.4 0 2.6-.8 2.6-2.4 0-2.3-2.4-4.8-5-4.8z"/>',
		mas: '<path d="M12 5v14"/><path d="M5 12h14"/>',
		check: '<path d="M4 12.5L9.5 18L20 6"/>',
		pin: '<path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/>',
		calendario: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3 10h18"/>',
		reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		abajo: '<path d="M6 9l6 6 6-6"/>',
		izquierda: '<path d="M15 18l-6-6 6-6"/>',
		derecha: '<path d="M9 18l6-6-6-6"/>',
		lupa: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
		info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
		telefono: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
		archivo: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 14h6"/><path d="M9 17h4"/>',
		peso: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01"/><path d="M18 12h.01"/>'
	};

	function icono(nombre, medida) {
		return '<svg width="' + (medida || 18) + '" height="' + (medida || 18) + '" viewBox="0 0 24 24"' + TRAZO + '>' + (ICONOS[nombre] || ICONOS.huella) + '</svg>';
	}

	/* ===================== Fuente de datos ===================== */

	/* --- Modo ejemplo: arma las respuestas con los datos ficticios --- */
	var EJEMPLO = window.BUSCADOR_RESERVA_EJEMPLO || { catalogo: { regiones: [], especies: [], servicios: [], videoconsulta: [] }, ciudades: {}, tutores: {}, prestadores: [] };

	function demora(valor) {
		return new Promise(function (resolver) {
			setTimeout(function () { resolver(copia(valor)); }, 280);
		});
	}

	function numeroDesde(texto) {
		var n = 0;
		String(texto).split("").forEach(function (c) { n = (n * 31 + c.charCodeAt(0)) % 9973; });
		return n;
	}

	function buscarPrestador(id) {
		return EJEMPLO.prestadores.filter(function (p) { return String(p.id) === String(id); })[0] || null;
	}

	function buscarLugar(prestador, idLugar) {
		return (prestador ? prestador.lugares : []).filter(function (l) { return String(l.id) === String(idLugar); })[0] || null;
	}

	/* Bloques libres de un lugar en un día. Algunos salen "ocupados" para que se vea real */
	function bloquesLibres(lugar, fecha, duracion) {
		if (!lugar || !lugar.horario || lugar.horario.dias.indexOf(diaSemana(fecha)) === -1) {
			return [];
		}
		var paso = lugar.horario.intervalo || 30;
		var largo = Math.max(duracion || paso, paso);
		var ahora = new Date();
		var limite = fechaIso(fecha) === fechaIso(ahora) ? ahora.getHours() * 60 + ahora.getMinutes() + MARGEN_MINUTOS : -1;
		var libres = [];

		lugar.horario.tramos.forEach(function (tramo) {
			for (var m = aMinutos(tramo[0]); m + largo <= aMinutos(tramo[1]); m += paso) {
				var hora = aHora(m);
				if (m > limite && numeroDesde(lugar.id + fechaIso(fecha) + hora) % 4 !== 0) {
					libres.push(hora);
				}
			}
		});
		return libres;
	}

	function proximaDeLugar(lugar, duracion) {
		for (var i = 0; i <= DIAS_AGENDA; i++) {
			var dia = sumarDias(hoy(), i);
			var libres = bloquesLibres(lugar, dia, duracion);
			if (libres.length) {
				return { fecha: fechaIso(dia), hora: libres[0], id_lugar: lugar.id };
			}
		}
		return null;
	}

	function lugarPublico(lugar) {
		return {
			id: lugar.id, nombre: lugar.nombre, direccion: lugar.direccion,
			ciudad: lugar.ciudad, region: lugar.region, telefono: lugar.telefono,
			dias: lugar.horario ? lugar.horario.dias : [],
			tramos: lugar.horario ? lugar.horario.tramos : []
		};
	}

	function valorDe(p, item) {
		if (p.tipo === "peluqueria") {
			var precios = (p.procedimientos || []).map(function (x) { return x.precio; }).filter(Boolean);
			return precios.length ? { valor: Math.min.apply(null, precios), desde: true } : null;
		}
		if (p.tipo === "hotel") {
			return p.precios && p.precios.noche ? { valor: p.precios.noche, detalle: "por noche" } : null;
		}
		var v = (p.valores || {})[item];
		if (!v) {
			return null;
		}
		return typeof v === "number" ? { valor: v, desde: false } : { valor: v.valor, desde: !!v.desde };
	}

	var fuenteEjemplo = {
		catalogo: function () {
			return demora(EJEMPLO.catalogo);
		},
		ciudades: function (idRegion) {
			return demora(EJEMPLO.ciudades[idRegion] || []);
		},
		responsable: function (rut) {
			var tutor = EJEMPLO.tutores[limpiarRut(rut)];
			return demora(tutor ? { encontrado: true, responsable: tutor.responsable, mascotas: tutor.mascotas } : { encontrado: false, responsable: null, mascotas: [] });
		},
		buscar: function (f) {
			var tipo = f.servicio === "peluqueria" ? "peluqueria" : f.servicio === "hotel" ? "hotel" : "veterinario";
			if (f.modo !== "servicio") {
				tipo = "veterinario";
			}
			var termino = sinTildes(f.q);
			var rutBuscado = limpiarRut(f.q);

			var registros = EJEMPLO.prestadores.filter(function (p) {
				if (p.tipo !== tipo) {
					return false;
				}
				if (f.modo === "servicio" && tipo === "veterinario") {
					return (p.servicios[f.servicio] || []).indexOf(f.item) > -1;
				}
				if (f.modo === "video") {
					return p.videoconsulta && (p.servicios.consulta || []).indexOf(f.item) > -1;
				}
				if (f.modo === "veterinario") {
					var nombre = sinTildes([p.nombre, p.apellido_uno, p.apellido_dos].join(" "));
					return (termino && nombre.indexOf(termino) > -1) || (rutBuscado.length > 3 && limpiarRut(p.rut).indexOf(rutBuscado) === 0);
				}
				return true;
			}).map(function (p) {
				// Solo lugares con horario y, si se pidió, en la región o comuna elegida
				var lugares = p.lugares.filter(function (l) {
					if (!l.horario) {
						return false;
					}
					if (f.modo === "video") {
						return true;
					}
					if (f.id_ciudad) {
						return String(l.ciudad_id) === String(f.id_ciudad);
					}
					if (f.id_region) {
						return String(l.region_id) === String(f.id_region);
					}
					return true;
				});
				if (!lugares.length) {
					return null;
				}
				var proximas = lugares.map(function (l) { return proximaDeLugar(l); }).filter(Boolean).sort(function (a, b) {
					return (a.fecha + a.hora) < (b.fecha + b.hora) ? -1 : 1;
				});
				var item = f.modo === "veterinario" ? p.especialidad : f.item;
				return {
					id: p.id,
					tipo: p.tipo,
					rut: p.rut || "",
					nombre: p.nombre,
					apellido_uno: p.apellido_uno || "",
					apellido_dos: p.apellido_dos || "",
					imagen: p.imagen || "",
					especialidad: p.tipo === "veterinario" ? item : p.especialidad,
					valor: valorDe(p, item),
					proxima: proximas[0] || null,
					lugares: lugares.map(lugarPublico),
					procedimientos: p.procedimientos || [],
					servicios_hotel: p.servicios_hotel || null,
					precios: p.precios || null
				};
			}).filter(Boolean);

			return demora(registros);
		},
		proximaHoraLugar: function (idPrestador, idLugar) {
			return demora(proximaDeLugar(buscarLugar(buscarPrestador(idPrestador), idLugar)));
		},
		ficha: function (idPrestador) {
			var p = buscarPrestador(idPrestador);
			return demora(p ? {
				id: p.id, tipo: p.tipo, nombre: p.nombre, apellido_uno: p.apellido_uno || "", apellido_dos: p.apellido_dos || "",
				imagen: p.imagen || "", especialidad: p.especialidad, descripcion: p.descripcion || "",
				servicios: p.servicios || null, procedimientos: p.procedimientos || [], precios: p.precios || null,
				lugares: p.lugares.filter(function (l) { return !!l.horario; }).map(lugarPublico)
			} : null);
		},
		dias: function (idPrestador, idLugar) {
			var lugar = buscarLugar(buscarPrestador(idPrestador), idLugar);
			return demora({
				dias: lugar && lugar.horario ? lugar.horario.dias : [],
				desde: fechaIso(hoy()),
				hasta: fechaIso(sumarDias(hoy(), DIAS_AGENDA))
			});
		},
		horas: function (idPrestador, idLugar, fecha, duracion) {
			return demora(bloquesLibres(buscarLugar(buscarPrestador(idPrestador), idLugar), leerIso(fecha), duracion));
		},
		reservar: function (datos) {
			return demora({ estado: 1, msj: "Reserva creada correctamente.", registro: { id: 100000 + numeroDesde(JSON.stringify(datos)) } });
		}
	};

	/* --- Modo API: mismas respuestas, leídas desde el backend --- */
	function leer(respuesta) {
		return respuesta.json().catch(function () { return {}; }).then(function (cuerpo) {
			if (!respuesta.ok || !cuerpo || Number(cuerpo.estado) !== 1) {
				var error = new Error((cuerpo && cuerpo.msj) || "No pudimos conectarnos con la agenda.");
				error.cuerpo = cuerpo;
				throw error;
			}
			return cuerpo;
		});
	}

	function pedir(ruta, parametros) {
		var consulta = Object.keys(parametros || {}).filter(function (clave) {
			return parametros[clave] !== "" && parametros[clave] != null;
		}).map(function (clave) {
			return encodeURIComponent(clave) + "=" + encodeURIComponent(parametros[clave]);
		}).join("&");

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

	/* Qué agenda se está consultando. Va en cada llamada de agenda porque el id de una
	   peluquería o de un hotel puede repetirse con el de un veterinario, y la videoconsulta
	   usa otra agenda que la consulta presencial */
	function contextoAgenda(extra) {
		var datos = {
			tipo: tipoBuscado(),
			servicio: estado.modo === "servicio" ? estado.servicio : "consulta",
			modalidad: estado.modo === "video" ? "videoconsulta" : "presencial"
		};
		Object.keys(extra).forEach(function (clave) { datos[clave] = extra[clave]; });
		return datos;
	}

	var fuenteApi = {
		catalogo: function () {
			return pedir(RUTAS.catalogo);
		},
		ciudades: function (idRegion) {
			return pedir(RUTAS.ciudades, { id_region: idRegion }).then(function (c) { return c.ciudades || []; });
		},
		responsable: function (rut) {
			return pedir(RUTAS.responsable, { rut: formatearRut(rut) });
		},
		buscar: function (f) {
			return pedir(RUTAS.buscar, f).then(function (c) { return c.registros || []; });
		},
		proximaHoraLugar: function (idPrestador, idLugar) {
			return pedir(RUTAS.proximaHoraLugar, contextoAgenda({ id_prestador: idPrestador, id_lugar_atencion: idLugar })).then(function (c) { return c.proxima || null; });
		},
		ficha: function (idPrestador) {
			return pedir(RUTAS.ficha, contextoAgenda({ id_prestador: idPrestador })).then(function (c) { return c.ficha || null; });
		},
		dias: function (idPrestador, idLugar) {
			return pedir(RUTAS.dias, contextoAgenda({ id_prestador: idPrestador, id_lugar_atencion: idLugar }));
		},
		horas: function (idPrestador, idLugar, fecha, duracion) {
			return pedir(RUTAS.horas, contextoAgenda({ id_prestador: idPrestador, id_lugar_atencion: idLugar, fecha: fecha, duracion: duracion || "" })).then(function (c) {
				return (c.horas || c.horarios || []).map(function (h) { return typeof h === "string" ? h : h.hora; });
			});
		},
		reservar: function (datos) {
			return enviar(RUTAS.reservar, datos);
		}
	};

	var fuente = MODO === "api" ? fuenteApi : fuenteEjemplo;

	/* ===================== Avisos ===================== */
	function avisar(texto) {
		var caja = el("bqAlerta");
		caja.innerHTML = icono("info", 18) + "<span>" + esc(texto) + "</span>";
		caja.hidden = false;
	}

	function quitarAviso() {
		el("bqAlerta").hidden = true;
	}

	function fallo(error) {
		avisar(error && error.message ? error.message : "Algo no salió bien. Intenta nuevamente en unos minutos.");
	}

	function cargando(texto) {
		return '<div class="bq-cargando" role="status"><span class="bq-girando" aria-hidden="true"></span>' + esc(texto) + "</div>";
	}

	function vacio(texto) {
		return '<div class="bq-vacio">' + icono("lupa", 20) + "<span>" + esc(texto) + "</span></div>";
	}

	function marcarError(idCampo, conError) {
		var campo = el(idCampo);
		if (campo) {
			campo.classList.toggle("con-error", !!conError);
		}
		return !conError;
	}

	/* ===================== Pasos y pie ===================== */
	function pintarPasos() {
		el("bqPasos").innerHTML = PASOS.map(function (nombre, i) {
			var n = i + 1;
			var clase = "bq-paso" + (estado.paso === n ? " activo" : "") + (n < estado.paso || (n <= estado.alcanzado && n !== estado.paso) ? " completado" : "");
			var bloqueado = estado.reservado || n > estado.alcanzado || n === estado.paso;
			var numero = clase.indexOf("completado") > -1 ? icono("check", 14) : n;
			return '<li class="' + clase + '">' +
				'<button type="button" class="bq-paso-boton" data-ir-paso="' + n + '"' + (bloqueado ? " disabled" : "") + (estado.paso === n ? ' aria-current="step"' : "") + ">" +
				'<span class="bq-paso-numero">' + numero + "</span>" +
				'<span class="bq-paso-texto">' + esc(nombre) + "</span>" +
				"</button></li>";
		}).join("");
	}

	function boton(texto, accion, clase, desactivado, iconoIzq, iconoDer) {
		return '<button type="button" class="btn ' + clase + '" data-accion="' + accion + '"' + (desactivado ? " disabled" : "") + ">" +
			(iconoIzq ? icono(iconoIzq, 16) : "") + esc(texto) + (iconoDer ? icono(iconoDer, 16) : "") + "</button>";
	}

	function pintarPie() {
		var izq = "";
		var der = "";

		switch (estado.paso) {
			case 1:
				der = boton("Continuar", "continuar-mascota", "btn-primary", !estado.tutor, "", "derecha");
				break;
			case 2:
				izq = boton("Anterior", "ir-1", "btn-ghost", false, "izquierda");
				der = boton("Buscar horas", "buscar", "btn-primary", estado.modo === "servicio" && estado.servicio === "cementerio", "lupa");
				break;
			case 3:
				izq = boton("Cambiar búsqueda", "ir-2", "btn-ghost", false, "izquierda");
				break;
			case 4:
				izq = boton("Anterior", "ir-3", "btn-ghost", false, "izquierda");
				der = boton("Continuar", "ir-5", "btn-primary", !eleccionCompleta(), "", "derecha");
				break;
			case 5:
				if (estado.reservado) {
					izq = '<a class="btn btn-ghost" href="index.php">Volver al inicio</a>';
					der = boton("Reservar otra hora", "otra", "btn-primary");
				} else {
					izq = boton("Anterior", "ir-4", "btn-ghost", estado.reservando, "izquierda");
					der = boton(estado.reservando ? "Reservando…" : "Confirmar reserva", "confirmar", "btn-primary", estado.reservando, estado.reservando ? "" : "check");
				}
				break;
		}

		el("bqPie").innerHTML = '<div class="bq-pie-izq">' + izq + '</div><div class="bq-pie-der">' + der + "</div>";
	}

	function irPaso(n, sinMover) {
		quitarAviso();
		estado.paso = n;
		estado.alcanzado = Math.max(estado.alcanzado, n);

		Array.prototype.forEach.call(raiz.querySelectorAll(".bq-panel"), function (panel) {
			panel.classList.toggle("activo", Number(panel.getAttribute("data-paso")) === n);
		});

		pintarPasos();
		pintarPie();

		// Al cargar la página no se mueve la vista ni el foco
		if (sinMover) {
			return;
		}
		subirAlBuscador();

		var titulo = raiz.querySelector('.bq-panel.activo h3[tabindex]');
		if (titulo && titulo.focus) {
			try { titulo.focus({ preventScroll: true }); } catch (e) { titulo.focus(); }
		}
	}

	/* Si el buscador quedó fuera de la vista, sube hasta el inicio (la cabecera es fija) */
	function subirAlBuscador() {
		var arriba = raiz.getBoundingClientRect().top;
		var cabecera = document.querySelector(".site-header");
		var alto = cabecera ? cabecera.offsetHeight : 0;
		if (arriba < alto || arriba > window.innerHeight * 0.6) {
			window.scrollTo({ top: window.pageYOffset + arriba - alto - 16, behavior: "smooth" });
		}
	}

	/* ===================== Paso 1: Mascota ===================== */
	function avatarTutor(nombre) {
		return '<span class="bq-avatar">' + esc(iniciales(nombre)) + "</span>";
	}

	function opcion(clase, atributos, iconoNombre, titulo, detalle, activa) {
		return '<button type="button" class="bq-opcion ' + clase + (activa ? " activa" : "") + '" ' + atributos + ' role="radio" aria-checked="' + (activa ? "true" : "false") + '">' +
			'<span class="bq-opcion-icono">' + icono(iconoNombre, 20) + "</span>" +
			'<span class="bq-opcion-datos"><span class="bq-opcion-nombre">' + esc(titulo) + '</span><span class="bq-opcion-detalle">' + esc(detalle) + "</span></span>" +
			'<span class="bq-opcion-marca" aria-hidden="true">' + icono("check", 12) + "</span></button>";
	}

	function opcionesEspecie(elegida) {
		return '<option value="">Selecciona</option>' + catalogoEspecies().map(function (e) {
			return '<option value="' + esc(e.id) + '"' + (String(elegida) === String(e.id) ? " selected" : "") + ">" + esc(e.nombre) + "</option>";
		}).join("");
	}

	function catalogoEspecies() {
		return catalogo && catalogo.especies ? catalogo.especies : [];
	}

	/* Raza: solo para perros y gatos (las especies que traen razas en el catálogo) */
	function razasDe(idEspecie) {
		return catalogo && catalogo.razas && catalogo.razas[idEspecie] ? catalogo.razas[idEspecie] : [];
	}

	function pintarRazas(idEspecie) {
		var razas = razasDe(idEspecie);
		el("bqCampoMascotaRaza").hidden = !razas.length;
		el("bqMascotaRaza").innerHTML = '<option value="">Mixto</option>' + razas.map(function (raza) {
			return '<option value="' + esc(raza.id) + '">' + esc(raza.nombre) + "</option>";
		}).join("");
	}

	function formularioMascota() {
		return '<div class="bq-subbloque" id="bqMascotaNueva">' +
			'<p class="bq-etiqueta">' + (estado.tutor && estado.tutor.encontrado ? "Mascota nueva" : "Tu mascota") + "</p>" +
			'<div class="bq-dos">' +
			'<div class="field bq-campo" id="bqCampoMascotaNombre"><label for="bqMascotaNombre">Nombre de la mascota *</label><input type="text" id="bqMascotaNombre" maxlength="100" autocomplete="off"><div class="bq-error">Ingresa el nombre de tu mascota.</div></div>' +
			'<div class="field bq-campo" id="bqCampoMascotaEspecie"><label for="bqMascotaEspecie">Especie *</label><select id="bqMascotaEspecie">' + opcionesEspecie("") + '</select><div class="bq-error">Selecciona la especie.</div></div>' +
			'<div class="field bq-campo" id="bqCampoMascotaOtra" hidden><label for="bqMascotaOtra">¿Cuál es la especie? *</label><input type="text" id="bqMascotaOtra" maxlength="100" placeholder="Ej: conejo, hámster, tortuga"><div class="bq-error">Cuéntanos qué especie es.</div></div>' +
			'<div class="field bq-campo" id="bqCampoMascotaRaza" hidden><label for="bqMascotaRaza">Raza</label><select id="bqMascotaRaza"><option value="">Mixto</option></select></div>' +
			'<div class="field bq-campo"><label for="bqMascotaSexo">Sexo</label><select id="bqMascotaSexo"><option value="">Selecciona</option><option value="M">Macho</option><option value="F">Hembra</option></select></div>' +
			"</div></div>";
	}

	function formularioTutor() {
		return '<div class="bq-subbloque">' +
			'<p class="bq-etiqueta">Datos Tutor / Responsable</p>' +
			'<div class="bq-dos">' +
			'<div class="field bq-campo" id="bqCampoNombres"><label for="bqNombres">Nombres *</label><input type="text" id="bqNombres" maxlength="100" autocomplete="given-name"><div class="bq-error">Ingresa tu nombre.</div></div>' +
			'<div class="field bq-campo" id="bqCampoApellido1"><label for="bqApellido1">Primer apellido *</label><input type="text" id="bqApellido1" maxlength="50" autocomplete="family-name"><div class="bq-error">Ingresa tu primer apellido.</div></div>' +
			'<div class="field bq-campo"><label for="bqApellido2">Segundo apellido</label><input type="text" id="bqApellido2" maxlength="50" autocomplete="off"></div>' +
			'<div class="field bq-campo" id="bqCampoCorreo"><label for="bqCorreo">Correo electrónico *</label><input type="email" id="bqCorreo" maxlength="200" placeholder="nombre@correo.cl" autocomplete="email"><div class="bq-error">Ingresa un correo válido.</div></div>' +
			'<div class="field bq-campo" id="bqCampoTelefono"><label for="bqTelefono">Teléfono *</label><input type="tel" id="bqTelefono" maxlength="20" placeholder="+56 9 1234 5678" autocomplete="tel"><div class="bq-error">Ingresa un teléfono válido.</div></div>' +
			"</div></div>";
	}

	function pintarTutor() {
		var caja = el("bqTutor");
		var t = estado.tutor;

		if (!t) {
			caja.innerHTML = "";
			return;
		}

		if (t.encontrado) {
			var r = t.responsable;
			var nombre = capitalizar(String(r.nombres || "").split(/\s+/)[0]);
			var html = '<div class="bq-tutor">' + avatarTutor(r.nombres + " " + r.apellido_uno) +
				'<div class="bq-tutor-datos"><b>Hola, ' + esc(nombre) + "</b><span>RUT " + esc(r.rut) + "</span></div>" +
				'<span class="bq-tutor-marca">Tutor registrado</span></div>';

			html += '<p class="bq-etiqueta">Tus mascotas</p><div class="bq-opciones bq-opciones-mascotas" role="radiogroup" aria-label="Tus mascotas">';
			html += t.mascotas.map(function (m) {
				return opcion("", 'data-mascota="' + esc(m.id) + '"', "huella", m.nombre, m.especie_nombre || "Mascota", String(estado.mascotaElegida) === String(m.id));
			}).join("");
			html += opcion("bq-opcion-nueva", 'data-mascota="nueva"', "mas", "Mascota nueva",
				t.mascotas.length ? "Para una mascota que aún no está registrada" : "Aún no tienes mascotas registradas. Agrégala para reservar.",
				estado.mascotaElegida === "nueva");
			html += "</div>";

			if (estado.mascotaElegida === "nueva") {
				html += formularioMascota();
			}
			caja.innerHTML = html;
		} else {
			caja.innerHTML = '<div class="bq-info">' + icono("info", 18) + "<span>No encontramos ese RUT. Completa tus datos y los de tu mascota para registrarte y reservar.</span></div>" +
				formularioTutor() + formularioMascota();
		}
	}

	function buscarRut() {
		var campo = el("bqRut");
		var rut = campo.value;

		quitarAviso();
		if (!marcarError("bqCampoRut", !rutValido(rut))) {
			campo.focus();
			return;
		}

		campo.value = formatearRut(rut);
		if (estado.tutor && estado.rutBuscado === limpiarRut(rut)) {
			return;
		}

		var botonRut = el("bqBuscarRut");
		botonRut.disabled = true;
		el("bqTutor").innerHTML = cargando("Buscando tus datos…");

		fuente.responsable(rut).then(function (respuesta) {
			estado.rutBuscado = limpiarRut(rut);
			estado.tutor = respuesta;
			estado.mascotaElegida = respuesta.encontrado && respuesta.mascotas.length === 1 ? String(respuesta.mascotas[0].id) : (respuesta.encontrado && respuesta.mascotas.length ? "" : "nueva");
			pintarTutor();
			pintarPie();
		}).catch(function (error) {
			el("bqTutor").innerHTML = "";
			fallo(error);
		}).then(function () {
			botonRut.disabled = false;
		});
	}

	function valor(id) {
		var campo = el(id);
		return campo ? String(campo.value || "").trim() : "";
	}

	function validarMascotaNueva() {
		var ok = true;
		var especie = valor("bqMascotaEspecie");
		var otra = especieEsOtra(especie);
		ok = marcarError("bqCampoMascotaNombre", !valor("bqMascotaNombre")) && ok;
		ok = marcarError("bqCampoMascotaEspecie", !especie) && ok;
		ok = marcarError("bqCampoMascotaOtra", otra && !valor("bqMascotaOtra")) && ok;
		return ok;
	}

	function especieEsOtra(idEspecie) {
		var especie = catalogoEspecies().filter(function (e) { return String(e.id) === String(idEspecie); })[0];
		return !!especie && sinTildes(especie.nombre).indexOf("otr") === 0;
	}

	function nombreEspecie(idEspecie) {
		var especie = catalogoEspecies().filter(function (e) { return String(e.id) === String(idEspecie); })[0];
		return especie ? especie.nombre : "";
	}

	function continuarMascota() {
		var t = estado.tutor;
		quitarAviso();

		if (!t) {
			return;
		}

		var ok = true;
		if (!t.encontrado) {
			ok = marcarError("bqCampoNombres", !valor("bqNombres")) && ok;
			ok = marcarError("bqCampoApellido1", !valor("bqApellido1")) && ok;
			ok = marcarError("bqCampoCorreo", !correoValido(valor("bqCorreo"))) && ok;
			ok = marcarError("bqCampoTelefono", valor("bqTelefono").replace(/\D/g, "").length < 8) && ok;
		}

		if (t.encontrado && !estado.mascotaElegida) {
			avisar("Elige una de tus mascotas o agrega una nueva para continuar.");
			return;
		}

		if (estado.mascotaElegida === "nueva") {
			ok = validarMascotaNueva() && ok;
		}

		if (!ok) {
			var primero = raiz.querySelector('.bq-panel[data-paso="1"] .con-error input, .bq-panel[data-paso="1"] .con-error select');
			if (primero) {
				primero.focus();
			}
			return;
		}

		estado.datosTutor = t.encontrado ? {
			id: t.responsable.id, rut: t.responsable.rut, nombres: t.responsable.nombres,
			apellido_uno: t.responsable.apellido_uno, apellido_dos: t.responsable.apellido_dos,
			email: t.responsable.email, telefono: t.responsable.telefono
		} : {
			id: null, rut: formatearRut(el("bqRut").value), nombres: valor("bqNombres"),
			apellido_uno: valor("bqApellido1"), apellido_dos: valor("bqApellido2"),
			email: valor("bqCorreo"), telefono: valor("bqTelefono")
		};

		if (estado.mascotaElegida === "nueva") {
			estado.datosMascota = {
				id: null, nombre: capitalizar(valor("bqMascotaNombre")), especie_id: valor("bqMascotaEspecie"),
				especie_nombre: especieEsOtra(valor("bqMascotaEspecie")) ? valor("bqMascotaOtra") : nombreEspecie(valor("bqMascotaEspecie")),
				otra_especie: especieEsOtra(valor("bqMascotaEspecie")) ? valor("bqMascotaOtra") : "",
				sexo: valor("bqMascotaSexo"),
				raza_id: el("bqCampoMascotaRaza").hidden ? "" : valor("bqMascotaRaza"),
				raza_nombre: el("bqCampoMascotaRaza").hidden ? "" : (valor("bqMascotaRaza") ? el("bqMascotaRaza").options[el("bqMascotaRaza").selectedIndex].text : "Mixto")
			};
		} else {
			var m = t.mascotas.filter(function (x) { return String(x.id) === String(estado.mascotaElegida); })[0];
			estado.datosMascota = { id: m.id, nombre: m.nombre, especie_id: m.especie_id, especie_nombre: m.especie_nombre, otra_especie: "", sexo: m.sexo || "", raza_id: m.raza_id || "", raza_nombre: m.raza_nombre || "" };
		}

		// Las opciones de búsqueda dependen de la especie (ej. test FeLV solo para gatos)
		pintarBusqueda();
		irPaso(2);
	}

	/* ===================== Paso 2: Búsqueda ===================== */
	var MODOS = [
		{ id: "servicio", icono: "corazon", nombre: "Servicio", detalle: "Consulta, procedimientos, peluquería y más" },
		{ id: "veterinario", icono: "persona", nombre: "Veterinario/a", detalle: "Por nombre o RUT" },
		{ id: "video", icono: "video", nombre: "Videoconsulta", detalle: "Atención a distancia" }
	];

	/* Opciones del segundo selector. Un ítem puede ser texto o { nombre, especie_ids }:
	   con especie_ids solo aparece para esas especies (ej. test FeLV solo para gatos). */
	function itemsVisibles(servicio) {
		var especie = estado.datosMascota ? String(estado.datosMascota.especie_id) : "";
		return (servicio && servicio.items ? servicio.items : []).filter(function (item) {
			return typeof item === "string" || !item.especie_ids || item.especie_ids.map(String).indexOf(especie) > -1;
		}).map(function (item) {
			return typeof item === "string" ? item : item.nombre;
		});
	}

	function servicioActual() {
		return (catalogo && catalogo.servicios ? catalogo.servicios : []).filter(function (s) { return s.id === estado.servicio; })[0] || null;
	}

	function pintarBusqueda() {
		el("bqModos").innerHTML = MODOS.map(function (m) {
			return opcion("", 'data-modo="' + m.id + '"', m.icono, m.nombre, m.detalle, estado.modo === m.id);
		}).join("");

		el("bqServicio").innerHTML = '<option value="">Selecciona</option>' + (catalogo ? catalogo.servicios : []).map(function (s) {
			return '<option value="' + esc(s.id) + '"' + (estado.servicio === s.id ? " selected" : "") + ">" + esc(s.nombre) + "</option>";
		}).join("");

		var servicio = servicioActual();
		var esServicio = estado.modo === "servicio";
		var esCementerio = esServicio && estado.servicio === "cementerio";
		var conItem = (esServicio && itemsVisibles(servicio).length) || estado.modo === "video";

		el("bqModoServicio").hidden = !esServicio;
		el("bqCampoNombre").hidden = estado.modo !== "veterinario";
		el("bqCampoItem").hidden = !conItem;
		el("bqUbicacion").hidden = estado.modo === "video" || esCementerio;
		el("bqCementerio").hidden = !esCementerio;

		var etiquetaRegion = el("bqCampoRegion").querySelector("label");
		etiquetaRegion.innerHTML = estado.modo === "veterinario" ? "Región <small>(opcional)</small>" : "Región";

		if (conItem) {
			var items = estado.modo === "video" ? (catalogo.videoconsulta || []) : itemsVisibles(servicio);
			el("bqItemTitulo").textContent = estado.modo === "video" ? "Especialidad" : servicio.label_item;
			if (items.indexOf(estado.item) === -1) {
				estado.item = items.length === 1 ? items[0] : "";
			}
			el("bqItem").innerHTML = (items.length > 1 ? '<option value="">Selecciona</option>' : "") + items.map(function (item) {
				return '<option' + (item === estado.item ? " selected" : "") + ">" + esc(item) + "</option>";
			}).join("");
		}

		marcarError("bqCampoItem", false);
		marcarError("bqCampoRegion", false);
		marcarError("bqCampoNombre", false);
		pintarPie();
	}

	function pintarRegiones() {
		el("bqRegion").innerHTML = '<option value="">Selecciona</option>' + (catalogo ? catalogo.regiones : []).map(function (r) {
			return '<option value="' + esc(r.id) + '">' + esc(r.nombre) + "</option>";
		}).join("");
	}

	function cambiarRegion() {
		var region = el("bqRegion");
		var ciudad = el("bqCiudad");
		estado.idRegion = region.value;
		estado.nombreRegion = region.value ? region.options[region.selectedIndex].text : "";
		estado.idCiudad = "";
		estado.nombreCiudad = "";
		marcarError("bqCampoRegion", false);

		if (!region.value) {
			ciudad.innerHTML = '<option value="">Elige primero una región</option>';
			ciudad.disabled = true;
			return;
		}

		ciudad.innerHTML = '<option value="">Cargando…</option>';
		ciudad.disabled = true;
		fuente.ciudades(region.value).then(function (ciudades) {
			if (region.value !== estado.idRegion) {
				return;
			}
			ciudad.innerHTML = '<option value="">Todas las comunas</option>' + ciudades.map(function (c) {
				return '<option value="' + esc(c.id) + '">' + esc(c.nombre) + "</option>";
			}).join("");
			ciudad.disabled = false;
		}).catch(function (error) {
			ciudad.innerHTML = '<option value="">Todas las comunas</option>';
			ciudad.disabled = false;
			fallo(error);
		});
	}

	function buscar() {
		quitarAviso();
		estado.item = valor("bqItem");
		estado.q = valor("bqNombre");
		var servicio = servicioActual();
		var ok = true;

		if (estado.modo === "servicio") {
			if (!marcarError("bqModoServicio", !estado.servicio)) {
				return;
			}
			if (itemsVisibles(servicio).length) {
				ok = marcarError("bqCampoItem", !estado.item) && ok;
			}
			ok = marcarError("bqCampoRegion", !estado.idRegion) && ok;
		} else if (estado.modo === "veterinario") {
			ok = marcarError("bqCampoNombre", estado.q.length < 3) && ok;
		} else {
			ok = marcarError("bqCampoItem", !estado.item) && ok;
		}

		if (!ok) {
			return;
		}

		var filtros = {
			modo: estado.modo,
			servicio: estado.modo === "servicio" ? estado.servicio : "consulta",
			item: estado.modo === "veterinario" ? "" : estado.item,
			q: estado.modo === "veterinario" ? estado.q : "",
			id_region: estado.modo === "video" ? "" : estado.idRegion,
			id_ciudad: estado.modo === "video" ? "" : estado.idCiudad,
			especie_id: estado.datosMascota ? estado.datosMascota.especie_id : ""
		};

		estado.prestador = null;
		estado.lugar = null;
		limpiarFecha();
		estado.alcanzado = 3;

		el("bqResultados").innerHTML = cargando("Buscando horas disponibles…");
		pintarTitulosResultado();
		irPaso(3);

		fuente.buscar(filtros).then(function (registros) {
			estado.resultados = registros;
			pintarResultados();
		}).catch(function (error) {
			el("bqResultados").innerHTML = vacio("No pudimos hacer la búsqueda. Intenta nuevamente.");
			fallo(error);
		});
	}

	/* ===================== Paso 3: Resultado ===================== */
	function tipoBuscado() {
		if (estado.modo === "servicio" && (estado.servicio === "peluqueria" || estado.servicio === "hotel")) {
			return estado.servicio;
		}
		return "veterinario";
	}

	function pintarTitulosResultado() {
		var titulos = { veterinario: "Elige un veterinario", peluqueria: "Elige una peluquería", hotel: "Elige un hotel" };
		el("bqResultadoTitulo").textContent = titulos[tipoBuscado()];
		el("bqResultadoDetalle").textContent = "Cada tarjeta muestra la próxima hora disponible. Puedes revisar la ficha antes de reservar.";
	}

	/* Avatar genérico de la app VeterChile (el mismo de veterchile-android) */
	var AVATAR_GENERICO = "assets/images/veterchile/avatar-generico.svg";

	function avatar(p, clase) {
		var nombre = nombreCorto(p);
		// Veterinario: su foto o, si no tiene o no carga, el avatar genérico
		if (p.imagen || p.tipo === "veterinario") {
			return '<img class="bq-avatar bq-avatar-foto ' + (clase || "") + '" src="' + esc(p.imagen || AVATAR_GENERICO) + '" alt="' + esc(nombre) + '" onerror="this.onerror=null;this.src=\x27' + AVATAR_GENERICO + '\x27;">';
		}
		// Peluquería y hotel sin foto llevan su ícono
		return '<span class="bq-avatar ' + (clase || "") + '" aria-hidden="true">' + icono(p.tipo === "hotel" ? "hotel" : "peluqueria", 22) + "</span>";
	}

	function textoProxima(proxima) {
		return "Próxima hora " + fechaCorta(proxima.fecha) + " · " + proxima.hora + " hrs.";
	}

	function textoValor(p) {
		if (!p.valor || !p.valor.valor) {
			return '<p class="bq-valor sin-valor">' + (p.tipo === "veterinario" ? "Valor a consultar con el veterinario" : "Valor a consultar") + "</p>";
		}
		var prefijo = p.valor.desde ? "Desde " : "Valor ";
		return '<p class="bq-valor">' + prefijo + peso(p.valor.valor) + (p.valor.detalle ? " " + esc(p.valor.detalle) : "") + "</p>";
	}

	function lineaLugar(l) {
		return [l.direccion, l.ciudad].filter(Boolean).join(", ");
	}

	function pintarResultados() {
		var lista = estado.resultados;
		var caja = el("bqResultados");
		var donde = estado.modo === "video" ? "" : (estado.nombreCiudad || estado.nombreRegion);

		if (!lista.length) {
			caja.innerHTML = vacio("No encontramos horas con esos datos. Cambia la búsqueda e intenta nuevamente.");
			return;
		}

		el("bqResultadoDetalle").textContent = lista.length + (lista.length === 1 ? " resultado" : " resultados") + (donde ? " en " + donde : "") + ". Cada tarjeta muestra la próxima hora disponible; puedes revisar la ficha antes de reservar.";

		caja.innerHTML = lista.map(function (p, indice) {
			var esVideo = estado.modo === "video";
			var html = '<article class="bq-tarjeta">';
			html += '<div class="bq-tarjeta-principal">' + avatar(p) + '<div class="bq-tarjeta-datos">';
			html += '<h4 class="bq-tarjeta-nombre">' + esc(nombreCorto(p)) + "</h4>";
			html += '<span class="bq-pastilla">' + esc(p.especialidad) + "</span>";
			html += p.proxima
				? '<p class="bq-proxima">' + icono("calendario", 15) + esc(textoProxima(p.proxima)) + (esVideo ? " · Videoconsulta" : "") + "</p>"
				: '<p class="bq-proxima sin-hora">' + icono("calendario", 15) + "Sin agenda disponible</p>";
			html += textoValor(p);
			html += "</div></div>";

			if (!esVideo) {
				html += '<button type="button" class="bq-lugares-boton" data-lugares="' + indice + '" aria-expanded="false" aria-controls="bqLugares' + indice + '">' +
					icono("pin", 15) + "Ver lugares de atención (" + p.lugares.length + ")" + '<span class="bq-flecha">' + icono("abajo", 16) + "</span></button>";
				html += '<ul class="bq-lugares" id="bqLugares' + indice + '" hidden>' + p.lugares.map(function (l) {
					return '<li class="bq-lugar">' +
						'<span class="bq-lugar-icono">' + icono("pin", 16) + "</span>" +
						'<span class="bq-lugar-datos"><b>' + esc(l.nombre) + "</b><span>" + esc(lineaLugar(l)) + "</span>" +
						'<span class="bq-lugar-proxima" data-proxima-lugar="' + esc(l.id) + '">Buscando próxima hora…</span></span>' +
						'<button type="button" class="btn btn-ghost btn-sm" data-reservar="' + indice + '" data-lugar="' + esc(l.id) + '">Elegir</button>' +
						"</li>";
				}).join("") + "</ul>";
			}

			html += '<div class="bq-tarjeta-acciones">';
			html += '<button type="button" class="btn btn-ghost btn-sm" data-ficha="' + indice + '">' + icono("archivo", 15) + "Ver ficha</button>";
			html += p.proxima
				? '<button type="button" class="btn btn-primary btn-sm" data-reservar="' + indice + '">' + icono("calendario", 15) + "Reservar hora</button>"
				: '<button type="button" class="btn btn-primary btn-sm" disabled>' + icono("calendario", 15) + "Sin agenda</button>";
			html += "</div></article>";
			return html;
		}).join("");
	}

	function alternarLugares(boton) {
		var indice = Number(boton.getAttribute("data-lugares"));
		var lista = el("bqLugares" + indice);
		var abrir = lista.hidden;
		lista.hidden = !abrir;
		boton.setAttribute("aria-expanded", abrir ? "true" : "false");

		if (!abrir || lista.getAttribute("data-cargado")) {
			return;
		}
		lista.setAttribute("data-cargado", "1");

		var p = estado.resultados[indice];
		p.lugares.forEach(function (l) {
			var marca = lista.querySelector('[data-proxima-lugar="' + l.id + '"]');
			fuente.proximaHoraLugar(p.id, l.id).then(function (proxima) {
				marca.textContent = proxima ? textoProxima(proxima) : "Sin horas disponibles por ahora";
				marca.classList.toggle("sin-hora", !proxima);
			}).catch(function () {
				marca.textContent = "No pudimos revisar la agenda";
				marca.classList.add("sin-hora");
			});
		});
	}

	/* Paso a Fecha y hora con el prestador elegido (y el lugar, si se eligió uno) */
	function elegirPrestador(p, idLugar) {
		var lugarId = idLugar || (p.proxima ? p.proxima.id_lugar : (p.lugares[0] && p.lugares[0].id));
		estado.prestador = p;
		estado.lugar = p.lugares.filter(function (l) { return String(l.id) === String(lugarId); })[0] || p.lugares[0] || null;
		limpiarFecha();
		estado.alcanzado = 4;
		pintarFecha(p.proxima && (!idLugar || String(idLugar) === String(p.proxima.id_lugar)) ? p.proxima.fecha : "");
		irPaso(4);
	}

	/* ===================== Paso 4: Fecha y hora ===================== */
	function limpiarFecha() {
		estado.fecha = "";
		estado.hora = "";
		estado.procedimientos = [];
		estado.estadia = "";
		estado.ingreso = "";
		estado.salida = "";
		estado.plan = "semana";
		estado.cantidad = 1;
		if (calendario && calendario.destroy) {
			calendario.destroy();
		}
		calendario = null;
	}

	function duracionPeluqueria() {
		return procedimientosElegidos().reduce(function (total, x) { return total + (x.duracion || 0); }, 0);
	}

	function procedimientosElegidos() {
		var p = estado.prestador;
		return (p && p.procedimientos ? p.procedimientos : []).filter(function (x) {
			return estado.procedimientos.indexOf(x.id) > -1;
		});
	}

	function totalHotel() {
		var p = estado.prestador;
		var precios = p && p.precios ? p.precios : {};
		if (estado.estadia === "hotel") {
			var noches = nochesHotel();
			return precios.noche && noches ? precios.noche * noches : null;
		}
		if (estado.estadia === "guarderia") {
			var unidad = precios[estado.plan];
			return unidad ? unidad * estado.cantidad : null;
		}
		return null;
	}

	function nochesHotel() {
		if (!estado.ingreso || !estado.salida) {
			return 0;
		}
		return Math.round((leerIso(estado.salida) - leerIso(estado.ingreso)) / 86400000);
	}

	function eleccionCompleta() {
		var tipo = estado.prestador ? estado.prestador.tipo : "";
		if (tipo === "hotel") {
			return estado.estadia === "hotel" ? nochesHotel() > 0 : (estado.estadia === "guarderia" && !!estado.ingreso);
		}
		if (tipo === "peluqueria") {
			return estado.procedimientos.length > 0 && !!estado.fecha && !!estado.hora;
		}
		return !!estado.fecha && !!estado.hora;
	}

	function pintarElegido() {
		var p = estado.prestador;
		var html = '<div class="bq-elegido">' + avatar(p, "bq-avatar-chico") +
			'<div class="bq-elegido-datos"><span class="bq-elegido-etiqueta">Reservando con</span><b>' + esc(nombreCorto(p)) + "</b></div>" +
			'<span class="bq-pastilla">' + esc(p.especialidad) + "</span></div>";

		if (estado.modo === "video") {
			html += '<div class="bq-info">' + icono("video", 18) + "<span>Videoconsulta: te enviaremos el enlace de la atención por correo.</span></div>";
		} else if (p.lugares.length > 1) {
			html += '<p class="bq-etiqueta">Lugar de atención</p><div class="bq-opciones bq-opciones-lugares" role="radiogroup" aria-label="Lugar de atención">' +
				p.lugares.map(function (l) {
					return opcion("", 'data-cambiar-lugar="' + esc(l.id) + '"', "pin", l.nombre, lineaLugar(l), estado.lugar && String(estado.lugar.id) === String(l.id));
				}).join("") + "</div>";
		} else if (estado.lugar) {
			html += '<div class="bq-lugar-unico">' + icono("pin", 16) + "<span><b>" + esc(estado.lugar.nombre) + "</b> · " + esc(lineaLugar(estado.lugar)) + "</span></div>";
		}

		el("bqElegido").innerHTML = html;
	}

	function pintarFecha(fechaInicial) {
		var p = estado.prestador;
		var titulos = { veterinario: "Elige día y hora", peluqueria: "Servicios, día y hora", hotel: "Tipo de estadía y fechas" };
		var detalles = {
			veterinario: "Los días marcados tienen atención. Al elegir uno verás sus horas libres.",
			peluqueria: "Elige los servicios para tu mascota y luego el día y la hora.",
			hotel: "Elige si es hotel por noches o guardería, y las fechas."
		};
		el("bqFechaTitulo").textContent = titulos[p.tipo];
		el("bqFechaDetalle").textContent = detalles[p.tipo];
		pintarElegido();

		if (p.tipo === "hotel") {
			pintarHotel();
			return;
		}

		var html = "";
		if (p.tipo === "peluqueria") {
			html += '<p class="bq-etiqueta">Servicios</p><div class="bq-checks" id="bqServiciosPelu">' + p.procedimientos.map(function (x) {
				var marcado = estado.procedimientos.indexOf(x.id) > -1;
				return '<label class="bq-check' + (marcado ? " activa" : "") + '"><input type="checkbox" value="' + esc(x.id) + '"' + (marcado ? " checked" : "") + ">" +
					'<span class="bq-check-caja" aria-hidden="true">' + icono("check", 12) + "</span>" +
					'<span class="bq-check-datos"><b>' + esc(x.nombre) + "</b><span>" + esc(x.duracion) + " min</span></span>" +
					'<span class="bq-check-valor">' + (x.precio ? peso(x.precio) : "A consultar") + "</span></label>";
			}).join("") + '</div><div class="bq-total" id="bqTotalPelu"></div>';
		}

		html += '<div class="bq-agenda"><div class="bq-calendario" id="bqCalendario"></div>' +
			'<div class="bq-horas"><div class="bq-horas-cabecera"><span class="bq-etiqueta">Horas disponibles</span><b id="bqHorasFecha">Elige un día</b></div><div id="bqHoras"></div>' +
			'<div class="bq-leyenda"><span><i class="bq-punto disponible"></i>Disponible</span><span><i class="bq-punto elegido"></i>Elegida</span></div></div></div>';

		el("bqFecha").innerHTML = html;

		if (p.tipo === "peluqueria") {
			actualizarPeluqueria();
		} else {
			cargarCalendario(fechaInicial);
		}
	}

	function actualizarPeluqueria() {
		var elegidos = procedimientosElegidos();
		var total = elegidos.reduce(function (t, x) { return t + (x.precio || 0); }, 0);
		var conValor = elegidos.length && elegidos.every(function (x) { return !!x.precio; });
		el("bqTotalPelu").innerHTML = elegidos.length
			? "<span>" + elegidos.length + (elegidos.length === 1 ? " servicio" : " servicios") + " · " + duracionPeluqueria() + " min</span><b>" + (conValor ? "Total " + peso(total) : "Total a consultar") + "</b>"
			: "";

		estado.fecha = "";
		estado.hora = "";
		if (!elegidos.length) {
			if (calendario && calendario.destroy) {
				calendario.destroy();
			}
			calendario = null;
			el("bqCalendario").innerHTML = '<div class="bq-vacio">' + icono("calendario", 20) + "<span>Elige al menos un servicio para ver los días disponibles.</span></div>";
			el("bqHoras").innerHTML = "";
			el("bqHorasFecha").textContent = "Elige un día";
			pintarPie();
			return;
		}
		cargarCalendario("");
	}

	/* Calendario en línea. Si flatpickr no cargó, se usa el selector de fecha del navegador */
	function cargarCalendario(fechaInicial) {
		var caja = el("bqCalendario");
		var p = estado.prestador;
		caja.innerHTML = cargando("Cargando agenda…");
		el("bqHoras").innerHTML = "";
		pintarPie();

		fuente.dias(p.id, estado.lugar.id).then(function (agenda) {
			var dias = agenda.dias || [];
			var desde = agenda.desde || fechaIso(hoy());
			var hasta = agenda.hasta || fechaIso(sumarDias(hoy(), DIAS_AGENDA));
			var inicial = fechaInicial && dias.indexOf(diaSemana(leerIso(fechaInicial))) > -1 ? fechaInicial : "";

			if (!dias.length) {
				caja.innerHTML = vacio("Este lugar aún no publica su horario de atención.");
				return;
			}

			caja.innerHTML = '<input type="hidden" id="bqFechaCampo">';
			var campo = el("bqFechaCampo");

			if (window.flatpickr) {
				if (calendario && calendario.destroy) {
					calendario.destroy();
				}
				calendario = window.flatpickr(campo, {
					inline: true,
					locale: (window.flatpickr.l10ns && window.flatpickr.l10ns.es) || "default",
					dateFormat: "Y-m-d",
					minDate: desde,
					maxDate: hasta,
					defaultDate: inicial || null,
					disable: [function (d) { return dias.indexOf(diaSemana(d)) === -1; }],
					onChange: function (fechas, texto) {
						elegirDia(texto);
					}
				});
			} else {
				campo.type = "date";
				campo.min = desde;
				campo.max = hasta;
				campo.className = "bq-fecha-nativa";
				campo.addEventListener("change", function () {
					if (campo.value && dias.indexOf(diaSemana(leerIso(campo.value))) === -1) {
						avisar("Ese día no hay atención. Elige otro.");
						return;
					}
					elegirDia(campo.value);
				});
			}

			if (inicial) {
				if (!window.flatpickr) {
					campo.value = inicial;
				}
				elegirDia(inicial);
			}
		}).catch(function (error) {
			caja.innerHTML = vacio("No pudimos cargar la agenda.");
			fallo(error);
		});
	}

	function elegirDia(fecha) {
		quitarAviso();
		estado.fecha = fecha;
		estado.hora = "";
		pintarPie();

		var caja = el("bqHoras");
		if (!fecha) {
			caja.innerHTML = "";
			return;
		}
		el("bqHorasFecha").textContent = capitalizar(fechaLarga(fecha).split(" ")[0]) + " " + fechaLarga(fecha).split(" ").slice(1).join(" ");
		caja.innerHTML = cargando("Buscando horas…");

		var duracion = estado.prestador.tipo === "peluqueria" ? duracionPeluqueria() : "";
		fuente.horas(estado.prestador.id, estado.lugar.id, fecha, duracion).then(function (horas) {
			if (fecha !== estado.fecha) {
				return;
			}
			if (!horas.length) {
				caja.innerHTML = vacio("No quedan horas libres este día. Prueba con otro.");
				return;
			}
			// Todas las horas en una sola grilla, sin títulos de mañana o tarde
			caja.innerHTML = '<div class="bq-horas-grilla">' + horas.map(function (h) {
				return '<button type="button" class="bq-hora" data-hora="' + esc(h) + '" aria-pressed="false">' + esc(h) + "</button>";
			}).join("") + "</div>";
		}).catch(function (error) {
			caja.innerHTML = vacio("No pudimos cargar las horas.");
			fallo(error);
		});
	}

	function elegirHora(botonHora) {
		Array.prototype.forEach.call(el("bqHoras").querySelectorAll(".bq-hora"), function (b) {
			b.classList.remove("activa");
			b.setAttribute("aria-pressed", "false");
		});
		botonHora.classList.add("activa");
		botonHora.setAttribute("aria-pressed", "true");
		estado.hora = botonHora.getAttribute("data-hora");
		pintarPie();
	}

	/* ---- Hotel: hotel por noches o guardería por semana/mes ---- */
	function pintarHotel() {
		var p = estado.prestador;
		var servicios = p.servicios_hotel || { hotel: true };
		var precios = p.precios || {};
		var html = '<p class="bq-etiqueta">Tipo de estadía</p><div class="bq-opciones bq-opciones-3" role="radiogroup" aria-label="Tipo de estadía">';
		if (servicios.hotel) {
			html += opcion("", 'data-estadia="hotel"', "hotel", "Hotel", precios.noche ? peso(precios.noche) + " por noche" : "Valor a consultar", estado.estadia === "hotel");
		}
		if (servicios.guarderia) {
			html += opcion("", 'data-estadia="guarderia"', "calendario", "Guardería", precios.semana ? "Desde " + peso(precios.semana) + " por semana" : "Valor a consultar", estado.estadia === "guarderia");
		}
		html += "</div>";

		if (estado.estadia === "guarderia") {
			html += '<div class="bq-dos">' +
				'<div class="field"><label for="bqPlan">Plan</label><select id="bqPlan">' +
				(precios.semana !== null ? '<option value="semana"' + (estado.plan === "semana" ? " selected" : "") + ">Por semana</option>" : "") +
				(precios.mes !== null ? '<option value="mes"' + (estado.plan === "mes" ? " selected" : "") + ">Por mes</option>" : "") +
				"</select></div>" +
				'<div class="field"><label for="bqCantidad">Cantidad</label><select id="bqCantidad">' +
				[1, 2, 3, 4, 5, 6].map(function (n) { return "<option" + (estado.cantidad === n ? " selected" : "") + ">" + n + "</option>"; }).join("") +
				"</select></div></div>";
		}

		if (estado.estadia) {
			html += '<p class="bq-etiqueta">' + (estado.estadia === "hotel" ? "Fecha de ingreso y salida" : "Fecha de inicio") + "</p>" +
				'<div class="bq-agenda bq-agenda-sola"><div class="bq-calendario" id="bqCalendario"></div></div><div class="bq-total" id="bqTotalHotel"></div>';
		}

		el("bqFecha").innerHTML = html;

		if (estado.estadia) {
			cargarCalendarioHotel();
		}
		pintarTotalHotel();
	}

	function pintarTotalHotel() {
		var caja = el("bqTotalHotel");
		if (!caja) {
			pintarPie();
			return;
		}
		var total = totalHotel();
		var texto = "";
		if (estado.estadia === "hotel" && nochesHotel() > 0) {
			texto = "<span>" + fechaCorta(estado.ingreso) + " al " + fechaCorta(estado.salida) + " · " + nochesHotel() + (nochesHotel() === 1 ? " noche" : " noches") + "</span>";
		} else if (estado.estadia === "guarderia" && estado.ingreso) {
			texto = "<span>Desde el " + fechaCorta(estado.ingreso) + " · " + estado.cantidad + " " + (estado.plan === "mes" ? (estado.cantidad === 1 ? "mes" : "meses") : (estado.cantidad === 1 ? "semana" : "semanas")) + "</span>";
		}
		caja.innerHTML = texto ? texto + "<b>" + (total ? "Total " + peso(total) : "Total a consultar") + "</b>" : "";
		pintarPie();
	}

	function cargarCalendarioHotel() {
		var caja = el("bqCalendario");
		var dias = estado.lugar && estado.lugar.dias && estado.lugar.dias.length ? estado.lugar.dias : [1, 2, 3, 4, 5, 6, 7];
		caja.innerHTML = '<input type="hidden" id="bqFechaCampo">';
		var campo = el("bqFechaCampo");
		var esHotel = estado.estadia === "hotel";

		if (!window.flatpickr) {
			campo.type = "date";
			campo.className = "bq-fecha-nativa";
			campo.min = fechaIso(hoy());
			campo.addEventListener("change", function () {
				estado.ingreso = campo.value;
				estado.salida = esHotel && campo.value ? fechaIso(sumarDias(leerIso(campo.value), 1)) : "";
				pintarTotalHotel();
			});
			return;
		}

		if (calendario && calendario.destroy) {
			calendario.destroy();
		}
		calendario = window.flatpickr(campo, {
			inline: true,
			mode: esHotel ? "range" : "single",
			locale: (window.flatpickr.l10ns && window.flatpickr.l10ns.es) || "default",
			dateFormat: "Y-m-d",
			minDate: fechaIso(hoy()),
			maxDate: fechaIso(sumarDias(hoy(), 180)),
			defaultDate: esHotel ? [estado.ingreso, estado.salida].filter(Boolean) : (estado.ingreso || null),
			disable: [function (d) { return dias.indexOf(diaSemana(d)) === -1; }],
			onChange: function (fechas) {
				estado.ingreso = fechas[0] ? fechaIso(fechas[0]) : "";
				estado.salida = esHotel && fechas[1] ? fechaIso(fechas[1]) : "";
				pintarTotalHotel();
			}
		});
	}

	/* ===================== Paso 5: Confirmar ===================== */
	function filaResumen(iconoNombre, titulo, texto, extra) {
		return '<li class="bq-resumen-fila"><span class="bq-resumen-icono">' + icono(iconoNombre, 18) + "</span>" +
			'<div><span class="bq-resumen-titulo">' + esc(titulo) + '</span><span class="bq-resumen-valor">' + esc(texto) + "</span>" +
			(extra ? '<span class="bq-resumen-extra">' + esc(extra) + "</span>" : "") + "</div></li>";
	}

	function nombreServicio() {
		if (estado.modo === "video") {
			return "Videoconsulta · " + estado.item;
		}
		if (estado.modo === "veterinario") {
			return estado.prestador.especialidad;
		}
		var servicio = servicioActual();
		if (estado.servicio === "peluqueria") {
			return "Peluquería / grooming · " + procedimientosElegidos().map(function (x) { return x.nombre; }).join(", ");
		}
		if (estado.servicio === "hotel") {
			return estado.estadia === "hotel" ? "Hotel" : "Guardería";
		}
		return (servicio ? servicio.nombre : "") + (estado.item ? " · " + estado.item : "");
	}

	function textoValorFinal() {
		var p = estado.prestador;
		if (p.tipo === "peluqueria") {
			var elegidos = procedimientosElegidos();
			return elegidos.every(function (x) { return !!x.precio; }) ? peso(elegidos.reduce(function (t, x) { return t + x.precio; }, 0)) : "A consultar en la peluquería";
		}
		if (p.tipo === "hotel") {
			var total = totalHotel();
			return total ? peso(total) : "A consultar en el hotel";
		}
		return p.valor && p.valor.valor ? (p.valor.desde ? "Desde " : "") + peso(p.valor.valor) : "A consultar con el veterinario";
	}

	function pintarConfirmar() {
		var p = estado.prestador;
		var t = estado.datosTutor;
		var m = estado.datosMascota;
		// Un solo recuadro, como el resumen del modal del escritorio:
		// arriba la fecha y la hora destacadas, y debajo el detalle en filas
		var fechaDestacada;
		var pastilla;

		if (p.tipo === "hotel") {
			fechaDestacada = estado.estadia === "hotel"
				? capitalizar(fechaLarga(estado.ingreso)) + " al " + fechaLarga(estado.salida)
				: "Desde el " + fechaLarga(estado.ingreso);
			pastilla = estado.estadia === "hotel"
				? nochesHotel() + (nochesHotel() === 1 ? " noche" : " noches")
				: estado.cantidad + " " + (estado.plan === "mes" ? (estado.cantidad === 1 ? "mes" : "meses") : (estado.cantidad === 1 ? "semana" : "semanas"));
		} else {
			fechaDestacada = capitalizar(fechaLarga(estado.fecha).split(" ")[0]) + " " + fechaLarga(estado.fecha).split(" ").slice(1).join(" ");
			pastilla = estado.hora + " hrs.";
		}

		el("bqResumen").innerHTML =
			'<div class="bq-resumen-cita"><span class="bq-resumen-cita-icono">' + icono("calendario", 24) + "</span>" +
			'<div><span class="bq-resumen-fecha">' + esc(fechaDestacada) + "</span>" +
			'<span class="bq-resumen-hora">' + icono(p.tipo === "hotel" ? "hotel" : "reloj", 14) + esc(pastilla) + "</span></div></div>" +
			'<ul class="bq-resumen-detalle">' +
			filaResumen("huella", "Mascota", m.nombre, m.especie_nombre + (m.raza_nombre ? " · " + m.raza_nombre : "") + (m.id ? "" : " · se registrará al confirmar")) +
			filaResumen("persona", "Tutor / Responsable", [t.nombres, t.apellido_uno, t.apellido_dos].filter(Boolean).join(" "), "RUT " + t.rut + " · " + t.email) +
			filaResumen(p.tipo === "veterinario" ? "consulta" : p.tipo, "Servicio", nombreServicio()) +
			filaResumen("archivo", p.tipo === "veterinario" ? "Veterinario/a" : "Prestador", nombreCorto(p)) +
			filaResumen(estado.modo === "video" ? "video" : "pin", "Lugar de atención", estado.modo === "video" ? "Videoconsulta" : estado.lugar.nombre, estado.modo === "video" ? "Recibirás el enlace por correo" : lineaLugar(estado.lugar)) +
			filaResumen("peso", "Valor", textoValorFinal()) +
			"</ul>";

		var etiquetas = {
			veterinario: "Motivo de la consulta u observaciones",
			peluqueria: "Indicaciones para la peluquería",
			hotel: "Indicaciones para el hotel"
		};
		var ejemplos = {
			veterinario: "Cuéntanos brevemente qué le pasa a tu mascota",
			peluqueria: "Ej: es nervioso con el secador",
			hotel: "Ej: alimentación, medicamentos, horarios"
		};
		el("bqComentariosTitulo").innerHTML = esc(etiquetas[p.tipo]) + " <small>(opcional)</small>";
		el("bqComentarios").placeholder = ejemplos[p.tipo];
		el("bqVistaConfirmar").hidden = false;
		el("bqVistaExito").hidden = true;
	}

	function datosReserva() {
		var p = estado.prestador;
		var t = estado.datosTutor;
		var m = estado.datosMascota;
		var datos = {
			tipo: p.tipo,
			modalidad: estado.modo === "video" ? "videoconsulta" : "presencial",
			servicio: estado.modo === "servicio" ? estado.servicio : "consulta",
			item: estado.modo === "veterinario" ? p.especialidad : estado.item,
			id_prestador: p.id,
			id_lugar_atencion: estado.lugar ? estado.lugar.id : null,
			responsable_id: t.id,
			responsable_rut: t.rut,
			responsable_nombres: t.nombres,
			responsable_apellido_uno: t.apellido_uno,
			responsable_apellido_dos: t.apellido_dos || "",
			responsable_email: t.email,
			responsable_telefono: t.telefono,
			mascota_id: m.id,
			mascota_nombre: m.id ? "" : m.nombre,
			mascota_especie_id: m.id ? "" : m.especie_id,
			mascota_otra_especie: m.id ? "" : m.otra_especie,
			mascota_sexo: m.id ? "" : m.sexo,
			mascota_raza_id: m.id ? "" : m.raza_id,
			comentarios: valor("bqComentarios")
		};

		if (p.tipo === "hotel") {
			datos.estadia = estado.estadia;
			datos.fecha_ingreso = estado.ingreso;
			datos.fecha_salida = estado.estadia === "hotel" ? estado.salida : "";
			datos.plan = estado.estadia === "guarderia" ? estado.plan : "";
			datos.cantidad = estado.estadia === "guarderia" ? estado.cantidad : "";
		} else {
			datos.fecha = estado.fecha;
			datos.hora = estado.hora;
		}
		if (p.tipo === "peluqueria") {
			datos.procedimiento_ids = estado.procedimientos.slice();
		}
		return datos;
	}

	function confirmar() {
		if (estado.reservando) {
			return;
		}
		quitarAviso();
		estado.reservando = true;
		pintarPie();

		fuente.reservar(datosReserva()).then(function () {
			var p = estado.prestador;
			estado.reservado = true;
			var texto = p.tipo === "hotel"
				? "Enviamos la solicitud de estadía de " + estado.datosMascota.nombre + " a " + nombreCorto(p) + ". Te avisaremos por correo cuando la confirmen."
				: "La hora de " + estado.datosMascota.nombre + " con " + nombreCorto(p) + " quedó para el " + fechaLarga(estado.fecha) + " a las " + estado.hora + " hrs." +
					(estado.modo === "video" ? " Te enviaremos el enlace de la videoconsulta." : " en " + estado.lugar.nombre + ".");
			el("bqExitoTexto").textContent = texto + " Revisa tu correo " + estado.datosTutor.email + " para ver el comprobante.";
			el("bqVistaConfirmar").hidden = true;
			el("bqVistaExito").hidden = false;
			if (p.tipo === "hotel") {
				el("bqExitoTitulo").textContent = "¡Solicitud enviada!";
			}
			pintarPasos();
		}).catch(function (error) {
			fallo(error);
		}).then(function () {
			estado.reservando = false;
			pintarPie();
		});
	}

	function reservarOtra() {
		var tutor = estado.tutor;
		var rut = estado.rutBuscado;
		var datosTutor = estado.datosTutor;
		limpiarFecha();
		estado = nuevoEstado();
		// El tutor ya quedó identificado: se parte de nuevo eligiendo la mascota
		estado.tutor = tutor && tutor.encontrado ? tutor : null;
		estado.rutBuscado = estado.tutor ? rut : "";
		el("bqComentarios").value = "";
		el("bqExitoTitulo").textContent = "¡Hora reservada!";
		if (!estado.tutor) {
			el("bqRut").value = datosTutor ? datosTutor.rut : "";
		}
		pintarTutor();
		pintarBusqueda();
		irPaso(1);
	}

	/* ===================== Ficha (modal) ===================== */
	var fichaActual = null;
	var focoAnterior = null;

	function textoDias(dias) {
		var orden = dias.slice().sort();
		if (orden.join() === "1,2,3,4,5") { return "Lunes a viernes"; }
		if (orden.join() === "1,2,3,4,5,6") { return "Lunes a sábado"; }
		if (orden.join() === "1,2,3,4,5,6,7") { return "Todos los días"; }
		return orden.map(function (d) { return DIAS_CORTOS[d]; }).join(", ");
	}

	function abrirFicha(indice) {
		var p = estado.resultados[indice];
		fichaActual = p;
		focoAnterior = document.activeElement;
		el("bqModalTitulo").textContent = p.tipo === "veterinario" ? "Ficha del veterinario/a" : "Ficha del servicio";
		el("bqModalCuerpo").innerHTML = cargando("Cargando ficha…");
		el("bqModalReservar").hidden = !p.proxima;
		el("bqModal").hidden = false;
		document.body.classList.add("bq-sin-scroll");
		el("bqModal").querySelector(".bq-modal-cerrar").focus();

		fuente.ficha(p.id).then(function (f) {
			if (!f) {
				el("bqModalCuerpo").innerHTML = vacio("No encontramos la ficha.");
				return;
			}
			var html = '<div class="bq-ficha-cabecera">' + avatar(p) + '<div><b>' + esc(nombreCorto(f)) + '</b><span class="bq-pastilla">' + esc(f.especialidad) + "</span></div></div>";
			if (f.descripcion) {
				html += '<p class="bq-ficha-texto">' + esc(f.descripcion) + "</p>";
			}
			if (f.procedimientos && f.procedimientos.length) {
				html += '<p class="bq-etiqueta">Servicios</p><ul class="bq-ficha-lista">' + f.procedimientos.map(function (x) {
					return "<li><span>" + esc(x.nombre) + " · " + esc(x.duracion) + " min</span><b>" + (x.precio ? peso(x.precio) : "A consultar") + "</b></li>";
				}).join("") + "</ul>";
			}
			html += '<p class="bq-etiqueta">Lugares de atención</p><ul class="bq-ficha-lista">' + (f.lugares || []).map(function (l) {
				return '<li class="bq-ficha-lugar"><div><b>' + esc(l.nombre) + "</b><span>" + esc(lineaLugar(l)) + "</span>" +
					(l.telefono ? '<a href="tel:' + esc(String(l.telefono).replace(/\s/g, "")) + '">' + icono("telefono", 13) + esc(l.telefono) + "</a>" : "") + "</div>" +
					'<div class="bq-ficha-horario"><span>' + esc(textoDias(l.dias || [])) + "</span>" +
					(l.tramos || []).map(function (tr) { return '<span class="bq-rango">' + esc(tr[0]) + "–" + esc(tr[1]) + "</span>"; }).join("") + "</div></li>";
			}).join("") + "</ul>";
			el("bqModalCuerpo").innerHTML = html;
		}).catch(function () {
			el("bqModalCuerpo").innerHTML = vacio("No pudimos cargar la ficha. Intenta nuevamente.");
		});
	}

	function cerrarFicha() {
		el("bqModal").hidden = true;
		document.body.classList.remove("bq-sin-scroll");
		if (focoAnterior && focoAnterior.focus) {
			focoAnterior.focus();
		}
	}

	/* ===================== Eventos ===================== */
	raiz.addEventListener("click", function (evento) {
		var objetivo = evento.target.closest ? evento.target.closest("button, label.bq-check") : null;
		if (!objetivo || objetivo.disabled) {
			return;
		}

		var accion = objetivo.getAttribute("data-accion");
		if (accion) {
			if (accion === "continuar-mascota") { continuarMascota(); }
			else if (accion === "buscar") { buscar(); }
			else if (accion === "confirmar") { confirmar(); }
			else if (accion === "otra") { reservarOtra(); }
			else if (accion === "ir-5") { pintarConfirmar(); irPaso(5); }
			else if (accion.indexOf("ir-") === 0) { irPaso(Number(accion.slice(3))); }
			return;
		}

		if (objetivo.hasAttribute("data-ir-paso")) {
			var destino = Number(objetivo.getAttribute("data-ir-paso"));
			if (destino === 5) { pintarConfirmar(); }
			irPaso(destino);
		} else if (objetivo.hasAttribute("data-mascota")) {
			estado.mascotaElegida = objetivo.getAttribute("data-mascota");
			quitarAviso();
			pintarTutor();
			if (estado.mascotaElegida === "nueva" && el("bqMascotaNombre")) {
				el("bqMascotaNombre").focus();
			}
		} else if (objetivo.hasAttribute("data-modo")) {
			estado.modo = objetivo.getAttribute("data-modo");
			quitarAviso();
			pintarBusqueda();
			if (estado.modo === "veterinario") { el("bqNombre").focus(); }
		} else if (objetivo.hasAttribute("data-lugares")) {
			alternarLugares(objetivo);
		} else if (objetivo.hasAttribute("data-reservar")) {
			elegirPrestador(estado.resultados[Number(objetivo.getAttribute("data-reservar"))], objetivo.getAttribute("data-lugar"));
		} else if (objetivo.hasAttribute("data-ficha")) {
			abrirFicha(Number(objetivo.getAttribute("data-ficha")));
		} else if (objetivo.hasAttribute("data-cambiar-lugar")) {
			var idLugar = objetivo.getAttribute("data-cambiar-lugar");
			if (!estado.lugar || String(estado.lugar.id) !== String(idLugar)) {
				var procedimientos = estado.procedimientos.slice();
				limpiarFecha();
				estado.procedimientos = procedimientos;
				estado.lugar = estado.prestador.lugares.filter(function (l) { return String(l.id) === String(idLugar); })[0];
				pintarFecha("");
				pintarPie();
			}
		} else if (objetivo.hasAttribute("data-hora")) {
			elegirHora(objetivo);
		} else if (objetivo.hasAttribute("data-estadia")) {
			estado.estadia = objetivo.getAttribute("data-estadia");
			estado.ingreso = "";
			estado.salida = "";
			pintarHotel();
		}
	});

	raiz.addEventListener("change", function (evento) {
		var t = evento.target;
		if (t.id === "bqRegion") {
			cambiarRegion();
		} else if (t.id === "bqCiudad") {
			estado.idCiudad = t.value;
			estado.nombreCiudad = t.value ? t.options[t.selectedIndex].text : "";
		} else if (t.id === "bqServicio") {
			estado.servicio = t.value;
			estado.item = "";
			marcarError("bqModoServicio", false);
			quitarAviso();
			pintarBusqueda();
		} else if (t.id === "bqItem") {
			estado.item = t.value;
			marcarError("bqCampoItem", false);
		} else if (t.id === "bqMascotaEspecie") {
			el("bqCampoMascotaOtra").hidden = !especieEsOtra(t.value);
			pintarRazas(t.value);
			marcarError("bqCampoMascotaEspecie", false);
		} else if (t.id === "bqPlan" || t.id === "bqCantidad") {
			estado.plan = valor("bqPlan") || "semana";
			estado.cantidad = Number(valor("bqCantidad")) || 1;
			pintarTotalHotel();
		} else if (t.closest && t.closest("#bqServiciosPelu")) {
			var id = Number(t.value);
			var pos = estado.procedimientos.indexOf(id);
			if (t.checked && pos === -1) { estado.procedimientos.push(id); }
			if (!t.checked && pos > -1) { estado.procedimientos.splice(pos, 1); }
			t.closest("label").classList.toggle("activa", t.checked);
			actualizarPeluqueria();
		}
	});

	/* Al escribir se quita el error del campo */
	raiz.addEventListener("input", function (evento) {
		var campo = evento.target.closest ? evento.target.closest(".bq-campo") : null;
		if (campo) {
			campo.classList.remove("con-error");
		}
		if (evento.target.id === "bqRut" && estado.tutor && limpiarRut(evento.target.value) !== estado.rutBuscado) {
			estado.tutor = null;
			estado.mascotaElegida = "";
			pintarTutor();
			pintarPie();
		}
	});

	el("bqRut").addEventListener("blur", function () {
		if (rutValido(this.value)) {
			this.value = formatearRut(this.value);
		}
	});

	el("bqFormRut").addEventListener("submit", function (evento) {
		evento.preventDefault();
		buscarRut();
	});

	el("bqNombre").addEventListener("keydown", function (evento) {
		if (evento.key === "Enter") {
			evento.preventDefault();
			buscar();
		}
	});

	el("bqModal").addEventListener("click", function (evento) {
		if (evento.target.closest && evento.target.closest("[data-cerrar-modal]")) {
			cerrarFicha();
		}
	});

	el("bqModalReservar").addEventListener("click", function () {
		var p = fichaActual;
		cerrarFicha();
		if (p) {
			elegirPrestador(p);
		}
	});

	document.addEventListener("keydown", function (evento) {
		if (evento.key === "Escape" && !el("bqModal").hidden) {
			cerrarFicha();
		}
	});

	/* ===================== Inicio ===================== */
	irPaso(1, true);

	fuente.catalogo().then(function (datos) {
		catalogo = datos;
		pintarRegiones();
		pintarBusqueda();
		irPaso(1, true);
	}).catch(function (error) {
		fallo(error);
	});
})();
