# ft_transcendence Frontend

## Choix techniques

Notre frontend est développé avec **React** et **TypeScript**, conformément aux exigences obligatoires du projet ft_transcendence qui stipulent:

> "The frontend should be developed using Typescript as base code."  
> "Your website must be a single-page application."

### Note sur les modules optionnels

Nous avons choisi de **ne pas implémenter** le module mineur frontend:
> "Minor module: Use a framework or toolkit to build the front-end.  
> Your frontend development must use the Tailwind CSS in addition of the Typescript, and nothing else."

Le sujet précise clairement:
> "You can create a front-end without using the constraints of this module by using the default front-end directives (as specified above in the mandatory part)."

Cette décision nous permet d'utiliser React avec TypeScript pour bénéficier de ses avantages en développement d'applications single-page, tout en respectant les exigences de base du projet.

## Technologies utilisées

- **TypeScript**: Langage de base pour le développement frontend (exigence obligatoire)
- **React**: Framework pour la création d'interfaces utilisateur interactives
- **React Router**: Bibliothèque pour la gestion de la navigation dans une single-page application
- **CSS standard**: Pour le styling de l'application (sans utiliser Tailwind CSS)
- **Vite**: Outil de build pour un développement rapide

## Approche du styling

Nous avons délibérément choisi de ne pas utiliser Tailwind CSS puisque nous n'implémentons pas le module mineur frontend. À la place, nous utilisons:

- Des classes CSS standards dans un fichier index.css global
- Une nomenclature de classes similaire pour faciliter le développement
- Des variables CSS pour maintenir la cohérence visuelle
- Des media queries pour la responsivité

Cette approche nous permet de:
1. Respecter strictement les exigences obligatoires du projet
2. Avoir un contrôle total sur nos styles sans dépendre d'une bibliothèque externe
3. Conserver une base de code plus légère

## Conformité avec les exigences du projet

Notre frontend respecte pleinement les exigences obligatoires du projet:
1. Il utilise TypeScript comme base de code
2. Il est conçu comme une single-page application avec React Router
3. Il n'utilise pas Tailwind CSS, conformément à notre décision de ne pas implémenter le module mineur frontend

## Structure du projet

Le frontend est organisé selon les meilleures pratiques React:
- `src/components/`: Composants réutilisables de l'interface
- `src/pages/`: Composants représentant des pages complètes
- `src/lib/`: Utilitaires et fonctions d'aide
- `src/assets/`: Ressources statiques (images, styles, etc.)

## Développement

1. Installer les dépendances:
```
npm install
```

2. Lancer le serveur de développement:
```
npm run dev
```

3. Construire pour la production:
```
npm run build
```

## Project info

**URL**: Your project URL will be available after deployment

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

You can work locally using your own IDE by cloning this repo and pushing changes.

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

## How can I deploy this project?

You can deploy this project to any hosting service that supports static websites, such as:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## Can I connect a custom domain to my project?

Yes, you can!

Most hosting services allow you to connect a custom domain to your project.
