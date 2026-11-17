<?php
if(!isset($titulo)) {
	$titulo = 'SDI';
}

/**
 * Agrega la fecha del archivo al final de la ruta de las hojas de estilo,
 * para que el navegador cargue la versión nueva cuando se actualiza el diseño
 * y no siga mostrando la copia guardada en caché.
 */
if (!function_exists('sdi_version')) {
	function sdi_version($ruta)
	{
		$archivo = __DIR__ . '/../' . $ruta;

		return $ruta . (is_file($archivo) ? '?v=' . filemtime($archivo) : '');
	}
}
?>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>VeterChile · Plataforma veterinaria digital</title>
	<meta name="theme-color" content="#6F42C1">
	<link rel="icon" type="image/svg+xml" href="<?php echo sdi_version("assets/images/veterchile/favicon.svg"); ?>">
	<link rel="stylesheet" type="text/css" href="assets/css/bootstrap.min.css">
	<link rel="stylesheet" type="text/css" href="assets/css/owl.carousel.min.css">
	<!-- Estilos -->
  	<link href="<?php echo sdi_version("assets/css/main.css"); ?>" rel="stylesheet" type="text/css">
  	<link href="<?php echo sdi_version("assets/css/style.css"); ?>" rel="stylesheet" type="text/css">
  	<!-- Banners y Sliders -->
  	<link href="assets/css/banners-sliders.css" rel="stylesheet" type="text/css">
  	<link href="assets/css/aos.css" rel="stylesheet" type="text/css">
  	<!-- Portada -->
  	<link href="<?php echo sdi_version("assets/css/landing.css"); ?>" rel="stylesheet" type="text/css">
<?php
	/**
	 * Hojas de estilo propias de una página. Se declaran así antes de incluir
	 * este archivo:  $estilos_extra = array('assets/css/legal.css');
	 */
	if (!empty($estilos_extra) && is_array($estilos_extra)) {
		foreach ($estilos_extra as $hoja) {
			echo "  \t<link href=\"" . sdi_version($hoja) . "\" rel=\"stylesheet\" type=\"text/css\">\n";
		}
	}
?>
  	<script src="https://kit.fontawesome.com/7066bc9f2e.js" crossorigin="anonymous"></script>

  	
  	<script src="https://kit.fontawesome.com/7066bc9f2e.js" crossorigin="anonymous"></script>
	<script src="assets/js/datatables.min.js"></script>
  	

	<!-- Google Fonts -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js"></script>
</head>