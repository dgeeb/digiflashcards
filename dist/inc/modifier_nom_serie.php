<?php

session_start();

require 'headers.php';

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
		if (!$resultat) {
			echo 'contenu_inexistant';
		} else if ($resultat[0]['reponse'] === $reponse) {
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
