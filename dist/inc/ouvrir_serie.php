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

if (!empty($_POST['serie']) && !empty($_POST['question']) && !empty($_POST['reponse'])) {
	require 'db.php';
	$serie = $_POST['serie'];
	$question = $_POST['question'];
	$reponse = strtolower($_POST['reponse']);
	$stmt = $db->prepare('SELECT question, reponse FROM digiflashcards_series WHERE url = :url');
	if ($stmt->execute(array('url' => $serie))) {
		$resultat = $stmt->fetchAll();
		$questionSecrete = '';
		switch ($resultat[0]['question']) {
			case 'Quel est mon mot préféré ?':
				$questionSecrete = 'motPrefere';
				break;
			case 'Quel est mon film préféré ?':
				$questionSecrete = 'filmPrefere';
				break;
			case 'Quelle est ma chanson préférée ?':
				$questionSecrete = 'chansonPreferee';
				break;
			case 'Quel est le prénom de ma mère ?':
				$questionSecrete = 'prenomMere';
				break;
			case 'Quel est le prénom de mon père ?':
				$questionSecrete = 'prenomPere';
				break;
			case 'Quel est le nom de ma rue ?':
				$questionSecrete = 'nomRue';
				break;
			case 'Quel est le nom de mon employeur ?':
				$questionSecrete = 'nomEmployeur';
				break;
			case 'Quel est le nom de mon animal de compagnie ?':
				$questionSecrete = 'nomAnimal';
				break;
			default:
				$questionSecrete = $resultat[0]['question'];
		}
		$reponseSecrete = $resultat[0]['reponse'];
		if ($question === $questionSecrete && password_verify($reponse, $reponseSecrete)) {
			$_SESSION['digiflashcards'][$serie]['reponse'] = $reponseSecrete;
			$type = $_POST['type'];
			if ($type === 'api' && !isset($_SESSION['digiflashcards'][$serie]['digidrive'])) {
				$_SESSION['digiflashcards'][$serie]['digidrive'] = 1;
			}
			echo 'serie_debloquee';
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
