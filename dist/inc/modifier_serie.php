<?php

session_start();

require 'headers.php';

$_POST = json_decode(file_get_contents('php://input'), true);

if (!empty($_POST['serie']) && !empty($_POST['donnees'])) {
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
			$donnees = $_POST['donnees'];
			$stmt = $db->prepare('UPDATE digiflashcards_series SET donnees = :donnees WHERE url = :url');
			if ($stmt->execute(array('donnees' => json_encode($donnees), 'url' => $serie))) {
				if (!empty($_POST['image'])) {
					$image = $_POST['image'];
					if (file_exists('../fichiers/' . $serie . '/' . $image)) {
						unlink('../fichiers/' . $serie . '/' . $image);
					}
					if (file_exists('../fichiers/' . $serie . '/vignette_' . $image)) {
						unlink('../fichiers/' . $serie . '/vignette_' . $image);
					}
				}
				if (!empty($_POST['audio'])) {
					$audio = $_POST['audio'];
					if (file_exists('../fichiers/' . $serie . '/' . $audio)) {
						unlink('../fichiers/' . $serie . '/' . $audio);
					}
				}
				if (!empty($_POST['fichiers'])) {
					$fichiers = json_decode($_POST['fichiers'], true);
					foreach ($fichiers as $fichier) {
						if (file_exists('../fichiers/' . $serie . '/' . $fichier)) {
							unlink('../fichiers/' . $serie . '/' . $fichier);
						}
					}
				}
				echo 'serie_modifiee';
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
