# 🔐 Configuration HTTPS Multi-Stage pour ft_transcendence

Ce document explique la nouvelle architecture HTTPS sécurisée avec multi-stage Docker build.

## 🏗️ Architecture

### Multi-Stage Docker Build
Le nouveau `Dockerfile` combine nginx et Node.js dans un seul conteneur optimisé :

1. **Stage 1** : Build du frontend (Node.js + Webpack + Tailwind)
2. **Stage 2** : Build du backend (Node.js + TypeScript)
3. **Stage 3** : Production (Alpine + nginx + Node.js runtime)

### Fonctionnalités de Sécurité

✅ **HTTPS Obligatoire** - Toutes les connexions sont forcées en HTTPS  
✅ **WebSockets Sécurisés** - `wss://` au lieu de `ws://`  
✅ **Headers de Sécurité** - HSTS, CSP, X-Frame-Options, etc.  
✅ **Certificats SSL** - Auto-générés ou personnalisés  
✅ **Rate Limiting** - Protection contre les attaques DDoS  
✅ **Redirection HTTP→HTTPS** - Toutes les requêtes HTTP sont redirigées  

## 🚀 Utilisation

### Démarrage Rapide

```bash
# Depuis la racine du projet
make build
make up
```

L'application sera accessible sur : **https://localhost:443**

### Génération de Certificats Personnalisés

```bash
# Générer des certificats pour localhost
cd app/core
./scripts/generate-ssl-certs.sh

# Générer des certificats pour un domaine spécifique
./scripts/generate-ssl-certs.sh mon-domaine.com
```

### Docker Compose Manuel

```bash
# Build et démarrage du service core uniquement
cd app/core
docker-compose -f docker-compose.core.yml up --build

# Ou avec le compose principal (recommandé)
cd app
docker-compose -f docker-compose.main.yml up --build
```

## 🔧 Configuration

### Variables d'Environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `NODE_ENV` | Environnement Node.js | `production` |
| `PORT` | Port interne du backend | `3000` |
| `HOST` | Interface d'écoute backend | `127.0.0.1` |
| `SSL_CERT_PATH` | Chemin certificat SSL | `/etc/nginx/ssl/server.crt` |
| `SSL_KEY_PATH` | Chemin clé privée SSL | `/etc/nginx/ssl/server.key` |

### Ports Exposés

- **443** : HTTPS principal
- **80** : Redirection HTTP → HTTPS

### Volumes

- `nginx_certs` : Certificats SSL persistants
- `./logs/nginx` : Logs nginx
- `./logs/backend` : Logs backend

## 📁 Structure des Fichiers

```
app/core/
├── Dockerfile                 # Multi-stage build
├── docker-compose.core.yml    # Service core
├── nginx/
│   ├── nginx.conf            # Configuration nginx principale
│   └── default.conf          # Virtual host HTTPS
├── scripts/
│   └── generate-ssl-certs.sh # Génération certificats SSL
└── README-HTTPS.md           # Cette documentation
```

## 🌐 Endpoints

### Frontend (Statique)
- `GET /` - Application SPA
- `GET /static/*` - Assets statiques (JS, CSS, images)

### Backend API
- `GET /api/*` - Routes API REST
- `WSS /api/socket.io/` - WebSockets sécurisés
- `GET /api/auth/google/callback` - OAuth Google

### Monitoring
- `GET /healthcheck` - Vérification santé

## 🔒 Sécurité

### Headers de Sécurité Appliqués

```nginx
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; connect-src 'self' wss://localhost https://localhost
```

### Rate Limiting

- **API** : 10 req/s par IP (burst: 20)
- **Auth** : 2 req/s par IP (burst: 5)

### SSL/TLS

- **Protocoles** : TLS 1.2, TLS 1.3
- **Ciphers** : ECDHE-RSA-AES (priorité aux suites modernes)
- **Session** : Cache partagé 10m

## 🐛 Dépannage

### Problème : Certificat auto-signé non accepté

**Solution** : Accepter le certificat dans le navigateur ou installer un certificat valide

```bash
# Générer un nouveau certificat
./scripts/generate-ssl-certs.sh
```

### Problème : WebSockets ne se connectent pas

**Vérifications** :
1. Le frontend utilise bien `wss://` (non `ws://`)
2. Le CSP autorise `wss://localhost`
3. Le proxy nginx est configuré pour les websockets

### Problème : 502 Bad Gateway

**Causes possibles** :
1. Backend Node.js pas démarré
2. Port 3000 interne non accessible
3. Timeout de connexion

**Debug** :
```bash
# Vérifier les logs
docker logs transcendence-core

# Vérifier le backend
docker exec transcendence-core curl http://localhost:3000/healthcheck
```

## 🔄 Migration depuis l'ancienne architecture

### Changements Frontend

Le WebSocket utilise maintenant l'origine HTTPS :

```typescript
// Avant
const WS_URL = 'http://localhost:3000'

// Après  
const WS_URL = window.location.origin // https://localhost
```

### Changements Backend

Le backend écoute uniquement en interne :

```typescript
// Configuration
const HOST = '127.0.0.1' // Interne seulement
const PORT = 3000
```

### Variables Vault

Mettre à jour les URLs dans Vault :

```bash
vault kv put kv/frontend/url url='https://localhost'
vault kv put kv/backend/url url='https://localhost/api'
vault kv put kv/backend/cors_origin origin='https://localhost'
```

## 📊 Performance

### Optimisations Appliquées

- **Gzip** : Compression activée pour text/js/css
- **Cache statique** : 1 an pour assets
- **HTTP/2** : Multiplexage des connexions
- **Keep-alive** : Réutilisation des connexions backend

### Monitoring

Le healthcheck vérifie :
- Nginx actif
- Backend Node.js répondant
- Certificats SSL valides

```bash
# Test manuel
curl -k https://localhost:443/healthcheck
```

---

## ⚡ Commandes Utiles

```bash
# Build complet
make build

# Démarrage avec logs
make up

# Voir les logs en temps réel
make logs

# Arrêt propre
make down

# Nettoyage complet
make clean

# Test HTTPS
curl -k https://localhost:443/healthcheck

# Test WebSocket
websocat wss://localhost:443/api/socket.io/
``` 