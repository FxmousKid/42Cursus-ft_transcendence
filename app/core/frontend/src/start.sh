#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Démarrage de l'application frontend Transcendence...${NC}"

# Vérifier si nodejs est disponible
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js n'est pas installé. Veuillez l'installer pour continuer.${NC}"
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo -e "${BLUE}Installation des dépendances...${NC}"
  npm install
fi

# Créer le fichier CSS Tailwind de base s'il n'existe pas
TAILWIND_DIR="./app/styles"
TAILWIND_FILE="${TAILWIND_DIR}/input.css"

if [ ! -d "$TAILWIND_DIR" ]; then
  mkdir -p "$TAILWIND_DIR"
fi

if [ ! -f "$TAILWIND_FILE" ]; then
  echo -e "${YELLOW}Création du fichier CSS Tailwind de base...${NC}"
  
  cat > "$TAILWIND_FILE" << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

  echo -e "${GREEN}Fichier CSS Tailwind créé avec succès.${NC}"
fi

# Créer le fichier de configuration Tailwind s'il n'existe pas
TAILWIND_CONFIG="./tailwind.config.js"

if [ ! -f "$TAILWIND_CONFIG" ]; then
  echo -e "${YELLOW}Création du fichier de configuration Tailwind...${NC}"
  
  cat > "$TAILWIND_CONFIG" << EOF
module.exports = {
  content: [
    './index.html',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

  echo -e "${GREEN}Fichier de configuration Tailwind créé avec succès.${NC}"
fi

# Créer le fichier de configuration PostCSS s'il n'existe pas
POSTCSS_CONFIG="./postcss.config.js"

if [ ! -f "$POSTCSS_CONFIG" ]; then
  echo -e "${YELLOW}Création du fichier de configuration PostCSS...${NC}"
  
  cat > "$POSTCSS_CONFIG" << EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

  echo -e "${GREEN}Fichier de configuration PostCSS créé avec succès.${NC}"
fi

# Vérifier la structure des dossiers
echo -e "${BLUE}Vérification de la structure des dossiers...${NC}"

# Créer des dossiers manquants si nécessaire
mkdir -p app/services
mkdir -p app/utils
mkdir -p app/pages
mkdir -p app/styles
mkdir -p dist/css
mkdir -p dist/js

# Démarrer le serveur de développement
echo -e "${GREEN}Lancement du serveur de développement...${NC}"
echo -e "${BLUE}L'application sera disponible sur: ${GREEN}http://localhost:5174${NC}"
echo -e "${BLUE}L'API backend doit être en cours d'exécution sur: ${GREEN}http://localhost:3000${NC}"
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter le serveur${NC}"

npm run dev 