# Frontend du Projet Transcendence

Ce dossier contient l'implémentation frontend du projet Transcendence.

## Structure du dossier

```
frontend/
├── src/                      # Implémentation principale (TypeScript + TailwindCSS)
│   ├── index.html            # Document HTML principal
│   ├── package.json          # Dépendances et scripts
│   ├── tailwind.config.js    # Configuration TailwindCSS
│   ├── tsconfig.json         # Configuration TypeScript
│   └── src/                  # Code source
│       └── ...
│
├── temp_backup/              # Sauvegarde de l'ancien frontend React (à des fins de référence uniquement)
│   ├── src/                  # Code source React
│   ├── package.json          # Dépendances et scripts React
│   └── ...
│
└── README.md                 # Ce fichier
```

Cette structure est similaire à celle du backend, avec un dossier `src` pour l'implémentation actuelle et un dossier `temp_backup` pour conserver l'ancienne implémentation.

## Lancement du frontend

```bash
cd app/core/frontend/src
./start.sh
```

ou manuellement :

```bash
cd app/core/frontend/src
npm install
npm run start
```

Le site sera disponible à l'adresse: http://localhost:5174

## Développement

Le frontend utilise TypeScript et TailwindCSS vanille (sans framework comme React) pour une meilleure performance et une base de code plus légère.

### Principales fonctionnalités

- **Authentification** : Connexion, inscription et gestion de session
- **Jeu de Pong** : Mode local et multijoueur en temps réel
- **Profil utilisateur** : Statistiques, matches récents et achievements
- **Classement** : Tableau des meilleurs joueurs par ELO
- **Communication temps réel** : WebSocket pour le jeu et les notifications

## Project info

This is a Pong game project for 42 Transcendence.

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/127d26a2-c3b2-486d-aa91-90ee251f6bf7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
