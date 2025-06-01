# Frontend - ft_transcendence

Ce dossier contient le code frontend pour le projet ft_transcendence. Il s'agit d'une interface utilisateur simple construite avec HTML, Tailwind CSS et TypeScript.

## Structure du projet

```
frontend/
├── dist/               # Fichiers compilés (générés)
├── src/                # Code source
│   ├── css/            # Fichiers CSS
│   ├── ts/             # Fichiers TypeScript
│   └── *.html          # Pages HTML
├── public/             # Ressources statiques
├── docker/             # Configuration Docker
└── node_modules/       # Dépendances (générées)
```

## Pages

- `login.html` - Page de connexion
- `register.html` - Page d'inscription
- `index.html` - Page d'accueil

## Technologies utilisées

- HTML5
- Tailwind CSS - Pour le styling
- TypeScript - Pour la logique côté client
- Fastify Static - Pour servir les fichiers statiques

## Développement

1. Installer les dépendances:

```bash
npm install
```

2. Démarrer le serveur de développement:

```bash
npm run dev
```

3. Construire pour la production:

```bash
npm run build
```

4. Servir les fichiers compilés:

```bash
npm run serve
```

## Fonctionnalités

- Authentification utilisateur (connexion/inscription)
- Interface responsive pour tous les appareils
- Navigation simple et intuitive 