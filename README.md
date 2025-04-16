# Bataille Navale - Jeu de stratégie en ligne

Ce projet est une implémentation du jeu classique "Bataille Navale" développé pour le TP de Programmation Web du Master 1 GL de l'UIK Tiaret.

## Fonctionnalités

- Système d'authentification complet (inscription, connexion, récupération de mot de passe)
- Matchmaking automatique pour trouver des adversaires
- Système de classement (global, hebdomadaire, quotidien)
- Chat en jeu entre les adversaires
- Sauvegarde et reprise des parties
- Historique des parties
- Système de pénalités pour les abandons

## Technologies utilisées

### Backend
- Node.js avec Express.js
- MongoDB avec Mongoose
- Socket.IO pour la communication en temps réel
- JWT pour l'authentification

### Frontend
- React.js
- Redux avec Redux Toolkit
- React Router
- Socket.IO client
- Styled Components

## Installation

### Prérequis
- Node.js (v14+)
- MongoDB

### Configuration
1. Clonez le dépôt
2. Installez les dépendances serveur: `npm install`
3. Installez les dépendances client: `npm run install:client`
4. Configurez les variables d'environnement dans un fichier `.env` à la racine:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/bataille-navale
JWT_SECRET=votre_secret_jwt
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
NODE_ENV=development
```

### Exécution
- Lancer le serveur: `npm run dev`
- Lancer le client: `npm run client`
- Lancer les deux: `npm run dev:full`

## Structure du projet

```
bataille-navale/
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── features/      # Slices Redux et services
│   │   ├── pages/         # Pages principales
│   │   └── utils/         # Utilitaires
│   └── ...
├── controllers/           # Contrôleurs Express
├── middleware/            # Middleware (auth, validation, etc.)
├── models/                # Modèles Mongoose
├── routes/                # Routes API
├── socket/                # Gestion des événements Socket.IO
├── utils/                 # Utilitaires
└── server.js              # Point d'entrée du serveur
```

## API Endpoints

### Authentification
- POST /api/users/register - Inscription
- POST /api/users/login - Connexion
- GET /api/users/profile - Profil utilisateur
- POST /api/users/request-reset - Demande de réinitialisation de mot de passe
- POST /api/users/reset-password - Réinitialisation du mot de passe

### Jeu
- GET /api/games - Liste des parties actives
- POST /api/games - Créer une nouvelle partie
- POST /api/games/:gameId/join - Rejoindre une partie
- PUT /api/games/:gameId/ships - Placer les navires
- POST /api/games/:gameId/move - Faire un mouvement
- PUT /api/games/:gameId/save - Mettre en pause une partie
- PUT /api/games/:gameId/resume - Reprendre une partie

### Classement
- GET /api/leaderboard/global - Classement global
- GET /api/leaderboard/weekly - Classement hebdomadaire
- GET /api/leaderboard/daily - Classement quotidien
- GET /api/leaderboard/history - Historique des parties

### Messages
- GET /api/messages/predefined - Messages prédéfinis
- POST /api/messages/games/:gameId - Envoyer un message
- GET /api/messages/games/:gameId - Récupérer les messages d'une partie

## Auteurs
- Étudiants du Master 1 GL - UIK Tiaret
