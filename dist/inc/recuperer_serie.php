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
