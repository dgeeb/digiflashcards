<?php

if (!file_exists(dirname(__FILE__) . '/digiflashcards.db')) {
    $db = new PDO('sqlite:'. dirname(__FILE__) . '/digiflashcards.db');
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $table = "CREATE TABLE digiflashcards_series (
        id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
        url TEXT NOT NULL,
        nom	TEXT NOT NULL,
        question TEXT NOT NULL,
        reponse TEXT NOT NULL,
        donnees TEXT NOT NULL,
        date TEXT NOT NULL,
        vues INTEGER NOT NULL,
        derniere_visite TEXT NOT NULL
    )";
    $db->exec($table);
} else {
    $db = new PDO('sqlite:'. dirname(__FILE__) . '/digiflashcards.db');
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $db->prepare('PRAGMA table_info(digiflashcards_series)');
	if ($stmt->execute()) {
        $tables = $stmt->fetchAll();
        if (count($tables) < 9) {
            $colonne = "ALTER TABLE digiflashcards_series ADD vues INTEGER NOT NULL DEFAULT 0";
            $db->exec($colonne);
            $colonne = "ALTER TABLE digiflashcards_series ADD derniere_visite TEXT NOT NULL DEFAULT ''";
            $db->exec($colonne);
        }
    }
}

?>
