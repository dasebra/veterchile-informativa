# Buscador público "Reservar hora": cómo conectarlo con las agendas de VeterChile

Nota para el programador. Está pensada para trabajarla con **ChatGPT Codex**: la sección 1 trae el pedido
para pegarle a Codex, y el resto explica en detalle cómo funcionan hoy las agendas en `vetsdi_laravel13`,
qué debe hacer cada llamada y qué errores del código actual **no** se deben copiar.

Proyectos:

- **Sitio público:** `C:\wamp64\www\veterchile_informativa` → `http://localhost/veterchile_informativa/agendamiento.php`
- **Sistema:** `C:\wamp64\www\vetsdi_laravel13` → `http://vetsdi.local`

---

## Índice

1. Pedido para pegar en Codex
2. Qué tiene que lograr la conexión
3. Cómo funciona hoy la agenda en vetsdi (tablas y reglas)
4. Recorrido completo de una reserva, paso a paso
5. Errores del código actual que NO se deben copiar
6. Contrato de cada llamada (lo que el front ya espera)
7. Tareas en orden
8. Pruebas (en pantalla y en la base de datos)
9. Después: el mismo buscador en el escritorio de cada mascota
10. Lo que no se debe cambiar

---

## 1. Pedido para pegar en Codex

> Lee completa `C:\wamp64\www\veterchile_informativa\NOTA_PROGRAMADOR_BUSCADOR.md` y el `AGENTS.md` de
> `vetsdi_laravel13`.
> Tu tarea es conectar el buscador "Reservar hora" de `agendamiento.php` con las agendas reales de VeterChile,
> a través de la API pública `api/vetsdinicio` de `vetsdi_laravel13`.
>
> Reglas:
> - Cada reserva debe quedar en la agenda del profesional, en el lugar de atención elegido, con las mismas
>   validaciones que usa el escritorio del tutor. Las horas libres salen siempre de
>   `App\Services\AgendaDisponibilidad` y la hora se guarda con `App\Services\AccesoAgendaVeterinaria::guardarReserva`.
>   No dupliques reglas con otro criterio.
> - Tutor existente: se identifica por RUT y **nunca** se sobrescriben sus datos desde la página pública.
>   Tutor nuevo: se crea. La mascota nueva se crea solo cuando todo lo demás ya está validado.
> - Respeta el contrato JSON de la sección 6: el front ya lo espera así.
> - No cambies HTML ni CSS del buscador: el diseño está aprobado. En `assets/js/buscador-reserva.js` solo
>   puedes tocar `RUTAS` y `fuenteApi`, y solo si hace falta.
> - La sección 5 lista lo que ya quedó corregido y hecho (disponibilidad, reserva pública, `responsable` y `horas`).
>   No lo vuelvas a programar: construye lo pendiente sobre eso.
> - Haz las tareas pendientes de la sección 7 en orden: `catalogo`, `buscar`, `proxima_hora_lugar`, `ficha`, `dias`,
>   peluquería y hotel públicos, revisión del registro de cuentas y pasar el sitio a modo `api`.
>   Al final, corre las pruebas de la sección 8 e informa qué archivos cambiaste y el resultado de cada prueba.

---

## 2. Qué tiene que lograr la conexión

Desde la página pública, una persona **sin sesión** debe poder reservar una hora real.

- **Si ya es tutor** (su RUT existe en `pacientes`): ve sus mascotas y reserva para una de ellas, o agrega una nueva.
- **Si es tutor nuevo:** se registra en el mismo flujo (tutor + mascota) y reserva.

La hora debe quedar:

- **en la agenda del profesional** (`horas_medicas`), en el **lugar de atención** elegido, dentro de su horario,
  sin chocar con otras horas ni con bloqueos;
- **en el escritorio del tutor**, cuando entre con su cuenta;
- **vinculada al lugar de atención** de la mascota (`mascota_lugares_atencion`), igual que cuando reserva desde el escritorio;
- **con el correo de confirmación** enviado (plantilla `hora_agendada`).

Peluquería y hotel no son `horas_medicas`: usan sus propios módulos (ver 4.6 y 4.7).

---

## 3. Cómo funciona hoy la agenda en vetsdi

### 3.1 Tablas que intervienen

| Tabla (modelo) | Qué guarda | Detalles que importan |
|---|---|---|
| `pacientes` (`Paciente`) | El **tutor / responsable**. | `rut` con puntos y guion (`12.345.678-5`). `id_usuario` queda `null` si no tiene cuenta. `apellido_dos` usa `'N/A'` cuando no hay. InnoDB. |
| `mascotas` (`Mascota`) | Las mascotas. | `id_responsable` = `pacientes.id`. `especie_id` y `especie` (se llenan los dos con el mismo id), `raza_id`, `otra_especie`, `sexo` (`M`/`F`), `estado = 1`. **La tabla es MyISAM: no se deshace con rollback** (ver 4.4). |
| `especies_mascotas` | Especies. | 1 Canina, 2 Felina, 3 Pez, 4 Aves, 5 Reptiles, 6 Roedores, 7 Hurones, 8 Otros. |
| `razas_mascotas` | Razas. | `especie_id`, `nombre`. Hay 176. |
| `mascota_lugares_atencion` | Lugares de atención donde se atiende cada mascota. | Se llena con `$mascota->vincularLugarAtencion($idLugar, $idInstitucion, 'agenda_responsable')`. |
| `profesionales` (`Profesional`) | Veterinarios. | `id_especialidad`: 1 médico veterinario, 2 odontología veterinaria, 15 peluquería/aseo. |
| `lugares_atencion` (`LugarAtencion`) | Clínicas o consultas. | `id_direccion` → `direcciones` → `ciudades` (`id_region`). |
| `profesionales_lugares_atencion` | Dónde atiende cada profesional. | Solo cuenta `estado = 1`. |
| `profesional_horarios` (`ProfesionalHorario`) | Horario semanal por profesional **y** lugar. | Ver 3.2. |
| `profesional_horarios_bloqueo` (`ProfesionalHorariosBloqueo`) | Bloqueos de agenda (vacaciones, etc.). | Por fecha; `todo_dia = 1` bloquea el día entero. |
| `horas_medicas` (`HoraMedica`) | **Las reservas.** | Ver 3.3. InnoDB. |
| `parametros` (`referencia = 'Agenda_Estado'`) | Estados de la hora. | Ver 3.4. |
| `aranceles_profesionales` | Valores de cada profesional. | `datos` en JSON; el escritorio lo lee con `EscritorioGeneral::valorServicioArancel`. |

