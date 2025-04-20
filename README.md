# Bataille Navale - Jeu de stratégie en ligne

Bataille Navale est une application web multijoueur en temps réel qui implémente le jeu classique de bataille navale. Développé pour le TP de Programmation Web du Master 1 GL de l'UIK Tiaret.

![Aperçu du jeu Bataille Navale](https://example.com/preview-image.jpg)

## 🌟 Fonctionnalités

- **Authentification complète** : inscription, connexion, récupération de mot de passe
- **Matchmaking intelligent** : trouve des adversaires de niveau similaire
- **Jeu en temps réel** : placement de navires, tir au tour par tour
- **Chat en jeu** : communiquez avec vos adversaires
- **Classements** : global, hebdomadaire et quotidien
- **Profil joueur** : statistiques et historique de parties
- **Responsive Design** : jouez sur ordinateur ou mobile

## 🚀 Démarrage Rapide

### Prérequis

- Node.js (v14+)
- MongoDB
- npm ou yarn

### Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-username/bataille-navale.git
   cd bataille-navale
   ```

2. Installez les dépendances :
   ```bash
   # Installer les dépendances du serveur
   npm install
   
   # Installer les dépendances du client
   npm run install:client
   ```

3. Configuration :
   Créez un fichier `.env` à la racine avec le contenu suivant :
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/bataille-navale
   JWT_SECRET=votre_secret_jwt_super_securise
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   NODE_ENV=development
   ```

4. Lancez l'application :
   ```bash
   # Développement (serveur et client séparément)
   npm run dev      # Serveur backend sur localhost:5000
   npm run client   # Client frontend sur localhost:3000
   
   # Développement (serveur et client simultanément)
   npm run dev:full
   
   # Production
   npm run build:client  # Build le client
   npm start             # Lance le serveur de production
   ```

## 📚 Documentation

Pour plus de détails, consultez les guides suivants :

- [Guide d'utilisation](./docs/user-guide.md) - Comment utiliser l'application
- [Rapport technique](./docs/technical-report.md) - Architecture et choix techniques
- [Guide de déploiement](./docs/deployment-guide.md) - Déployer l'application en production

## 🏗️ Technologies utilisées

### Backend
- **Node.js & Express** - Serveur web et API
- **MongoDB & Mongoose** - Base de données
- **Socket.IO** - Communication temps réel
- **JWT** - Authentification
- **Bcrypt** - Hachage des mots de passe

### Frontend
- **React** - Bibliothèque UI
- **Redux Toolkit** - Gestion d'état
- **Socket.IO Client** - Communication temps réel
- **React Router** - Navigation
- **Styled Components** - Styling

## 🛠️ Structure du projet

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

## 📝 API Endpoints

### Authentification
- POST `/api/users/register` - Inscription
- POST `/api/users/login` - Connexion
- GET `/api/users/profile` - Profil utilisateur
- POST `/api/users/request-reset` - Demande de réinitialisation de mot de passe
- POST `/api/users/reset-password` - Réinitialisation du mot de passe

### Jeu
- GET `/api/games` - Liste des parties actives/en attente de l'utilisateur
- POST `/api/games` - Créer une nouvelle partie
- GET `/api/games/:gameId` - Obtenir les détails d'une partie
- POST `/api/games/:gameId/join` - Rejoindre une partie
- PUT `/api/games/:gameId/ships` - Placer les navires
- POST `/api/games/:gameId/move` - Faire un mouvement
- POST `/api/games/:gameId/quit` - Abandonner une partie (compte comme une défaite)
- DELETE `/api/games/:gameId` - Supprimer une partie (depuis le tableau de bord)
- PUT `/api/games/:gameId/save` - Mettre en pause une partie (Non implémenté/utilisé actuellement)
- PUT `/api/games/:gameId/resume` - Reprendre une partie (Non implémenté/utilisé actuellement)

### Classement
- GET `/api/leaderboard/global` - Classement global
- GET `/api/leaderboard/weekly` - Classement hebdomadaire
- GET `/api/leaderboard/daily` - Classement quotidien
- GET `/api/leaderboard/history` - Historique des parties

### Messages
- GET `/api/messages/predefined` - Messages prédéfinis
- POST `/api/messages/games/:gameId` - Envoyer un message
- GET `/api/messages/games/:gameId` - Récupérer les messages d'une partie


## 📋 Tâches à venir

- [ ] Mode de jeu contre l'IA
- [ ] Système d'amis et invitations directes
- [ ] Personnalisation des navires
- [ ] Mode spectateur
- [ ] Tournois automatisés
- [ ] Support mobile amélioré

## 👥 Contributeurs

- Med-dja (Github)

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).
