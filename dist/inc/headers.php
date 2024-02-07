<?php

$env = '../.env';
if (isset($_SESSION['domainesAutorises']) || file_exists($env)) {
	if (isset($_SESSION['domainesAutorises']) && $_SESSION['domainesAutorises'] !== '') {
		$domainesAutorises = $_SESSION['domainesAutorises'];
	} else if (file_exists($env)) {
		$donneesEnv = explode("\n", file_get_contents($env));
		foreach ($donneesEnv as $ligne) {
			preg_match('/([^#]+)\=(.*)/', $ligne, $matches);
			if (isset($matches[2])) {
				putenv(trim($ligne));
			}
		}
		$domainesAutorises = getenv('AUTHORIZED_DOMAINS');
		$_SESSION['domainesAutorises'] = $domainesAutorises;
	}
	if ($domainesAutorises === '*') {
		$origine = $domainesAutorises;
	} else {
		$domainesAutorises = explode(',', $domainesAutorises);
		$origine = $_SERVER['SERVER_NAME'];
	}
	if (in_array($origine, $domainesAutorises, true) || $origine === '*') {
		header('Access-Control-Allow-Origin: $origine');
		header('Access-Control-Allow-Methods: POST');
		header('Access-Control-Max-Age: 1000');
		header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
	} else {
		header('Location: ../');
		exit();
	}
} else {
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: POST');
	header('Access-Control-Max-Age: 1000');
	header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
}

?>