### 3.2 Horario del profesional (`profesional_horarios`)

| Campo | Formato |
|---|---|
| `dia` | Días de la semana separados por coma, con **0 = domingo**, 1 = lunes … 6 = sábado. Ejemplos reales: `"1"`, `"3,4"`, `"0,1"`. |
| `hora_inicio` / `hora_termino` | `HH:MM:SS`. Se guardan con un segundo de desfase (por ejemplo `09:30:01` a `15:30:00`). Compara siempre por minuto. |
| `duracion_consulta` | `HH:MM:SS`. Es el largo de cada bloque. Si viene vacía, se usan 15 minutos. |
| `tipo_agenda` | 1 Consulta (C), 2 Dental (D), 3 Telemedicina / videoconsulta (T), 4 Exámenes (E), 5 Procedimiento (P). |

Puede haber **varios turnos** para el mismo profesional, lugar y día (por ejemplo, mañana y tarde). Hay que
recorrerlos **todos**, no solo el primero.

Los bloques de un turno parten en `hora_inicio` y avanzan de a `duracion_consulta`. El último bloque debe
**terminar** a más tardar en `hora_termino`.

### 3.3 La reserva (`horas_medicas`)

Campos que se llenan al reservar (igual que `EscritorioPaciente::agendar_horas`):

| Campo | Valor |
|---|---|
| `id_paciente` | `pacientes.id` del tutor (si hay mascota, el `id_responsable` de la mascota). |
| `id_mascota` | Id de la mascota. |
| `id_profesional`, `id_lugar_atencion` | Los elegidos. |
| `fecha_consulta` | `Y-m-d`. |
| `hora_inicio` / `hora_termino` | `H:i:s`; término = inicio + duración del bloque. |
| `tipo_hora_medica` | `C`, `D`, `T`, `E` o `P` (ver 3.5). |
| `alias_examen` | `Consulta`, `Consulta Dental`, `Videoconsulta veterinaria`, o el nombre del examen o procedimiento. |
| `id_estado` | `1` (Reservada). |
| `descripcion` | Nombre completo del tutor. |
| `observaciones` | Texto que indique que viene de la web pública, más la especie y el ítem elegido. Ejemplo: `Reserva web pública. Mascota: Luna (Canina). Servicio: Consulta · Medicina general veterinaria.` |
| `medio_pago` | `en_consulta`. La página pública no cobra. |

### 3.4 Estados de la hora (`parametros`, `Agenda_Estado`)

| Id | Estado |
|---|---|
| 1 | Reservada |
| 2 | Confirmada |
| 3 | Rechazada |
| 4 | Espera |
| 5 | Realizando |
| 6 | Realizada |
| 8 | Llamando |
| 14 | Bloqueo por profesional anulado |
| 15 | Hora anulada por profesional |

**Un bloque está ocupado si hay una hora con `id_estado` distinto de 3, 14 o 15 que se cruce con él.**

### 3.5 Qué servicio corresponde a qué agenda

| En el buscador | `tipo_agenda` | `tipo_hora_medica` | Profesionales |
|---|---|---|---|
| Consulta (medicina general y especialidades) | 1 | `C` | `id_especialidad` 1 |
| Consulta de odontología veterinaria (si se agrega como ítem) | 2 | `D` | `id_especialidad` 2 |
| Videoconsulta (solo medicina general) | 3 | `T` | con horario `tipo_agenda` 3 |
| Exámenes | 4 | `E` | con horario `tipo_agenda` 4 |
| Procedimiento | 5 | `P` | con horario `tipo_agenda` 5 |
| Peluquería / grooming | — | — | Módulo de peluquerías (4.6) |
| Hotel | — | — | Módulo de centros de servicios (4.7) |
| Cementerio / cremación | — | — | Aún no existe: el front muestra "Muy pronto". |

**Confirmar con el equipo** antes de programar: el escritorio hoy trata el ítem (especialidad, procedimiento o examen) **solo
como etiqueta**, no filtra profesionales por él (ver 5.6). Hay que decidir de dónde sale qué profesional ofrece
cada ítem. Lo más directo es su arancel en `aranceles_profesionales` o su `id_tipo_especialidad`. Mientras no se
decida, filtra por `tipo_agenda` y por especialidad, y usa el ítem solo para mostrar el valor.

### 3.6 La lógica que ya existe y se debe reutilizar

