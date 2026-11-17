/**
 * Datos de ejemplo del buscador "Reservar hora" (agendamiento.php).
 *
 * Solo se usan cuando la página está en modo 'ejemplo'. Tienen la misma forma
 * que deberían devolver las llamadas reales, así el programador puede comparar
 * (ver NOTA_PROGRAMADOR_BUSCADOR.md). Nada de esto es información real.
 */
window.BUSCADOR_RESERVA_EJEMPLO = (function () {
	"use strict";

	/* Horario semanal de un lugar: días (1 = lunes … 7 = domingo) y tramos de atención */
	function horario(dias, tramos, intervalo) {
		return { dias: dias, tramos: tramos, intervalo: intervalo || 30 };
	}

	var LUN_VIE = [1, 2, 3, 4, 5];
	var LUN_SAB = [1, 2, 3, 4, 5, 6];

	return {
		catalogo: {
			regiones: [
				{ id: 1, nombre: "Arica y Parinacota" },
				{ id: 2, nombre: "Tarapacá" },
				{ id: 3, nombre: "Antofagasta" },
				{ id: 4, nombre: "Atacama" },
				{ id: 5, nombre: "Coquimbo" },
				{ id: 6, nombre: "Valparaíso" },
				{ id: 7, nombre: "Metropolitana de Santiago" },
				{ id: 8, nombre: "Libertador General Bernardo O'Higgins" },
				{ id: 9, nombre: "Maule" },
				{ id: 10, nombre: "Ñuble" },
				{ id: 11, nombre: "Biobío" },
				{ id: 12, nombre: "La Araucanía" },
				{ id: 13, nombre: "Los Ríos" },
				{ id: 14, nombre: "Los Lagos" },
				{ id: 15, nombre: "Aysén del General Carlos Ibáñez del Campo" },
				{ id: 16, nombre: "Magallanes y de la Antártica Chilena" }
			],
			especies: [
				{ id: 1, nombre: "Canino" },
				{ id: 2, nombre: "Felino" },
				{ id: 3, nombre: "Otro" }
			],
			/* Razas por especie: solo perros (1) y gatos (2). Sin raza elegida se guarda como Mixto */
			razas: {
				1: [
					{ id: 101, nombre: "Beagle" }, { id: 102, nombre: "Bulldog francés" }, { id: 103, nombre: "Chihuahua" },
					{ id: 104, nombre: "Cocker spaniel" }, { id: 105, nombre: "Golden retriever" }, { id: 106, nombre: "Labrador retriever" },
					{ id: 107, nombre: "Pastor alemán" }, { id: 108, nombre: "Poodle" }, { id: 109, nombre: "Schnauzer" }, { id: 110, nombre: "Yorkshire terrier" }
				],
				2: [
					{ id: 201, nombre: "Angora" }, { id: 202, nombre: "Bengalí" }, { id: 203, nombre: "British shorthair" },
					{ id: 204, nombre: "Maine coon" }, { id: 205, nombre: "Persa" }, { id: 206, nombre: "Siamés" }
				]
			},
			/* Servicios del paso Búsqueda. items = opciones del segundo selector */
			servicios: [
				{
					id: "consulta", nombre: "Consulta", detalle: "Medicina general y especialidades",
					label_item: "Especialidad",
					items: [
						"Medicina general veterinaria",
						"Cardiología veterinaria",
						"Dermatología veterinaria",
						"Medicina felina",
						"Neurología veterinaria",
						"Oftalmología veterinaria",
						"Traumatología y ortopedia veterinaria"
					]
				},
				{
					id: "procedimiento", nombre: "Procedimiento", detalle: "Vacunas, microchip y más",
					label_item: "Procedimiento",
					items: ["Vacunación", "Implantación de microchip", "Desparasitación", "Toma de muestra de sangre"]
				},
				{
					id: "examenes", nombre: "Exámenes", detalle: "Sangre, imágenes y laboratorio",
					label_item: "Examen",
					items: [
						"Exámenes sanguíneos", "Radiografías", "Ecografía abdominal", "TAC",
						// Solo aparece si la mascota es un gato (especie 2)
						{ nombre: "Test de leucemia felina (FeLV)", especie_ids: [2] }
					]
				},
				{ id: "peluqueria", nombre: "Peluquería / grooming", detalle: "Baño, corte y mantención", label_item: "", items: [] },
				{ id: "hotel", nombre: "Hotel", detalle: "Hospedaje y guardería", label_item: "", items: [] },
				{ id: "cementerio", nombre: "Cementerio / cremación", detalle: "Muy pronto", label_item: "", items: [] }
			],
			/* Videoconsulta: por ahora solo medicina general */
			videoconsulta: ["Medicina general veterinaria"]
		},

		ciudades: {
			6: [{ id: 601, nombre: "Valparaíso" }, { id: 602, nombre: "Viña del Mar" }, { id: 603, nombre: "Quilpué" }],
			7: [
				{ id: 701, nombre: "Santiago" }, { id: 702, nombre: "Providencia" }, { id: 703, nombre: "Ñuñoa" },
				{ id: 704, nombre: "Las Condes" }, { id: 705, nombre: "Maipú" }, { id: 706, nombre: "La Florida" }
			],
			11: [{ id: 1101, nombre: "Concepción" }, { id: 1102, nombre: "Talcahuano" }, { id: 1103, nombre: "San Pedro de la Paz" }]
		},

		/* Tutores ya registrados (para probar el paso Mascota) */
		tutores: {
			"111111111": {
				responsable: {
					id: 501, rut: "11.111.111-1", nombres: "Camila Andrea", apellido_uno: "Rojas", apellido_dos: "Muñoz",
					email: "camila.rojas@correo.cl", telefono: "+56 9 1234 5678"
				},
				mascotas: [
					{ id: 9001, nombre: "Luna", especie_id: 1, especie_nombre: "Canino", sexo: "F", raza_id: 105, raza_nombre: "Golden retriever" },
					{ id: 9002, nombre: "Michi", especie_id: 2, especie_nombre: "Felino", sexo: "M", raza_id: 206, raza_nombre: "Siamés" }
				]
			}
		},

		/**
		 * Prestadores. tipo: veterinario | peluqueria | hotel.
		 * Un lugar sin horario no aparece en la búsqueda (igual que en el escritorio).
		 */
		prestadores: [
			{
				id: 11, tipo: "veterinario", rut: "15.234.567-8",
				nombre: "Patricia Andrea", apellido_uno: "Acevedo", apellido_dos: "Chamorro", imagen: "",
				especialidad: "Medicina general veterinaria",
				descripcion: "Médica veterinaria con 12 años de experiencia en perros y gatos. Enfocada en medicina preventiva y controles.",
				servicios: {
					consulta: ["Medicina general veterinaria", "Medicina felina"],
					procedimiento: ["Vacunación", "Implantación de microchip", "Desparasitación"],
					examenes: ["Test de leucemia felina (FeLV)"]
				},
				valores: { "Medicina general veterinaria": 25000, "Medicina felina": 28000, "Vacunación": 15000 },
				videoconsulta: true,
				lugares: [
					{ id: 101, nombre: "Clínica Veterinaria Los Aromos", direccion: "Av. Providencia 1234", ciudad_id: 702, ciudad: "Providencia", region_id: 7, region: "Metropolitana de Santiago", telefono: "+56 2 2345 6789", horario: horario(LUN_VIE, [["09:00", "13:00"], ["15:00", "18:00"]]) },
					{ id: 102, nombre: "Centro Veterinario Ñuñoa", direccion: "Irarrázaval 3050", ciudad_id: 703, ciudad: "Ñuñoa", region_id: 7, region: "Metropolitana de Santiago", telefono: "+56 2 2987 6543", horario: horario([6], [["10:00", "14:00"]]) }
				]
			},
			{
				id: 12, tipo: "veterinario", rut: "13.456.789-0",
				nombre: "Jorge Ignacio", apellido_uno: "Fuentes", apellido_dos: "Soto", imagen: "",
				especialidad: "Cardiología veterinaria",
				descripcion: "Especialista en cardiología de pequeños animales. Realiza ecocardiogramas y electrocardiogramas.",
				servicios: {
					consulta: ["Cardiología veterinaria", "Medicina general veterinaria"],
					examenes: ["Ecografía abdominal"]
				},
				valores: { "Cardiología veterinaria": 38000, "Ecografía abdominal": { valor: 32000, desde: true } },
				videoconsulta: true,
				lugares: [
					{ id: 103, nombre: "Hospital Veterinario Las Condes", direccion: "Apoquindo 6400", ciudad_id: 704, ciudad: "Las Condes", region_id: 7, region: "Metropolitana de Santiago", telefono: "+56 2 2111 2233", horario: horario([1, 3, 5], [["10:00", "17:00"]], 45) }
				]
			},
			{
				id: 13, tipo: "veterinario", rut: "16.789.012-3",
				nombre: "Valentina", apellido_uno: "Muñoz", apellido_dos: "Pérez", imagen: "",
				especialidad: "Dermatología veterinaria",
				descripcion: "Atiende alergias, problemas de piel y oídos. Trabaja con tratamientos de largo plazo.",
				servicios: {
					consulta: ["Dermatología veterinaria", "Medicina general veterinaria"],
					procedimiento: ["Toma de muestra de sangre"],
					examenes: ["Exámenes sanguíneos", "Test de leucemia felina (FeLV)"]
				},
				valores: {},
				videoconsulta: false,
				lugares: [
					{ id: 104, nombre: "Veterinaria Santa Isabel", direccion: "Santa Isabel 455", ciudad_id: 701, ciudad: "Santiago", region_id: 7, region: "Metropolitana de Santiago", telefono: "+56 2 2444 1122", horario: horario(LUN_SAB, [["09:30", "13:30"]]) },
					{ id: 105, nombre: "Clínica Viña Centro", direccion: "Av. Libertad 880", ciudad_id: 602, ciudad: "Viña del Mar", region_id: 6, region: "Valparaíso", telefono: "+56 32 268 4455", horario: horario([2, 4], [["15:00", "19:00"]]) }
				]
			},
			{
				id: 14, tipo: "veterinario", rut: "12.345.678-5",
				nombre: "Francisco Javier", apellido_uno: "Lagos", apellido_dos: "Riquelme", imagen: "",
				especialidad: "Traumatología y ortopedia veterinaria",
				descripcion: "Cirujano traumatólogo. Evalúa cojeras, fracturas y problemas de columna.",
				servicios: {
					consulta: ["Traumatología y ortopedia veterinaria"],
					examenes: ["Radiografías", "TAC"]
				},
				valores: { "Traumatología y ortopedia veterinaria": 35000, "Radiografías": { valor: 22000, desde: true } },
				videoconsulta: false,
				lugares: [
					{ id: 106, nombre: "Centro Médico Veterinario Biobío", direccion: "O'Higgins 1020", ciudad_id: 1101, ciudad: "Concepción", region_id: 11, region: "Biobío", telefono: "+56 41 222 3344", horario: horario(LUN_VIE, [["08:30", "12:30"]]) }
				]
			},
			{
				// Sin horario registrado: no debe aparecer en ninguna búsqueda
				id: 15, tipo: "veterinario", rut: "17.111.222-3",
				nombre: "Daniela", apellido_uno: "Castro", apellido_dos: "Vidal", imagen: "",
				especialidad: "Medicina general veterinaria",
				descripcion: "",
				servicios: { consulta: ["Medicina general veterinaria"] },
				valores: {},
				videoconsulta: true,
				lugares: [
					{ id: 107, nombre: "Veterinaria Maipú", direccion: "Pajaritos 2100", ciudad_id: 705, ciudad: "Maipú", region_id: 7, region: "Metropolitana de Santiago", telefono: "", horario: null }
				]
			},
			{
				id: 21, tipo: "peluqueria",
				nombre: "Patitas Limpias", especialidad: "Peluquería canina y felina", imagen: "",
				descripcion: "Peluquería con productos hipoalergénicos. Atendemos perros y gatos de todos los tamaños.",
				procedimientos: [
					{ id: 1, nombre: "Baño", duracion: 60, precio: 15000 },
					{ id: 2, nombre: "Baño y corte", duracion: 90, precio: 22000 },
					{ id: 3, nombre: "Corte de uñas", duracion: 15, precio: 5000 },
					{ id: 4, nombre: "Limpieza de oídos", duracion: 15, precio: null }
				],
				lugares: [
					{ id: 201, nombre: "Sucursal Providencia", direccion: "Los Leones 450", ciudad_id: 702, ciudad: "Providencia", region_id: 7, region: "Metropolitana de Santiago", telefono: "+56 9 8765 4321", horario: horario(LUN_SAB, [["10:00", "19:00"]], 30) },
					{ id: 202, nombre: "Sucursal La Florida", direccion: "Vicuña Mackenna 7110", ciudad_id: 706, ciudad: "La Florida", region_id: 7, region: "Metropolitana de Santiago", telefono: "+56 9 8765 1111", horario: horario([2, 3, 4, 5, 6], [["11:00", "18:00"]], 30) }
				]
			},
			{
				id: 22, tipo: "peluqueria",
				nombre: "Grooming Costa", especialidad: "Peluquería canina", imagen: "",
				descripcion: "Grooming de razas y baños medicados.",
				procedimientos: [
					{ id: 5, nombre: "Baño", duracion: 60, precio: 14000 },
					{ id: 6, nombre: "Corte de raza", duracion: 120, precio: 30000 }
				],
				lugares: [
					{ id: 203, nombre: "Grooming Costa Viña", direccion: "5 Norte 320", ciudad_id: 602, ciudad: "Viña del Mar", region_id: 6, region: "Valparaíso", telefono: "+56 9 5555 1234", horario: horario(LUN_VIE, [["09:00", "17:00"]], 30) }
				]
			},
			{
				id: 31, tipo: "hotel",
				nombre: "Hotel Huellitas", especialidad: "Hotel y guardería", imagen: "",
				descripcion: "Hospedaje con patio, paseos diarios y cámaras para que veas a tu mascota.",
				servicios_hotel: { hotel: true, guarderia: true },
				precios: { noche: 18000, semana: 60000, mes: 210000 },
				lugares: [
					{ id: 301, nombre: "Hotel Huellitas Ñuñoa", direccion: "Grecia 2550", ciudad_id: 703, ciudad: "Ñuñoa", region_id: 7, region: "Metropolitana de Santiago", telefono: "+56 9 4444 7777", horario: horario([1, 2, 3, 4, 5, 6, 7], [["08:00", "20:00"]], 60) }
				]
			},
			{
				id: 32, tipo: "hotel",
				nombre: "Casa Canina Sur", especialidad: "Hotel", imagen: "",
				descripcion: "Hotel familiar para perros, cupos limitados.",
				servicios_hotel: { hotel: true, guarderia: false },
				precios: { noche: 15000, semana: null, mes: null },
				lugares: [
					{ id: 302, nombre: "Casa Canina Sur", direccion: "Los Carrera 1500", ciudad_id: 1101, ciudad: "Concepción", region_id: 11, region: "Biobío", telefono: "+56 9 3333 2222", horario: horario(LUN_SAB, [["09:00", "18:00"]], 60) }
				]
			}
		]
	};
})();
