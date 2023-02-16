<?php

session_start();

$listeDomaines = '../../../domaines-autorises.txt';
if (isset($_SESSION['domainesAutorises']) || file_exists($listeDomaines)) {
	if (isset($_SESSION['domainesAutorises']) && $_SESSION['domainesAutorises'] !== '') {
		$domainesAutorises = $_SESSION['domainesAutorises'];
	} else if (file_exists($listeDomaines)) {
		$domainesAutorises = file_get_contents($listeDomaines);
		$_SESSION['domainesAutorises'] = $domainesAutorises;
	}
	$domainesAutorises = explode(',', $domainesAutorises);
	$origine = $_SERVER['SERVER_NAME'];
	if (in_array($origine, $domainesAutorises, true)) {
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

if (!empty($_POST['serie']) && !empty($_POST['nouveaunom'])) {
	require 'db.php';
	$reponse = '';
	$serie = $_POST['serie'];
	if (isset($_SESSION['digiflashcards'][$serie]['reponse'])) {
		$reponse = $_SESSION['digiflashcards'][$serie]['reponse'];
	}
	$stmt = $db->prepare('SELECT reponse FROM digiflashcards_series WHERE url = :url');
	if ($stmt->execute(array('url' => $serie))) {
		$resultat = $stmt->fetchAll();
		if ($resultat[0]['reponse'] === $reponse) {
			$nouveaunom = $_POST['nouveaunom'];
			$stmt = $db->prepare('UPDATE digiflashcards_series SET nom = :nouveaunom WHERE url = :url');
			if ($stmt->execute(array('nouveaunom' => $nouveaunom, 'url' => $serie))) {
				echo 'nom_modifie';
			} else {
				echo 'erreur';
			}
		} else {
			echo 'non_autorise';
		}
	} else {
		echo 'erreur';
	}
	$db = null;
	exit();
} else {
	header('Location: ../');
	exit();
}

?>