| Qué | Dónde | Uso |
|---|---|---|
| Guardar una reserva con todas las validaciones | `App\Services\AccesoAgendaVeterinaria::guardarReserva(HoraMedica $hora, int $duracion)` | Valida, dentro de una transacción con bloqueo del profesional, que la hora: (1) sea futura; (2) esté dentro de un turno del día; (3) calce con el paso del bloque; (4) no esté bloqueada; (5) no choque con otra hora del profesional **en ningún lugar**. Si algo falla, lanza `ValidationException`; si no, guarda. **No usa sesión**, así que sirve para la API pública. |
| Validar el acceso con sesión | `AccesoAgendaVeterinaria::reserva()` | **No** se usa en la API pública: exige sesión. Su regla útil (que el profesional atienda en ese lugar con `estado = 1`) hay que repetirla a mano. |
| Reserva del escritorio | `EscritorioPaciente::agendar_horas` (ruta `paciente.solicitar.hora`) | Referencia de los campos, el "ya tiene hora ese día", la vinculación al lugar, Jitsi y el correo. |
| Próxima hora | `EscritorioGeneral::cargarFechaMasProxima` y `proximaHoraPorLugar` | Referencia; ojo con 5.4. |
| Días y horas | `EscritorioGeneral::diasLaboralesProfesionaLugarAtencionBuscador` y `horasDisponiblesProfesionalLugarAtencionBuscador` | Referencia; ojo con 5.3 y 5.4. |
| Búsqueda | `EscritorioGeneral::buscarProfesionalBuscador` | Referencia de filtros y de la regla "solo con horario"; ojo con 5.5. |
| Ficha | `EscritorioGeneral::informacionProfesional` | Referencia. |
| Registro rápido de mascota | `MascotasController` (ruta `paciente.mascotas.registro_rapido`) | Referencia de los campos con que se crea una mascota. |
| Razas | `MascotasController::razasPorEspecie` | Referencia. |
| Peluquería | `ReservaServiciosTutorController::peluquerias`, `peluqueriaHoras`, `peluqueriaReservar` | Hoy exigen sesión. Hay que hacer versiones públicas. |
| Hotel | `ReservaServiciosTutorController::hoteles` y la ruta `paciente.centros_servicios.solicitar` | Hoy exigen sesión. Hay que hacer versiones públicas. |

---

## 4. Recorrido completo de una reserva, paso a paso

### 4.1 Al cargar la página

El front llama a `catalogo` y llena Región y las opciones de Servicio. No se pide nada más hasta que la persona actúa.

### 4.2 Paso 1 — Mascota (identificar al tutor)

1. La persona escribe su RUT. El front valida el dígito verificador y lo envía formateado (`11.111.111-1`, K mayúscula).
2. `responsable` busca en `pacientes` comparando el RUT **normalizado**: sin puntos ni guion y en mayúsculas.
   Usa `findPacienteByRut` de `VetsdiInicioReservaController`.
3. **Si existe**, devuelve:
   - el id del tutor;
   - su nombre;
   - **email y teléfono enmascarados** (por ejemplo `ca•••@correo.cl`, `+56 9 •••• 5678`): la ruta es pública y cualquiera puede escribir un RUT ajeno;
   - sus mascotas **seleccionables** (`Mascota::seleccionables()`: vivas y con `estado` distinto de 0), con especie y raza.
4. **Si no existe**, devuelve `encontrado: false`. El front pide los datos del tutor y de la mascota. **Todavía no se crea nada.**

### 4.3 Pasos 2 a 4 — Búsqueda, resultado, día y hora

1. **`buscar`** devuelve solo profesionales con horario en algún lugar de atención activo, en la región o comuna pedida, y con la agenda que corresponde al servicio (3.5).
2. **"Ver lugares de atención"** llama a `proxima_hora_lugar` por cada lugar.
3. **Fecha y hora:** al elegir prestador y lugar, `dias` entrega los días de la semana con atención. Al elegir un día, `horas` entrega los bloques libres.
4. **Mismo cálculo en todo:** `horas` debe calcular los bloques **igual** que `guardarReserva`. Si no, se ofrecerán horas que después se rechazan:
   - todos los turnos del día;
   - el paso de `duracion_consulta`;
   - los bloqueos;
   - los choques en **cualquier** lugar del profesional;
   - solo horas que empiecen dentro de más de 30 minutos.

### 4.4 Paso 5 — Confirmar (`reservar`)

Orden obligatorio dentro del controlador:

1. **Validar la entrada.** Ver 6.9.
2. **Validar el profesional y el lugar:**
   - el profesional existe;
   - atiende en ese lugar (`profesionales_lugares_atencion` con `estado = 1`);
   - tiene un turno del `tipo_agenda` que corresponde.
3. **Calcular la duración** según el turno que contiene esa hora (`duracion_consulta`).
4. **Resolver el tutor:**
   - **Con `responsable_id`:** cargar el paciente y comprobar que su RUT normalizado coincide con `responsable_rut`. **No modificar sus datos** (nombre, email, teléfono): se ignora lo que venga en `responsable_*`. El correo se envía al email guardado.
   - **Sin `responsable_id`:** buscar por RUT. Si existe, es la misma persona: usar ese registro sin modificarlo. Si no existe, crearlo como hoy hace `reservar` (`token`, `rut` formateado, nombres, apellidos, `telefono_uno`, `email` en minúsculas, `sexo = 'O'`, `fecha_nac = '2000-01-01'`, la primera `id_prevision`). **No** buscar ni reutilizar un paciente por email.
