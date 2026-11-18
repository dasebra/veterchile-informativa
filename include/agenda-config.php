<?php
/**
 * Asistente "Agendar hora veterinaria" (agendamiento.php).
 *
 * URL base de la API de reservas de VeterChile (proyecto vetsdi_laravel13).
 * El asistente lee de ahí las regiones, los profesionales con sus lugares de
 * atención y las horas disponibles, y crea la reserva en ese mismo sistema.
 *
 *   Local (WAMP):  http://vet-sdi_v13.test/api/vetsdinicio
 *   Producción:    https://veterchile.cl/api/vetsdinicio
 */
$agenda_host = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : '';
$agenda_host = preg_replace('/:\d+$/', '', $agenda_host);

$agenda_api = getenv('VETERCHILE_AGENDA_API') ?: (in_array($agenda_host, array('localhost', '127.0.0.1', 'veterchile-informativa.test', 'veterchile_informativa.test'), true)
	? 'http://vet-sdi_v13.test/api/vetsdinicio'
	: 'https://veterchile.cl/api/vetsdinicio');
