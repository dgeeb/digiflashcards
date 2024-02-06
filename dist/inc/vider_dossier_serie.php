<?php

session_start();

require 'headers.php';

if (!empty($_POST['serie'])) {
	$serie = $_POST['serie'];
	if (file_exists('../fichiers/' . $serie)) {
		$fichiers = glob('../fichiers/' . $serie . '/' . '*.*');
		foreach ($fichiers as $f) {
			unlink($f);
		}
	}
	echo 'dossier_vide';
	exit();
} else {
	header('Location: ../');
	exit();
}

?>