5. **Resolver la mascota:**
   - **Con `mascota_id`:** debe pertenecer al tutor (`id_responsable`) y ser seleccionable.
   - **Mascota nueva:** **primero** dejar todo validado:
     - el bloque sigue libre;
     - el tutor ya está resuelto;
     - no tiene otra hora ese día con ese profesional;
     - la especie y la raza son válidas (la raza debe ser de esa especie).

     **Recién entonces** crearla. `mascotas` es MyISAM: si se crea antes y la reserva falla, queda una mascota huérfana que no se borra sola.
   - **Campos de la mascota nueva**, como en el registro rápido: `id_responsable`, `nombre`, `especie_id` = `especie`, `raza_id` (o `null` si es Mixto), `otra_especie` (si es "Otros"), `sexo` (`M`/`F`, o `null` si no lo indicó), `tiene_chip = false`, `esterilizado = false`, los registros JSON vacíos (`vacunas_registro`, `desparasitaciones_registro`, `suscripciones_servicios_registro`, `reservas_servicios_registro`), `estado = 1`, `id_user = $paciente->id_usuario`, y `origen_registro` con un valor que indique la web pública (confirmar el valor con el equipo).
6. **Regla del escritorio:** si el tutor ya tiene una hora ese día con el mismo profesional, el mismo `tipo_hora_medica` y la misma mascota, responder `estado: 0` con el mensaje "Tu mascota ya tiene una hora con este profesional ese día."
7. **Armar la `HoraMedica`** (3.3) y guardarla con `AccesoAgendaVeterinaria::guardarReserva($hora, $duracion)`. Si lanza `ValidationException`, responder `estado: 0` con su mensaje: "El horario está ocupado o bloqueado…".
8. **Después de guardar:**
   - vincular la mascota al lugar: `$mascota->vincularLugarAtencion($idLugar, LugarAtencionInstitucionResolver::resolve($idLugar), 'agenda_responsable')`;
   - videoconsulta (`T`): crear la sala con `JitsiController::jitsiRegistroMeet($idProfesional, $idPaciente, $hora->id)` y guardarla en `video_llamada`, como en el escritorio;
   - enviar el correo `hora_agendada` al email **guardado** del tutor.
9. **Responder** `estado: 1` con el registro (6.9).

### 4.5 Qué ve después el tutor

- **Tutor nuevo:** queda en `pacientes` sin cuenta (`id_usuario = null`). **Verificar** que, cuando más tarde se
  registre con ese RUT, el registro **enlace** ese mismo paciente y sus mascotas, y no cree un duplicado. Si hoy no lo hace,
  avisar antes de publicar.
- **Tutor con cuenta:** la hora aparece en su escritorio y en el de la mascota.
- **Profesional:** la hora aparece en su agenda del lugar de atención, en estado Reservada.

### 4.6 Peluquería

1. **Búsqueda:** sobre la base de `ReservaServiciosTutorController::peluquerias`, filtrando por región o comuna. Cada sucursal es un "lugar".
2. **Calendario y horas:** con `peluqueriaHoras`. Sin `fecha` devuelve `dias`, `desde` y `hasta`; con `fecha` y `duracion` devuelve las horas libres.
3. **Reserva:** con la misma lógica de `peluqueriaReservar` (cita en el módulo de peluquería y registro del cliente). El tutor y la mascota se resuelven como en 4.4 (por RUT, mascota nueva al final). `inicio` = `fecha` + `hora` en formato `Y-m-d\TH:i`.

### 4.7 Hotel

1. **Búsqueda:** sobre la base de `ReservaServiciosTutorController::hoteles`.
2. **Solicitud:** se crea con la misma lógica de `paciente.centros_servicios.solicitar`. El tutor y la mascota se resuelven como en 4.4.
3. **El hotel no confirma al instante.** El front muestra "¡Solicitud enviada!" y la respuesta debe dejar claro que queda pendiente.

---

## 5. Lo que ya quedó corregido en vetsdi (13-11-2026)

Estos errores existían y **ya están arreglados**. No hay que volver a programarlos, pero sí respetarlos
al construir lo que falta:

1. **Disponibilidad común: `App\Services\AgendaDisponibilidad` (nuevo).** Calcula las horas libres con los mismos
   criterios con que `AccesoAgendaVeterinaria::guardarReserva` guarda la hora:
   - domingo = 0 (un 7 antiguo también cuenta como domingo);
   - todos los turnos del día (mañana y tarde);
   - bloques que avanzan de a `duracion_consulta` y terminan dentro del turno;
   - sin horas pasadas;
   - sin bloqueos **activos** (`estado = 1`);
   - sin choques con otras horas del profesional en **cualquier** lugar.

   Sus métodos: `turnos()`, `diasConAtencion()`, `bloquesLibres()` y `proximaPorLugar()`. **Usarlo en todo lo nuevo.**
2. **Escritorio con la misma disponibilidad.** `EscritorioGeneral::cargarFechaMasProxima`, `proximaHoraPorLugar`,
   `diasLaboralesProfesionaLugarAtencionBuscador` y `horasDisponiblesProfesionalLugarAtencionBuscador` usan el servicio.
   Responden con el mismo formato de antes. El domingo ya aparece en el calendario, en "Atiende los días" y en las horas.
3. **Bloqueos anulados.** `guardarReserva` ahora solo considera los bloqueos activos (`estado = 1`). Un bloqueo anulado por el profesional ya no impide reservar.
4. **Reserva pública (`api/vetsdinicio/reservar`) reescrita:**
   - **Tutor existente:** se identifica por RUT y **no se modifican sus datos**, aunque la web envíe otro nombre, correo o teléfono. Ya no se busca tutor por correo.
   - **Tutor nuevo:** se crea con sus datos.
   - **Hora:** debe ser uno de los bloques libres y se guarda con `guardarReserva`.
   - **Mascota nueva:** se crea al final, con raza, sexo y "otra especie". Si la hora no se puede guardar, se borra (la tabla `mascotas` es MyISAM y no hace rollback).
   - **Validaciones nuevas:** RUT con dígito verificador; raza de la especie elegida; test FeLV solo para gatos; una hora por día con el mismo profesional para la misma mascota.
   - **Después de guardar:** vincula la mascota al lugar de atención, crea la sala Jitsi si es videoconsulta y envía el correo al email **guardado** del tutor.
   - **Parámetros que acepta:** `id_prestador` (o `id_profesional`), `servicio` y `modalidad`, de los que deriva el tipo de hora (`C`, `E`, `P` o `T`).
