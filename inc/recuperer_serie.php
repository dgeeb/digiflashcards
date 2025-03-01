<?php

session_start();

require 'headers.php';

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
			} else if (intval($serie[0]['digidrive']) === 1) {
				$digidrive = 1;
			}
			$date = date('Y-m-d H:i:s');
			$vues = 0;
			if ($serie[0]['vues'] !== '') {
				$vues = intval($serie[0]['vues']);
			}
			if ($admin === false) {
				$vues = $vues + 1;
			}
			$stmt = $db->prepare('UPDATE digiflashcards_series SET vues = :vues, derniere_visite = :derniere_visite WHERE url = :url');
			if ($stmt->execute(array('vues' => $vues, 'derniere_visite' => $date, 'url' => $id))) {
				echo json_encode(array('nom' => $serie[0]['nom'], 'donnees' => $donnees, 'vues' => $vues, 'admin' =>  $admin, 'digidrive' => $digidrive));
			} else {
				echo 'erreur';
			}
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
