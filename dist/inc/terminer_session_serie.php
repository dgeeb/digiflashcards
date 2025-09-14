<?php

session_start();

require 'headers.php';

if (!empty($_POST['serie'])) {
	$serie = $_POST['serie'];
	unset($_SESSION['digiflashcards'][$serie]['reponse']);
	echo 'session_terminee';
	exit();
} else {
	header('Location: ../');
	exit();
}

?>