5. **`api/vetsdinicio/responsable`** ya tiene ruta (`throttle:10,1`):
   - devuelve el correo y el teléfono **enmascarados**;
   - devuelve solo mascotas seleccionables, con raza.
6. **`api/vetsdinicio/horas`** usa el servicio:
   - acepta `id_prestador`;
   - devuelve `horas: ["16:00", …]` además de `horarios`;
   - un día sin horas responde `estado: 1` con `horas: []`.
7. **Filtro por especialidad en el buscador del escritorio** (`buscarProfesionalBuscador`). Si el ítem buscado es una especialidad, procedimiento o examen, solo aparecen los veterinarios que lo tienen **activo en sus aranceles** (`aranceles_profesionales`). Usa el mismo cruce de palabras que el valor. "Medicina general veterinaria" no filtra.
   - **Ojo:** en la base local ningún veterinario tiene aranceles cargados, así que esas búsquedas hoy no traen resultados hasta que los veterinarios completen sus aranceles.

**Sigue sin copiarse:** `buscarProfesionalBuscador` arma SQL concatenando lo que llega en la petición. En la API
pública todo va con bindings o con Eloquent.

## 6. Contrato de cada llamada (lo que el front ya espera)

- Todas son `GET {API}/{ruta}?parámetros`, salvo `reservar` (`POST` con JSON).
- `{API}` sale de `include/agenda-config.php`: `http://vetsdi.local/api/vetsdinicio` en local y `https://veterchile.cl/api/vetsdinicio` en producción.
- Toda respuesta lleva `estado: 1` si salió bien. Si no, lleva `estado: 0` y `msj` con un texto en español para el usuario: el front lo muestra tal cual.
- Ejemplos completos de cada forma están en `assets/js/buscador-reserva-datos.js`.
- **CORS:** `config/cors.php` ya permite `api/*` desde cualquier origen. No hay que tocarlo.

### 6.1 `catalogo`

```json
{
  "estado": 1,
  "regiones": [{ "id": 7, "nombre": "Metropolitana de Santiago" }],
  "especies": [{ "id": 1, "nombre": "Canina" }, { "id": 2, "nombre": "Felina" }, { "id": 8, "nombre": "Otros" }],
  "razas": { "1": [{ "id": 12, "nombre": "Beagle" }], "2": [{ "id": 140, "nombre": "Siamés" }] },
  "servicios": [
    { "id": "consulta", "nombre": "Consulta", "label_item": "Especialidad",
      "items": ["Medicina general veterinaria", "Cardiología veterinaria"] },
    { "id": "procedimiento", "nombre": "Procedimiento", "label_item": "Procedimiento", "items": ["Vacunación"] },
    { "id": "examenes", "nombre": "Exámenes", "label_item": "Examen",
      "items": ["Radiografías", { "nombre": "Test de leucemia felina (FeLV)", "especie_ids": [2] }] },
    { "id": "peluqueria", "nombre": "Peluquería / grooming", "label_item": "", "items": [] },
    { "id": "hotel", "nombre": "Hotel", "label_item": "", "items": [] },
    { "id": "cementerio", "nombre": "Cementerio / cremación", "label_item": "", "items": [] }
  ],
  "videoconsulta": ["Medicina general veterinaria"]
}
```

- **`especies`:** todas las de `especies_mascotas`. El front pide "¿Cuál es la especie?" cuando el nombre empieza con "Otr…".
- **`razas`:** de `razas_mascotas`, agrupadas por `especie_id`. **Solo perro (1) y gato (2)**: el select Raza aparece únicamente para ellos, con "Mixto" (valor vacío) como primera opción.
- **`servicios`:** los seis `id` son fijos; el front decide con ellos qué mostrar. `nombre` llena el select Servicio y `label_item` titula el segundo select. Si `items` está vacío, no hay segundo select.
- **Ítems por especie:** un ítem puede ser texto o `{ "nombre", "especie_ids" }`. Con `especie_ids`, solo se ofrece a esas especies.
  - **Regla de negocio:** el Test de leucemia felina (FeLV) va **solo en Exámenes** y **solo para gatos**.
  - **El backend también debe validarlo:** si llega FeLV para una mascota que no es gato, se rechaza.
- **`videoconsulta`:** solo medicina general.
- **"Medicina general veterinaria"** es el nombre que ve el tutor; en los aranceles corresponde a "Consulta veterinaria general" (igual que en el escritorio).

### 6.2 `ciudades`

`?id_region=7` → `{ "estado": 1, "ciudades": [{ "id": 702, "nombre": "Providencia" }] }`

### 6.3 `responsable` (ruta nueva; el método ya existe)

`?rut=11.111.111-1`

```json
{ "estado": 1, "encontrado": true,
  "responsable": { "id": 501, "rut": "11.111.111-1", "nombres": "Camila Andrea", "apellido_uno": "Rojas",
                   "apellido_dos": "Muñoz", "email": "ca•••@correo.cl", "telefono": "+56 9 •••• 5678" },
  "mascotas": [{ "id": 9001, "nombre": "Luna", "especie_id": 1, "especie_nombre": "Canina", "sexo": "F",
                 "raza_id": 105, "raza_nombre": "Golden retriever" }] }
```

