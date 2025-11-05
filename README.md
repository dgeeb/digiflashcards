# Digiflashcards

## NOTE
This project is a modified version of Digiflashcards by La Digitale
Original project: https://codeberg.org/ladigitale/digiflashcards
Digiflashcards est une application simple pour créer des flashcards. 

Elle est publiée sous licence GNU AGPLv3.
Sauf les fontes Roboto Slab et Material Icons (Apache License Version 2.0) et la fonte Mona Sans Expanded (Sil Open Font Licence 1.1)

### Préparation et installation des dépendances
```
npm install
```

### Lancement du serveur de développement
```
npm run dev
```

### Variable d'environnement (fichier .env.production à créer à la racine avant compilation)
Liste des domaines autorisés pour les requêtes POST et l'API, séparés par une virgule (* par défaut)
```
AUTHORIZED_DOMAINS=*
```

### Compilation et minification des fichiers
```
npm run build
```

### Serveur PHP nécessaire pour l'API
```
php -S 127.0.0.1:8000 (pour le développement uniquement)
```

### Production
Le dossier dist peut être déployé directement sur un serveur PHP avec l'extension SQLite activée.

### Démo
https://ladigitale.dev/digiflashcards/

### Remerciements et crédits
Traduction en italien par Paolo Mauri (https://gitlab.com/maupao) et @nilocram (Roberto Marcolin)

### Soutien
Open Collective : https://opencollective.com/ladigitale

Liberapay : https://liberapay.com/ladigitale/

