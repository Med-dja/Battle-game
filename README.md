# Bataille Navale - Jeu de stratégie en ligne

Bataille Navale est une application web multijoueur en temps réel qui implémente le jeu classique de bataille navale. Développé pour le TP de Programmation Web du Master 1 GL de l'UIK Tiaret.

<!-- ![Aperçu du jeu Bataille Navale](https://example.com/preview-image.jpg) -->

## 🌟 Fonctionnalités

- **Authentification complète** : inscription, connexion, récupération de mot de passe
- **Matchmaking intelligent** : trouve des adversaires de niveau similaire
- **Jeu en temps réel** : placement de navires, tir au tour par tour
- **Chat en jeu** : communiquez avec vos adversaires (messages directs et prédéfinis)
- **Classements** : global, hebdomadaire et quotidien
- **Profil joueur** : statistiques et historique de parties
- **Gestion des parties** : Possibilité de supprimer des parties depuis le tableau de bord
- **Responsive Design** : jouez sur ordinateur ou mobile (améliorations possibles)

## 🚀 Démarrage Rapide

### Prérequis

- Node.js (v16+ recommandé)
- MongoDB (localement ou via un service comme Atlas)
- npm ou yarn

### Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-username/bataille-navale.git
   cd bataille-navale
   ```

2. Installez les dépendances :
   ```bash
   # Installer les dépendances du serveur (à la racine)
   npm install
   
   # Installer les dépendances du client (dans le dossier client/bataille)
   cd client/bataille
   npm install
   
   ```



3. Configuration :
   Créez un fichier `.env` à la racine du projet avec le contenu suivant (adaptez les valeurs) :
   ```
   PORT=4000 # Port pour le serveur backend
   MONGO_URI=mongodb://localhost:27017/bataille-navale # Votre URI MongoDB
   JWT_SECRET=votre_secret_jwt_super_securise
   EMAIL_SERVICE=gmail # Ou autre service (e.g., SendGrid, Mailgun)
   EMAIL_USER=your-email@gmail.com # Email pour l'envoi
   EMAIL_PASS=your-email-password # Mot de passe ou clé d'application
   NODE_ENV=development
   ```
   *Assurez-vous que le service MongoDB est démarré.*

4. Lancez l'application :
   ```bash
   # Option 1: Serveur et client séparément (deux terminaux)
   # Terminal 1 (racine du projet)
   npm run dev      # Lance le serveur backend (généralement sur localhost:4000)
   
   # Terminal 2 
   cd client/bataille
   npm run dev   # Lance le client frontend Next.js (généralement sur localhost:3000)

   Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Documentation

Pour plus de détails, consultez les guides suivants :

- [Guide d'utilisation](./docs/user-guide.md) - Comment utiliser l'application
- [Rapport technique](./docs/technical-report.md) - Architecture et choix techniques
- [Guide de déploiement](./docs/deployment-guide.md) - Déployer l'application en production

## 🏗️ Technologies utilisées

### Backend
- **Node.js & Express** - Serveur web et API RESTful
- **MongoDB & Mongoose** - Base de données NoSQL et ODM
- **Socket.IO** - Communication temps réel (matchmaking, jeu, chat)
- **JWT (jsonwebtoken)** - Authentification basée sur les tokens
- **Bcrypt.js** - Hachage sécurisé des mots de passe
- **Nodemailer** - Envoi d'emails (récupération de mot de passe)

### Frontend
- **Next.js (React)** - Framework React pour le rendu côté serveur et client (App Router)
- **Tailwind CSS** - Framework CSS utilitaire
- **Context API (React)** - Gestion d'état global (pour l'authentification)
- **Socket.IO Client** - Communication temps réel avec le backend
- **Axios** - Client HTTP pour les requêtes API
- **react-hot-toast** - Notifications utilisateur

## 🛠️ Structure du projet

```
bataille-navale/
├── client/bataille/       # Frontend Next.js
│   ├── public/            # Fichiers statiques (images, sons)
│   ├── src/
│   │   ├── app/           # Structure App Router (pages, layout)
│   │   ├── components/    # Composants React réutilisables (UI, jeu, layout)
│   │   ├── context/       # Contexte React (ex: AuthContext)
│   │   ├── lib/           # Utilitaires (axios instance, socket client)
│   │   └── globals.css    # Styles globaux Tailwind
│   ├── next.config.mjs    # Configuration Next.js
│   └── tailwind.config.js # Configuration Tailwind CSS
│   └── ...
├── controllers/           # Logique métier (contrôleurs Express)
├── middleware/            # Middlewares Express (auth, validation)
├── models/                # Schémas de données Mongoose (User, Game, Message)
├── routes/                # Définition des routes API Express
├── socket/                # Gestionnaires d'événements Socket.IO côté serveur
├── utils/                 # Utilitaires côté serveur (ex: email)
├── .env                   # Variables d'environnement (non versionné)
├── server.js              # Point d'entrée du serveur backend Node.js
└── package.json           # Dépendances et scripts du serveur
```

## 📝 API Endpoints

### Authentification
- POST `/api/users/register` - Inscription
- POST `/api/users/login` - Connexion
- GET `/api/users/profile` - Profil utilisateur (protégé)
- POST `/api/users/request-reset` - Demande de réinitialisation de mot de passe
- POST `/api/users/reset-password` - Réinitialisation du mot de passe avec token

### Jeu
- GET `/api/games` - Liste des parties actives/en attente de l'utilisateur (protégé)
- POST `/api/games` - Créer une nouvelle partie (protégé)
- GET `/api/games/:gameId` - Obtenir les détails d'une partie (protégé)
- POST `/api/games/:gameId/join` - Rejoindre une partie (protégé)
- PUT `/api/games/:gameId/ships` - Placer les navires (protégé)
- POST `/api/games/:gameId/move` - Faire un mouvement (protégé)
- POST `/api/games/:gameId/quit` - Abandonner une partie (compte comme une défaite) (protégé)
- DELETE `/api/games/:gameId` - Supprimer une partie (depuis le tableau de bord) (protégé)
- PUT `/api/games/:gameId/save` - Mettre en pause une partie (Non implémenté/utilisé actuellement)
- PUT `/api/games/:gameId/resume` - Reprendre une partie (Non implémenté/utilisé actuellement)

### Classement
- GET `/api/leaderboard/global` - Classement global basé sur les points
- GET `/api/leaderboard/weekly` - Classement des victoires/points de la semaine
- GET `/api/leaderboard/daily` - Classement des victoires/points du jour
- GET `/api/leaderboard/history` - Historique des parties terminées de l'utilisateur (protégé)

### Messages
- GET `/api/messages/predefined` - Messages prédéfinis pour le chat
- POST `/api/messages/games/:gameId` - Envoyer un message dans une partie (protégé)
- GET `/api/messages/games/:gameId` - Récupérer les messages d'une partie (protégé)


## 📋 Tâches à venir

- [ ] Mode de jeu contre l'IA
- [ ] Système d'amis et invitations directes
- [ ] Personnalisation (avatars, thèmes de jeu)
- [ ] Mode spectateur
- [ ] Tournois automatisés
- [ ] Amélioration du support mobile et accessibilité
- [ ] Tests unitaires et d'intégration

## 👥 Contributeurs

- Med-dja (Github)

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).