- Si el RUT no existe: `{ "estado": 1, "encontrado": false, "responsable": null, "mascotas": [] }`.
- Lleva `throttle` estricto, igual que `reservar` (10 por minuto).
- `apellido_dos` va vacío si en la base es `'N/A'`.

### 6.4 `buscar`

| Parámetro | Valor |
|---|---|
| `modo` | `servicio` · `veterinario` (por nombre o RUT) · `video` |
| `servicio` | `consulta` · `procedimiento` · `examenes` · `peluqueria` · `hotel` (en `veterinario` y `video` llega `consulta`) |
| `item` | ítem elegido (vacío en `veterinario`) |
| `q` | nombre o RUT del veterinario (solo en `veterinario`) |
| `id_region`, `id_ciudad` | ubicación (vacíos en `video`; la comuna es opcional) |
| `especie_id` | especie de la mascota (vacía si es mascota nueva y aún no se eligió) |

Respuesta: `{ "estado": 1, "registros": [ … ] }`. Si no hay resultados, `registros: []` con `estado: 1`.

```json
{
  "id": 11,
  "tipo": "veterinario",
  "rut": "15.234.567-8",
  "nombre": "Patricia Andrea", "apellido_uno": "Acevedo", "apellido_dos": "Chamorro",
  "imagen": "http://vetsdi.local/images/img_perfil/15234567.png",
  "especialidad": "Medicina general veterinaria",
  "valor": { "valor": 25000, "desde": false },
  "proxima": { "fecha": "2026-11-16", "hora": "09:00", "id_lugar": 101 },
  "lugares": [
    { "id": 101, "nombre": "Clínica Veterinaria Los Aromos", "direccion": "Av. Providencia 1234",
      "ciudad": "Providencia", "region": "Metropolitana de Santiago", "telefono": "+56 2 2345 6789",
      "dias": [1, 2, 3, 4, 5], "tramos": [["09:00", "13:00"], ["15:00", "18:00"]] }
  ],
  "procedimientos": [], "servicios_hotel": null, "precios": null
}
```

- **Quiénes aparecen:** solo profesionales con turno del `tipo_agenda` del servicio en al menos un lugar con `profesionales_lugares_atencion.estado = 1`. En `lugares` van **solo** esos lugares, filtrados por región o comuna si se pidieron.
- **`imagen`:** URL absoluta de la foto (`images/img_perfil/{rut sin dv}.png`), o vacía si no tiene. **No** mandar `usuario_profesional.svg`: el front pone su propio avatar genérico cuando viene vacía.
- **`especialidad`:** en `modo=servicio`, el ítem buscado; en los otros modos, la especialidad del profesional.
- **`valor`:** el valor del arancel del profesional para ese ítem. `null` → "Valor a consultar con el veterinario". `desde: true` → "Desde $…".
- **`proxima`:** la primera hora libre entre sus lugares, calculada con las reglas de 4.3. `null` → "Sin agenda disponible".
- **`dias` y `tramos` de cada lugar:** en `dias`, **1 = lunes … 7 = domingo**: convertir el 0 de la base a 7. `tramos` es la lista `[inicio, término]` en `HH:MM`.
- **Peluquería y hotel:** `tipo: "peluqueria"` o `"hotel"`, `nombre` = nombre del negocio y `apellido_*` vacíos.
  - **Peluquería:** `procedimientos: [{ "id", "nombre", "duracion", "precio" }]`, y `valor` = el precio más bajo con `desde: true`.
  - **Hotel:** `servicios_hotel: { "hotel": bool, "guarderia": bool }`, `precios: { "noche", "semana", "mes" }`, y `valor: { "valor": noche, "detalle": "por noche" }`.
  - **En los dos:** cada sucursal o centro va como un elemento de `lugares`.
- **Límite:** máximo 80 resultados, ordenados por la próxima hora más cercana.

### Parámetros comunes de 6.5 a 6.8

Además de los propios, estas cuatro llamadas reciben siempre:

- `tipo`: `veterinario`, `peluqueria` u `hotel`. Es necesario porque el id de una peluquería o de un hotel puede repetirse con el de un veterinario.
- `servicio`: `consulta`, `procedimiento`, `examenes`, `peluqueria` u `hotel`.
- `modalidad`: `presencial` o `videoconsulta`.

Con `servicio` y `modalidad` se elige el `tipo_agenda` (3.5).

### 6.5 `proxima_hora_lugar`

`?id_prestador=11&id_lugar_atencion=101&tipo=veterinario&servicio=consulta&modalidad=presencial`
→ `{ "estado": 1, "proxima": { "fecha": "2026-11-16", "hora": "09:00" } }`

Si no hay horas, `proxima` viene `null`.

### 6.6 `ficha`

`?id_prestador=11&tipo=veterinario&servicio=consulta&modalidad=presencial`
→ `{ "estado": 1, "ficha": { … misma forma que un registro de buscar, más "descripcion" … } }`

No incluir RUT, email ni teléfono personal del profesional. El teléfono del **lugar** sí se puede mostrar.

### 6.7 `dias`

`?id_prestador=11&id_lugar_atencion=101&tipo=veterinario&servicio=consulta&modalidad=presencial`
→ `{ "estado": 1, "dias": [1,2,3,4,5], "desde": "2026-11-13", "hasta": "2027-01-12" }`

