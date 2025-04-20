# Guide d'Utilisation - Bataille Navale

Ce guide vous explique comment installer, configurer et utiliser l'application Bataille Navale.

## Table des matières
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Lancement](#lancement)
4. [Utilisation](#utilisation)
5. [Dépannage](#dépannage)
   - [Erreur "Page Not Found" (404)](#erreur-page-not-found-404)
   - [Problèmes courants](#problèmes-courants)

## Installation

### Prérequis
Avant de commencer, assurez-vous d'avoir installé sur votre système:
- [Node.js](https://nodejs.org/) (v14.0.0 ou supérieur)
- [npm](https://www.npmjs.com/) (v6.0.0 ou supérieur)
- [MongoDB](https://www.mongodb.com/) (v4.0.0 ou supérieur)

### Étapes d'installation

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-repo>
   cd tpApp
   ```

2. **Installer les dépendances du serveur**
   ```bash
   npm install
   ```

3. **Installer les dépendances du client**
   ```bash
  cd client/bataille
  npm install
   ```

## Configuration

1. **Configuration du serveur**
   Créez un fichier `.env` à la racine du projet avec le contenu suivant:

   ```
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/bataille-navale
   JWT_SECRET=votre_secret_jwt_super_securise
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   NODE_ENV=development
   ```



2. **Configuration de la base de données**
   Assurez-vous que MongoDB est en cours d'exécution:
   ```bash
   # Sur Linux/Mac
   sudo service mongod start
   # ou
   mongod --dbpath /path/to/data/db
   
   # Sur Windows, MongoDB s'exécute généralement comme un service
   ```

## Lancement

Vous pouvez lancer l'application de différentes manières:

1. **Démarrer le serveur et le client séparément**
   ```bash
   # Terminal 1 - Serveur backend
   npm run dev
   
   # Terminal 2 - Client frontend
   cd client/bataille
   npm run dev
   ```

`

Une fois lancée, l'application sera disponible aux URLs suivantes:
- Interface utilisateur (client): [http://localhost:3000](http://localhost:3000)
- API du serveur: [http://localhost:4000](http://localhost:4000)

**Remarque importante**: Si vous voyez un écran blanc ou une erreur "Page not found" (404), consultez la section [Erreur "Page Not Found" (404)](#erreur-page-not-found-404) dans le dépannage ci-dessous.

## Utilisation

### Compte utilisateur

1. **Inscription**
   - Accédez à la page d'accueil 
   - Cliquez sur "S'inscrire"
   - Remplissez le formulaire avec votre nom d'utilisateur, email et mot de passe
   - Cliquez sur soumettre

2. **Connexion**
   - Accédez à la page d'accueil
   - Cliquez sur "Se connecter"
   - Entrez votre email et mot de passe
   - Cliquez sur soumettre

3. **Récupération de mot de passe**
   - Sur la page de connexion, cliquez sur "Mot de passe oublié?"
   - Entrez votre adresse email
   - Suivez les instructions reçues par email

### Jouer une partie

1. **Tableau de bord**
   - Après connexion, vous arrivez sur le tableau de bord.
   - Vous y voyez vos parties en cours ou en attente.
   - Vous pouvez rejoindre une partie en attente, continuer une partie active, ou en créer une nouvelle.
   - Vous pouvez également lancer une recherche d'adversaire via le matchmaking.
   - **Supprimer une partie** : Pour les parties listées, un bouton "Supprimer" (icône poubelle) permet de retirer une partie de votre tableau de bord. Une confirmation vous sera demandée.

2. **Rejoindre ou Créer**
   - Après la connexion, accédez à "Mes Parties"
   - Cliquez sur "Nouvelle Partie"
   - Attendez qu'un adversaire rejoigne ou invitez un ami

3. **Placement des navires**
   - Au début de la partie, placez vos navires sur votre grille
   - Sélectionnez un navire dans le menu
   - Choisissez l'orientation (horizontale ou verticale)
   - Cliquez sur la grille pour placer le navire
   - Répétez l'opération pour tous les navires
   - Cliquez sur "Confirmer le placement" quand vous avez terminé

4. **Phase de jeu**
   - Attendez votre tour si nécessaire
   - Cliquez sur une case de la grille adverse pour y tirer
   - Les résultats du tir sont affichés immédiatement:
     - Bleu: eau (manqué)
     - Rouge: touché
     - Rouge foncé: coulé
   - Le jeu continue jusqu'à ce qu'un joueur ait coulé tous les navires adverses

5. **Utiliser le chat en jeu**
   - Pendant la partie, utilisez le panneau de chat à droite
   - Tapez votre message et appuyez sur Entrée pour l'envoyer
   - Utilisez les messages prédéfinis pour une communication rapide

### Consulter les classements

- Accédez à la section "Classement" depuis le menu principal
- Naviguez entre les différents onglets:
  - Classement global
  - Classement hebdomadaire
  - Classement quotidien
  - Votre historique personnel (si connecté)

### Profil utilisateur

- Accédez à votre profil depuis le menu principal
- Consultez vos statistiques de jeu
- Visualisez votre historique de parties
- Modifiez vos paramètres de compte (si implémenté)



