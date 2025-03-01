<?php

session_start();

require 'headers.php';

if (!empty($_POST['nom']) && !empty($_POST['question']) && !empty($_POST['reponse'])) {
	require 'db.php';
	$serie = uniqid('', false);
	$nom = $_POST['nom'];
	$question = $_POST['question'];
	$reponse = password_hash(strtolower($_POST['reponse']), PASSWORD_DEFAULT);
	$donnees = '';
	$date = date('Y-m-d H:i:s');
	$vues = 0;
	$digidrive = 0;
	$stmt = $db->prepare('INSERT INTO digiflashcards_series (url, nom, question, reponse, donnees, date, vues, derniere_visite, digidrive) VALUES (:url, :nom, :question, :reponse, :donnees, :date, :vues, :derniere_visite, :digidrive)');
	if ($stmt->execute(array('url' => $serie, 'nom' => $nom, 'question' => $question, 'reponse' => $reponse, 'donnees' => $donnees, 'date' => $date, 'vues' => $vues, 'derniere_visite' => $date, 'digidrive' => $digidrive))) {
		$_SESSION['digiflashcards'][$serie]['reponse'] = $reponse;
		echo $serie;
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
