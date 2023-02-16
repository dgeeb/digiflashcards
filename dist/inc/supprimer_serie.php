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

if (!empty($_POST['serie'])) {
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
			$stmt = $db->prepare('DELETE FROM digiflashcards_series WHERE url = :url');
			if ($stmt->execute(array('url' => $serie))) {
				if (file_exists('../fichiers/' . $serie)) {
					supprimer('../fichiers/' . $serie);
				}
				echo 'serie_supprimee';
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

function supprimer($path) {
	if (is_dir($path) === true) {
		$files = array_diff(scandir($path), array('.', '..'));
		foreach ($files as $file) {
			supprimer(realpath($path) . '/' . $file);
		}
		return rmdir($path);
	} else if (is_file($path) === true) {
		return unlink($path);
	}
	return false;
}

?>
