# 🤝 Système de Demande d'Amis en Temps Réel

## Vue d'ensemble
Système de gestion des amitiés avec notifications en temps réel utilisant WebSocket (Socket.IO).

## Fonctionnalités
- Envoi de demandes d'amis
- Acceptation/refus des demandes
- Notifications en temps réel
- Mise à jour instantanée des listes d'amis

## Architecture

### Flux de données
```
A (frontend) --[REST]--> Backend --[WebSocket]--> B (frontend)
B (frontend) --[REST]--> Backend --[WebSocket]--> A (frontend)
```

### Composants principaux

#### Backend (NestJS)
- **WebSocket Gateway** : Gère les connexions et notifications en temps réel
  - [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts)
  - [websocket.module.ts](backend/src/websocket/websocket.module.ts)

- **Service d'amitié** : Gère la logique métier des amitiés
  - [friendships.service.ts](backend/src/friendships/friendships.service.ts)
  - [friendships.module.ts](backend/src/friendships/friendships.module.ts)

#### Frontend (React)
- **Service WebSocket** : Gère la connexion et les événements WebSocket
  - [websocket.service.ts](frontend/src/services/websocket.service.ts)

- **Interface utilisateur** : Gère l'affichage et les interactions
  - [ProfilePage.tsx](frontend/src/pages/ProfilePage.tsx)

## Points d'entrée clés

### 1. Envoi d'une demande d'ami
- **Frontend** : [handleSendFriendRequest](frontend/src/pages/ProfilePage.tsx#L78-L114)
- **Backend** : [sendFriendRequest](backend/src/friendships/friendships.service.ts#L14-L54)
- **Notification** : [notifyFriendRequest](backend/src/websocket/websocket.gateway.ts#L38-L49)

### 2. Acceptation d'une demande
- **Frontend** : [handleAcceptRequest](frontend/src/pages/ProfilePage.tsx#L133-L151)
- **Backend** : [acceptFriendRequest](backend/src/friendships/friendships.service.ts#L55-L85)
- **Notification** : [notifyFriendRequestAccepted](backend/src/websocket/websocket.gateway.ts#L51-L62)

## Sécurité
- Authentification JWT pour les connexions WebSocket
- CORS configuré pour les origines autorisées
- Validation des données côté serveur
