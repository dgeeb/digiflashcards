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

if (!$_POST) {
	$_POST = json_decode(file_get_contents('php://input'), true);
}

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
			$vues = 0;
			$digidrive = 1;
			$stmt = $db->prepare('INSERT INTO digiflashcards_series (url, nom, question, reponse, donnees, date, vues, derniere_visite, digidrive) VALUES (:url, :nom, :question, :reponse, :donnees, :date, :vues, :derniere_visite, :digidrive)');
			if ($stmt->execute(array('url' => $id, 'nom' => $nom, 'question' => $question, 'reponse' => $reponse, 'donnees' => $donnees, 'date' => $date, 'vues' => $vues, 'derniere_visite' => $date, 'digidrive' => $digidrive))) {
				echo $id;
			} else {
				echo 'erreur';
			}
			$db = null;
		} else if ($action === 'modifier' && !empty($_POST['id']) && !empty($_POST['titre']) && !empty($_POST['question']) && !empty($_POST['reponse']) && !empty($_POST['anciennereponse'])) {
			require 'db.php';
			$id = $_POST['id'];
			$nom = $_POST['titre'];
			$question = $_POST['question'];
			$reponse = password_hash(strtolower($_POST['reponse']), PASSWORD_DEFAULT);
			$anciennereponse = strtolower($_POST['anciennereponse']);
			$stmt = $db->prepare('SELECT reponse FROM digiflashcards_series WHERE url = :url');
			if ($stmt->execute(array('url' => $id))) {
				$resultat = $stmt->fetchAll();
				if (!$resultat) {
					echo 'contenu_inexistant';
				} else if (password_verify($anciennereponse, $resultat[0]['reponse'])) {
					$stmt = $db->prepare('UPDATE digiflashcards_series SET nom = :nom, question = :question, reponse = :reponse WHERE url = :id');
					if ($stmt->execute(array('nom' => $nom, 'question' => $question, 'reponse' => $reponse, 'id' => $id))) {
						echo 'informations_modifiees';
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
					$digidrive = 1;
					$stmt = $db->prepare('UPDATE digiflashcards_series SET digidrive = :digidrive WHERE url = :url');
					$stmt->execute(array('digidrive' => $digidrive, 'url' => $id));
					echo $resultat[0]['nom'];
				} else {
					echo 'non_autorise';
				}
			} else {
				echo 'erreur';
			}
			$db = null;
		} else if ($action === 'dupliquer' && !empty($_POST['id']) && !empty($_POST['titre']) && !empty($_POST['reponse']) && !empty($_POST['nouvellequestion']) && !empty($_POST['nouvellereponse'])) {
			require 'db.php';
			$id = $_POST['id'];
			$reponse = strtolower($_POST['reponse']);
			$stmt = $db->prepare('SELECT reponse, donnees FROM digiflashcards_series WHERE url = :url');
			if ($stmt->execute(array('url' => $id))) {
				$resultat = $stmt->fetchAll();
				if (!$resultat) {
					echo 'contenu_inexistant';
				} else if (password_verify($reponse, $resultat[0]['reponse'])) {
					$nid = uniqid('', false);
					$nom = $_POST['titre'];
					$nquestion = $_POST['nouvellequestion'];
					$nreponse = password_hash(strtolower($_POST['nouvellereponse']), PASSWORD_DEFAULT);
					$donnees = $resultat[0]['donnees'];
					$date = date('Y-m-d H:i:s');
					$vues = 0;
					$digidrive = 1;
					$stmt = $db->prepare('INSERT INTO digiflashcards_series (url, nom, question, reponse, donnees, date, vues, derniere_visite, digidrive) VALUES (:url, :nom, :question, :reponse, :donnees, :date, :vues, :derniere_visite, :digidrive)');
					if ($stmt->execute(array('url' => $nid, 'nom' => $nom, 'question' => $nquestion, 'reponse' => $nreponse, 'donnees' => $donnees, 'date' => $date, 'vues' => $vues, 'derniere_visite' => $date, 'digidrive' => $digidrive))) {
						if (file_exists('../fichiers/' . $id)) {
							copier('../fichiers/' . $id, '../fichiers/' . $nid);
						}
						echo $nid;
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
		} else if ($action === 'exporter' && !empty($_POST['id']) && !empty($_POST['reponse'])) {
			require 'db.php';
			$id = $_POST['id'];
			$reponse = strtolower($_POST['reponse']);
			$stmt = $db->prepare('SELECT reponse, donnees FROM digiflashcards_series WHERE url = :url');
			if ($stmt->execute(array('url' => $id))) {
				$resultat = $stmt->fetchAll();
				if (password_verify($reponse, $resultat[0]['reponse'])) {
					echo $resultat[0]['donnees'];
				} else {
					echo 'non_autorise';
				}
			} else {
				echo 'erreur';
			}
			$db = null;
		} else if ($action === 'importer' && !empty($_FILES['archive']) && !empty($_POST['titre']) && !empty($_POST['question']) && !empty($_POST['reponse']) && !empty($_POST['donnees']) && !empty($_POST['fichiers'])) {
			require 'db.php';
			$id = uniqid('', false);
			mkdir('../fichiers/' . $id, 0775, true);
			$chemin = '../fichiers/' . $id . '/archive.zip';
			if (move_uploaded_file($_FILES['archive']['tmp_name'], $chemin)) {
				$zip = new ZipArchive;
				$archive = $zip->open($chemin);
				if ($archive === true) {
					$zip->extractTo('../fichiers/' . $id . '/archive');
					$zip->close();
					unlink($chemin);
					$fichiers = json_decode($_POST['fichiers']);
					foreach ($fichiers as $f) {
						$source = '../fichiers/' . $id . '/archive/fichiers/' . $f;
						$destination = '../fichiers/' . $id . '/' . $f;
						if (file_exists($source)) {
							copy($source, $destination);
							$extension = pathinfo($f, PATHINFO_EXTENSION);
							if (in_array($extension, array('jpg', 'jpeg', 'png', 'gif'))) {
								$cheminvignette = '../fichiers/' . $id . '/vignette_' . $f;
								creer_vignette($destination, $cheminvignette, 250);
							}
						}
					}
					supprimer('../fichiers/' . $id . '/archive');
					$nom = $_POST['titre'];
					$question = $_POST['question'];
					$reponse = password_hash(strtolower($_POST['reponse']), PASSWORD_DEFAULT);
					$donnees = json_encode($_POST['donnees']);
					$date = date('Y-m-d H:i:s');
					$vues = 0;
					$digidrive = 1;
					$stmt = $db->prepare('INSERT INTO digiflashcards_series (url, nom, question, reponse, donnees, date, vues, derniere_visite, digidrive) VALUES (:url, :nom, :question, :reponse, :donnees, :date, :vues, :derniere_visite, :digidrive)');
					if ($stmt->execute(array('url' => $id, 'nom' => $nom, 'question' => $question, 'reponse' => $reponse, 'donnees' => $donnees, 'date' => $date, 'vues' => $vues, 'derniere_visite' => $date, 'digidrive' => $digidrive))) {
						echo $id;
					} else {
						echo 'erreur';
					}
				} else {
					echo 'erreur';
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

function copier ($source, $destination) {  
	$dir = opendir($source);  
	@mkdir($destination);  
	while ($file = readdir($dir)) {  
		if (( $file != '.' ) && ( $file != '..' )) {  
			if ( is_dir($source . '/' . $file) ) {  
				copier($source . '/' . $file, $destination . '/' . $file);  
			} else {  
				copy($source . '/' . $file, $destination . '/' . $file);  
			}
		}
	}
	closedir($dir);
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

function creer_vignette ($src, $dest, $h) {
    $fparts = pathinfo($src);
    $ext = strtolower($fparts['extension']);
    if ($ext == 'gif') {
        $resource = imagecreatefromgif($src);
	} else if ($ext === 'png') {
        $resource = imagecreatefrompng($src);
	} else if ($ext === 'jpg' || $ext === 'jpeg') {
        $resource = imagecreatefromjpeg($src);
	}
	if ($resource !== false) {
		$width  = imagesx($resource);
		$height = imagesy($resource);
		$w  = floor($width * ($h / $height));
		$img = imagecreatetruecolor($w, $h);
		if ($ext === 'png') {
			imagealphablending($img, false);
			imagesavealpha($img, true);
		}
		imagecopyresampled($img, $resource, 0, 0, 0, 0, $w, $h, $width, $height);
		$fparts = pathinfo($dest);
		$ext = strtolower($fparts['extension']);
		if (!in_array($ext, array('jpg', 'jpeg', 'png', 'gif'))) {
			$ext = 'jpg';
		}
		$dest = $fparts['dirname'] . '/' . $fparts['filename'] . '.' . $ext;
		if ($ext == 'gif') {
			imagegif($img, $dest);
		} else if ($ext === 'png') {
			imagepng($img, $dest, 1);
		} else if ($ext === 'jpg' || $ext === 'jpeg') {
			imagejpeg($img, $dest, 85);
		}
	}
}

?>
