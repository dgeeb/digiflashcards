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

if (!empty($_POST['id'])) {
	require 'db.php';
	$reponse = '';
	$id = $_POST['id'];
	if (isset($_SESSION['digiflashcards'][$id]['reponse'])) {
		$reponse = $_SESSION['digiflashcards'][$id]['reponse'];
	}
	$stmt = $db->prepare('SELECT * FROM digiflashcards_series WHERE url = :url');
	if ($stmt->execute(array('url' => $id))) {
		if ($serie = $stmt->fetchAll()) {
			$admin = false;
			if (count($serie, COUNT_NORMAL) > 0 && $serie[0]['reponse'] === $reponse) {
				$admin = true;
			}
			$donnees = $serie[0]['donnees'];
			if ($donnees !== '') {
				$donnees = json_decode($donnees);
			}
			$digidrive = 0;
			if (isset($_SESSION['digiflashcards'][$id]['digidrive'])) {
				$digidrive = $_SESSION['digiflashcards'][$id]['digidrive'];
			}
			echo json_encode(array('nom' => $serie[0]['nom'], 'donnees' => $donnees, 'admin' =>  $admin, 'digidrive' => $digidrive));
		} else {
			echo 'contenu_inexistant';
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
