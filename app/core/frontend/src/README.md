# Transcendence Frontend (TypeScript + TailwindCSS)

Ce dossier contient l'implémentation frontend principale du projet Transcendence, développée avec TypeScript et TailwindCSS vanille (sans framework comme React).

## Structure du projet

```
src/
├── index.html                  # Document HTML principal
├── package.json                # Dépendances et scripts
├── tailwind.config.js          # Configuration TailwindCSS
├── tsconfig.json               # Configuration TypeScript
├── start.sh                    # Script de démarrage rapide
├── css/                        # Fichiers CSS générés
├── js/                         # Fichiers JavaScript compilés
└── app/                        # Code source de l'application
    ├── main.ts                 # Point d'entrée de l'application
    ├── styles/
    │   └── input.css           # Fichier CSS source pour TailwindCSS
    ├── pages/                  # Composants de page
    │   ├── home.ts
    │   ├── game.ts
    │   ├── leaderboard.ts
    │   ├── login.ts
    │   ├── profile.ts
    │   └── not-found.ts
    ├── services/               # Services (API, WebSocket)
    │   ├── api.ts
    │   └── socket.ts
    ├── types/                  # Définitions de types TypeScript
    │   └── index.ts
    └── utils/                  # Utilitaires
        ├── auth.ts
        ├── router.ts
        └── toast.ts
```

## Installation

1. Assurez-vous que Node.js est installé sur votre système (version 14.x ou supérieure).
2. Dans le dossier `app/core/frontend/src`, exécutez :

```bash
npm install
```

## Démarrage rapide

Utilisez le script de démarrage inclus :

```bash
./start.sh
```

Ce script vérifie les dépendances, installe les packages nécessaires et démarre le serveur de développement.

## Scripts disponibles

- `npm run build` : Compile le CSS avec TailwindCSS et le TypeScript.
- `npm run build:css` : Compile uniquement le CSS.
- `npm run build:ts` : Compile uniquement le TypeScript.
- `npm run dev` : Lance la compilation en mode watch pour le CSS et TypeScript.
- `npm run serve` : Démarre un serveur de développement local.
- `npm run start` : Lance à la fois la compilation en mode watch et le serveur.

## Développement

Pour commencer le développement manuellement :

```bash
npm run start
```

Ouvrez votre navigateur à l'adresse `http://localhost:5174`.

## Fonctionnalités principales

- **Authentification** : Connexion, inscription et gestion de session
- **Jeu de Pong** : Mode local et multijoueur en temps réel
- **Profil utilisateur** : Statistiques, matches récents et achievements
- **Classement** : Tableau des meilleurs joueurs par ELO
- **Communication temps réel** : WebSocket pour le jeu et les notifications

## Personnalisation TailwindCSS

Vous pouvez personnaliser l'apparence en modifiant le fichier `tailwind.config.js` pour les couleurs, polices, et autres options, ainsi que `app/styles/input.css` pour les styles personnalisés.

## Déploiement

Pour préparer l'application pour le déploiement :

```bash
npm run build
```

Les fichiers générés seront dans les dossiers `css/` et `js/`. 