- **`dias`:** 1 = lunes … 7 = domingo.
- **`desde`:** hoy.
- **`hasta`:** hasta dónde se permite reservar. Si no hay una regla en el sistema, usar 60 días.

### 6.8 `horas`

`?id_prestador=11&id_lugar_atencion=101&fecha=2026-11-16&tipo=veterinario&servicio=consulta&modalidad=presencial&duracion=`
→ `{ "estado": 1, "horas": ["09:00", "09:30", "10:00"] }`

- **Orden:** de menor a mayor, en una sola lista. El front no las separa en mañana y tarde.
- **`duracion`:** solo en peluquería, en minutos (la suma de los servicios elegidos).
- **Un día sin bloques libres:** responder `estado: 1` con `horas: []`.

### 6.9 `reservar` (`POST`, JSON)

```json
{
  "tipo": "veterinario",
  "modalidad": "presencial",
  "servicio": "consulta",
  "item": "Medicina general veterinaria",
  "id_prestador": 11,
  "id_lugar_atencion": 101,
  "fecha": "2026-11-16",
  "hora": "09:00",
  "responsable_id": 501,
  "responsable_rut": "11.111.111-1",
  "responsable_nombres": "Camila Andrea",
  "responsable_apellido_uno": "Rojas",
  "responsable_apellido_dos": "Muñoz",
  "responsable_email": "ca•••@correo.cl",
  "responsable_telefono": "+56 9 •••• 5678",
  "mascota_id": 9001,
  "mascota_nombre": "",
  "mascota_especie_id": "",
  "mascota_otra_especie": "",
  "mascota_sexo": "",
  "mascota_raza_id": "",
  "comentarios": ""
}
```

**Validación:**

- `tipo`: `in:veterinario,peluqueria,hotel`.
- `modalidad`: `in:presencial,videoconsulta`.
- `servicio`: `in:consulta,procedimiento,examenes,peluqueria,hotel`.
- `id_prestador` y `id_lugar_atencion`: enteros.
- `fecha`: `Y-m-d`; `hora`: `H:i` (no en hotel).
- `responsable_rut`: obligatorio y con dígito verificador válido.
- **Si `responsable_id` viene vacío**, son obligatorios: `responsable_nombres`, `responsable_apellido_uno`, `responsable_email` (email válido) y `responsable_telefono`.
- **Si `mascota_id` viene vacío**, son obligatorios: `mascota_nombre` y `mascota_especie_id`. En ese caso:
  - `mascota_raza_id`: opcional, y debe ser de esa especie;
  - `mascota_sexo`: `M`, `F` o vacío;
  - `mascota_otra_especie`: obligatoria si la especie es "Otros".
- `comentarios`: opcional. Hoy llega **vacío**, porque el campo está oculto en la página.

**Campos extra por tipo:**

- **Peluquería:** `procedimiento_ids: [1, 3]`.
- **Hotel:** en vez de `fecha` y `hora`, llegan `estadia` (`hotel` | `guarderia`), `fecha_ingreso` y `fecha_salida` (hotel), y `plan` (`semana` | `mes`) y `cantidad` (guardería).

**Respuesta correcta:**

```json
{ "estado": 1, "msj": "Reserva creada correctamente.", "registro": { "id": 1234 } }
```

**Respuestas con error:** `{ "estado": 0, "msj": "…" }`. Usar estos mensajes:

| Caso | `msj` |
|---|---|
| El bloque se ocupó o está bloqueado | "La hora seleccionada ya no está disponible. Elige otra." |
| El RUT no coincide con el tutor | "El RUT no coincide con el tutor seleccionado." |
| La mascota no es de ese tutor | "La mascota seleccionada no corresponde al tutor." |
| Ya tiene hora ese día | "Tu mascota ya tiene una hora con este profesional ese día." |
| Datos inválidos | "Revisa los datos ingresados." (con `errores` de Laravel) |

---

## 7. Tareas en orden

Todo en `vetsdi_laravel13`. Las rutas nuevas van dentro de `Route::prefix('vetsdinicio')` en `routes/api.php`: las de lectura con `throttle:60,1`, y `responsable` y `reservar` con `throttle:10,1`.

1. **Lógica común de agenda.** *(ya hecho: `App\Services\AgendaDisponibilidad`, ver 5.1)*. Usarla en todo lo nuevo.
2. **`catalogo`.** *(pendiente)* Agregar `especies`, `razas` (solo 1 y 2), `servicios` y `videoconsulta`, según 6.1. Mantener `regiones`.
   - **Criterio:** con gato, Exámenes trae FeLV; con perro, no.
3. **`responsable`.** *(ya hecho, ver 5.5)*
4. **`buscar`.** Crear la ruta según 6.4: filtros con bindings, regla "solo con horario" por `tipo_agenda`, valor desde los aranceles, `proxima` y `dias`/`tramos` con el servicio de la tarea 1.
5. **`proxima_hora_lugar`, `ficha`, `dias` y `horas`.** Crear o ajustar según 6.5 a 6.8, todas con el servicio de la tarea 1. `horas` ya está hecha (ver 5.6).
6. **`reservar` para veterinarios.** *(ya hecho, ver 5.4)*.
7. **Peluquería y hotel públicos.** Según 4.6 y 4.7, reutilizando la lógica de `ReservaServiciosTutorController`, que hoy exige sesión. Responder con la forma de 6.4 y 6.9.
8. **Revisar el registro de cuentas** (4.5): un tutor creado desde la web debe quedar enlazado cuando se registre con su RUT.
9. **En `veterchile_informativa`:** en `agendamiento.php`, cambiar `$buscador_modo = 'ejemplo';` por `'api'`. Si alguna ruta quedó con otro nombre, declararla antes de cargar `buscador-reserva.js`:

   ```html
   <script>window.BUSCADOR_RESERVA_RUTAS = { buscar: 'profesionales' };</script>
   ```

   Las claves posibles son `catalogo`, `ciudades`, `responsable`, `buscar`, `proximaHoraLugar`, `ficha`, `dias`, `horas` y `reservar`.
