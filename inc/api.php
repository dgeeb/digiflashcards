<?php

session_start();

if ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1') {
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: POST');
	header('Access-Control-Max-Age: 1000');
	header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
} else {
	$env = '../.env';
	if (isset($_SESSION['domainesAutorises']) || file_exists($env)) {
		if (isset($_SESSION['domainesAutorises']) && $_SESSION['domainesAutorises'] !== '') {
			$domainesAutorises = $_SESSION['domainesAutorises'];
		} else if (file_exists($env)) {
			$donneesEnv = explode("\n", file_get_contents($env));
			foreach ($donneesEnv as $ligne) {
				preg_match('/([^#]+)\=(.*)/', $ligne, $matches);
				if (isset($matches[2])) {
					putenv(trim($ligne));
				}
			}
			$domainesAutorises = getenv('AUTHORIZED_DOMAINS');
			$_SESSION['domainesAutorises'] = $domainesAutorises;
		}
		if ($domainesAutorises === '*') {
			$origine = $domainesAutorises;
		} else {
			$domainesAutorises = explode(',', $domainesAutorises);
			$origine = $_SERVER['SERVER_NAME'];
		}
		if ($origine === '*' || in_array($origine, $domainesAutorises, true)) {
			header('Access-Control-Allow-Origin: $origine');
			header('Access-Control-Allow-Methods: POST');
			header('Access-Control-Max-Age: 1000');
			header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
		} else {
			echo 'erreur';
			exit();
		}
	} else {
		echo 'erreur';
		exit();
	}
}

$_POST = json_decode(file_get_contents('php://input'), true);

if (!empty($_POST['token']) && !empty($_POST['lien'])) {
	$token = $_POST['token'];
	$domaine = $_SERVER['SERVER_NAME'];
	$lien = $_POST['lien'];
	$donnees = array(
		'token' => $token,
		'domaine' => $domaine
	);
	$donnees = http_build_query($donnees);
	$ch = curl_init($lien);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $donnees);
	$resultat = curl_exec($ch);
	if ($resultat === 'non_autorise' || $resultat === 'erreur') {
		echo 'erreur_token';
	} else if ($resultat === 'token_autorise' && !empty($_POST['action'])) {
		$action = $_POST['action'];
		if ($action === 'creer' && !empty($_POST['nom']) && !empty($_POST['question']) && !empty($_POST['reponse'])) {
			require 'db.php';
			$id = uniqid('', false);
			$nom = $_POST['nom'];
			$question = $_POST['question'];
			$reponse = password_hash(strtolower($_POST['reponse']), PASSWORD_DEFAULT);
			$donnees = '';
			$date = date('Y-m-d H:i:s');
			$stmt = $db->prepare('INSERT INTO digiflashcards_series (url, nom, question, reponse, donnees, date) VALUES (:url, :nom, :question, :reponse, :donnees, :date)');
			if ($stmt->execute(array('url' => $id, 'nom' => $nom, 'question' => $question, 'reponse' => $reponse, 'donnees' => $donnees, 'date' => $date))) {
				echo $id;
			} else {
				echo 'erreur';
			}
			$db = null;
		} else if ($action === 'modifier-titre' && !empty($_POST['id']) && !empty($_POST['titre'])) {
			require 'db.php';
			$nom = $_POST['titre'];
			$id = $_POST['id'];
			$stmt = $db->prepare('UPDATE digiflashcards_series SET nom = :nom WHERE url = :id');
			if ($stmt->execute(array('nom' => $nom, 'id' => $id))) {
				echo 'titre_modifie';
			} else {
				echo 'erreur';
			}
		} else if ($action === 'ajouter' && !empty($_POST['id']) && !empty($_POST['question']) && !empty($_POST['reponse'])) {
			require 'db.php';
			$id = $_POST['id'];
			$question = $_POST['question'];
			$reponse = strtolower($_POST['reponse']);
			$stmt = $db->prepare('SELECT nom, question, reponse FROM digiflashcards_series WHERE url = :url');
			if ($stmt->execute(array('url' => $id))) {
				$resultat = $stmt->fetchAll();
				if (!$resultat) {
					echo 'contenu_inexistant';
				} else if ($question === $resultat[0]['question'] && password_verify($reponse, $resultat[0]['reponse'])) {
					echo $resultat[0]['nom'];
				} else {
					echo 'non_autorise';
				}
			} else {
				echo 'erreur';
			}
			$db = null;
		} else if ($action === 'supprimer' && !empty($_POST['id']) && !empty($_POST['reponse'])) {
			require 'db.php';
			$id = $_POST['id'];
			$reponse = strtolower($_POST['reponse']);
			$stmt = $db->prepare('SELECT reponse FROM digiflashcards_series WHERE url = :url');
			if ($stmt->execute(array('url' => $id))) {
				$resultat = $stmt->fetchAll();
				if (!$resultat) {
					echo 'contenu_supprime';
				} else if (password_verify($reponse, $resultat[0]['reponse'])) {
					$stmt = $db->prepare('DELETE FROM digiflashcards_series WHERE url = :url');
					if ($stmt->execute(array('url' => $id))) {
						if (file_exists('../fichiers/' . $id)) {
							supprimer('../fichiers/' . $id);
						}
						echo 'contenu_supprime';
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
		} else {
			echo 'erreur';
		}
	} else {
		echo 'erreur';
	}
	curl_close($ch);
	exit();
} else {
	echo 'erreur';
	exit();
}

function supprimer ($path) {
	if (is_dir($path) === true) {
		$files = array_diff(scandir($path), array('.', '..'));
		foreach ($files as $file) {
			supprimer(realpath($path) . '/' . $file);
		}
		return rmdir($path);
	} else if (is_file($path) === true) {
		return unlink($path);
	}
	return false;
}

?>
