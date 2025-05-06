# Guide d'accès à la base de données SQLite

Ce document explique comment accéder et manipuler la base de données SQLite utilisée dans le projet 42-transcendence.

## Structure de la base de données

La base de données contient actuellement une seule table :

### Table users
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Accès à la base de données SQLite dans le conteneur Docker

### 1. Accéder directement a la base de donnees

```bash
docker exec -it backend sh -c "sqlite3 ./data/db.sqlite"
```

## Commandes SQLite utiles

Une fois connecté à la base de données avec `sqlite3`, vous pouvez utiliser les commandes suivantes :

### Afficher les tables existantes

```sql
.tables
```

### Voir le schéma d'une table

```sql
.schema users
```

### Paramétrer l'affichage des résultats

```sql
.mode column  # Affiche les résultats en colonnes
.headers on   # Affiche les en-têtes des colonnes
```

### Exemples de requêtes SQL

#### Lister tous les utilisateurs

```sql
SELECT * FROM users;
```

#### Insérer un nouvel utilisateur

```sql
INSERT INTO users (username, email, password) 
VALUES ('testuser', 'test@example.com', 'password123');
```

#### Mettre à jour un utilisateur

```sql
UPDATE users 
SET status = 'online' 
WHERE username = 'testuser';
```

#### Supprimer un utilisateur

```sql
DELETE FROM users 
WHERE username = 'testuser';
```

### Quitter SQLite

```sql
.exit
```

## Accès via l'IDE (Cursor)

Pour visualiser la base de données directement dans Cursor :

1. Ouvrez le fichier db.sqlite
2. Utilisez l'extension SQLite Viewer intégrée
3. Naviguez entre les tables et exécutez des requêtes SQL

## Sauvegarde de la base de données

Pour sauvegarder la base de données depuis le conteneur :

```bash
docker exec -it backend sh -c "sqlite3 ./data/db.sqlite .dump > /app/backup.sql"
docker cp backend:/app/backup.sql ./backup.sql
```

Pour restaurer une base de données :

```bash
docker cp ./backup.sql backend:/app/backup.sql
docker exec -it backend sh -c "cat /app/backup.sql | sqlite3 ./data/db.sqlite"
``` 