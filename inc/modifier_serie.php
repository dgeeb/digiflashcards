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