10. **Pruebas de la sección 8.**

---

## 8. Pruebas

### 8.1 Antes de probar: datos de prueba

En local hay pocos horarios cargados. Arma este caso antes de empezar:

- un profesional con `id_especialidad = 1`, activo en dos lugares de atención de comunas distintas;
- un turno de mañana y otro de tarde el mismo día;
- un turno que incluya el **domingo** (`dia` con 0);
- un bloqueo de un día;
- un tutor con cuenta y dos mascotas: un perro y un gato.

### 8.2 En pantalla (`http://localhost/veterchile_informativa/agendamiento.php`, con la consola abierta y sin errores rojos)

- [ ] **Región:** al cargar, el select trae las regiones reales.
- [ ] **Tutor registrado:** su RUT muestra sus mascotas. El email y el teléfono del resumen aparecen enmascarados.
- [ ] **RUT válido que no existe:** aparece el formulario "Datos Tutor / Responsable" + "Tu mascota". El select Raza aparece solo con perro o gato.
- [ ] **FeLV:** con gato, Exámenes trae el test; con perro, no.
- [ ] **Búsqueda:** salen solo profesionales con horario. "Ver lugares de atención" muestra la próxima hora de cada lugar.
- [ ] **Calendario:** marca el domingo si el profesional atiende ese día.
- [ ] **Horas:** incluyen la mañana y la tarde, no muestran el día bloqueado ni las horas ocupadas en el otro lugar, y no hay ninguna que empiece en menos de 30 minutos.
- [ ] **Confirmar:** muestra "¡Hora reservada!" y llega el correo.
- [ ] **Hora tomada entremedio:** abre la misma hora en dos pestañas y confirma en las dos. La segunda debe mostrar "La hora seleccionada ya no está disponible".
- [ ] **Celular** (375 px de ancho): sin desplazamiento lateral.

### 8.3 En la base de datos, después de reservar

Revisar `horas_medicas`:

```sql
SELECT id, id_paciente, id_mascota, id_profesional, id_lugar_atencion, fecha_consulta,
       hora_inicio, hora_termino, tipo_hora_medica, id_estado, observaciones
FROM horas_medicas ORDER BY id DESC LIMIT 5;
```

Debe cumplir:

- `id_estado = 1`;
- `tipo_hora_medica` según el servicio;
- `hora_termino` = inicio + duración del bloque;
- `id_paciente` = el tutor;
- `id_mascota` = la mascota.

Revisar los demás registros:

- [ ] `mascota_lugares_atencion` tiene la mascota con ese `id_lugar_atencion` y `origen = 'agenda_responsable'`.
- [ ] **Tutor nuevo:** está en `pacientes` con el RUT formateado y `id_usuario` en `null`, y **no** se duplicó.
- [ ] **Tutor existente:** sus datos (`email`, `telefono_uno`, `nombres`) **no** cambiaron.
- [ ] **Mascota nueva:** está en `mascotas` con `id_responsable`, `especie_id`, `raza_id` y `sexo`.
- [ ] **Reserva fallida con mascota nueva** (por ejemplo, hora ya ocupada): **no** quedó una mascota creada.
- [ ] **Escritorio:** la hora se ve en la agenda del profesional y, si el tutor tiene cuenta, en su escritorio y en el de la mascota.

---

## 9. El mismo buscador en el escritorio de cada mascota (ya hecho)

`http://vetsdi.local/Paciente/mascota/reservar-hora/{id_mascota}` (`EscritorioPacienteDependiente::agendarHora`)
ya usa el mismo flujo del modal "Reservar hora" del escritorio del tutor:

- **Pasos:** no hay paso Mascota, porque la mascota viene ya elegida. Quedan Búsqueda → Resultado → Fecha y hora → Confirmar, con los botones en el pie de la tarjeta.
- **Servicios:** los mismos del modal (Consulta, Procedimiento, Exámenes, Peluquería / grooming, Hotel, Cementerio). Con gato, Exámenes trae el test FeLV.
- **Llamadas:** las del escritorio, con sesión (`profesional.*`, `paciente.solicitar.hora`, `paciente.reserva_servicios.*`). No usa la API pública.
- **Código compartido.** El resultado (pastilla, valor y lugares desplegables), los días de atención, la fecha completa y los botones en el pie viven en dos parciales que usan el modal y esta página:
  - `partials/reserva_tutor_script.blade.php`;
  - `partials/reserva_tutor_estilos.blade.php`.

  Si se cambia algo del flujo, se cambia ahí.

## 10. Lo que no se debe cambiar

- **El diseño de `agendamiento.php`:** estructura, textos, colores, tamaños y orden de los campos. Lo aprobó la diseñadora.
- **La forma de las respuestas de la sección 6.** Si el backend necesita otra forma, se adapta en `fuenteApi` de `buscador-reserva.js`, sin tocar el resto del archivo.
- **`agendamiento_bak_20261113.php` y `assets/js/agenda.js`:** son el respaldo de la versión anterior.
- **En `vetsdi_laravel13`:** las vistas y el CSS del escritorio. Esta tarea es solo de backend (rutas, controladores y servicios).
