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

if (!empty($_FILES['blob']) && !empty($_POST['serie'])) {
	$ancienfichier = $_POST['ancienfichier'];
	$serie = $_POST['serie'];
	$extension = pathinfo($_FILES['blob']['name'], PATHINFO_EXTENSION);
	if (!file_exists('../fichiers/' . $serie)) {
		mkdir('../fichiers/' . $serie, 0775, true);
	}
	$nom = hash('md5', $_FILES['blob']['tmp_name']) . time() . '.' . $extension;
	$chemin = '../fichiers/' . $serie . '/' . $nom;
	if (move_uploaded_file($_FILES['blob']['tmp_name'], $chemin)) {
		if ($ancienfichier !== '') {
			if (file_exists('../fichiers/' . $serie . '/' . $ancienfichier)) {
				unlink('../fichiers/' . $serie . '/' . $ancienfichier);
			}
		}
		echo $nom;
	} else {
		echo 'erreur';
	}
	exit();
} else {
	header('Location: ../');
	exit();
}

?>
