# Forum JS

Forum web complet en Node.js / vanilla HTML-CSS-JS / SQLite.

## Fonctionnalités

- Inscription / Connexion / Déconnexion (session cookie, mot de passe bcrypt)
- Posts avec titre, contenu, image (JPEG/PNG/GIF, max 20 Mo) et catégories
- Commentaires sur les posts
- Like / Dislike sur posts et commentaires
- Filtrage : toutes les catégories, mes posts, posts aimés
- Modification / suppression de ses propres posts et commentaires
- Visiteur non connecté : lecture seule
- Containerisation Docker

## Installation locale

```bash
npm install
node server/server.js
```

Ouvrir http://localhost:3000

## Lancement avec Docker

```bash
docker compose up --build
```

Ouvrir http://localhost:3000

## Stack technique

| Couche       | Techno                         |
|--------------|-------------------------------|
| Backend      | Node.js + Express              |
| Base données | SQLite (sqlite3)               |
| Auth         | Cookies HTTP-only + bcrypt     |
| Frontend     | HTML / CSS / JS vanilla        |
| Upload       | Multer                         |
| Container    | Docker + docker-compose        |
