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
   npm run install:client
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

   **Important**: Assurez-vous que le PORT configuré ici correspond au port dans la configuration du proxy Vite (dans client/vite.config.js).

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
   npm run client
   ```

2. **Démarrer le serveur et le client simultanément**
   ```bash
   npm run dev:full
   ```

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

1. **Créer une nouvelle partie**
   - Après la connexion, accédez à "Mes Parties"
   - Cliquez sur "Nouvelle Partie"
   - Attendez qu'un adversaire rejoigne ou invitez un ami

2. **Rejoindre une partie existante**
   - Accédez à "Mes Parties"
   - Parcourez la liste des parties disponibles
   - Cliquez sur "Rejoindre" pour une partie en attente

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

## Dépannage

### Erreur "Page Not Found" (404)

Si vous obtenez une erreur 404 "Page Not Found" lorsque vous accédez à http://localhost:3000/, suivez ces étapes pour résoudre le problème :

1. **Vérifiez la configuration de Vite**
   Assurez-vous que votre fichier `client/vite.config.js` contient la configuration correcte pour le routage SPA :

   ```js
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     server: {
       port: 3000,
       proxy: {
         '/api': {
           target: 'http://localhost:4000',
           changeOrigin: true,
         },
         '/socket.io': {
           target: 'http://localhost:4000',
           changeOrigin: true,
           ws: true,
         }
       }
     },
     build: {
       outDir: 'dist',
     },
   })
   ```

2. **Créez un fichier pour la configuration du routage**
   
   Créez un fichier nommé `client/public/_redirects` avec le contenu suivant :
   ```
   /* /index.html 200
   ```
   
   Si vous utilisez déjà un fichier `vercel.json` dans votre projet, assurez-vous qu'il contient :
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

3. **Vérifiez que le serveur Express est configuré pour le SPA**
   
   Ajoutez ce code à votre fichier `server.js` juste avant la déclaration des routes API :
   
   ```javascript
   // Serve static assets in production
   if (process.env.NODE_ENV === 'production') {
     app.use(express.static('client/dist'));
     
     app.get('*', (req, res) => {
       res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'));
     });
   }
   ```

4. **Vérifiez le index.html**
   
   Assurez-vous que votre fichier `client/index.html` contient bien un div avec l'id "root" :
   ```html
   <div id="root"></div>
   ```

5. **Solution de contournement immédiate**
   
   Si vous avez besoin d'une solution rapide pour tester votre application, ajoutez ce script dans votre fichier HTML principal :
   
   ```html
   <script>
     // Redirection forcée vers la racine en cas d'erreur 404
     if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/api/')) {
       window.history.replaceState(null, document.title, '/');
       window.location.reload();
     }
   </script>
   ```

6. **Rechargez la page en mode développeur**

   Parfois, le serveur de développement Vite nécessite un redémarrage complet :
   ```bash
   # Arrêtez les serveurs avec Ctrl+C, puis redémarrez-les
   npm run dev
   npm run client
   ```

7. **Essayer une URL spécifique**
   
   Naviguez directement vers une page connue comme `http://localhost:3000/login` ou `http://localhost:3000/register` pour voir si ces routes fonctionnent.

8. **Problème de 404 Not Found avec Vite**
   
   Si vous obtenez toujours une page blanche avec une erreur 404, créez un fichier `client/public/index.html` contenant:
   
   ```html
   <!DOCTYPE html>
   <html lang="fr">
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <title>Bataille Navale</title>
     <script>
       // Fix for SPA routing - redirect all 404s to index.html
       (function() {
         if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/api/')) {
           window.history.replaceState(null, document.title, '/');
           window.location.reload();
         }
       })();
     </script>
   </head>
   <body>
     <div id="root"></div>
     <script type="module" src="/src/main.jsx"></script>
   </body>
   </html>
   ```
   
   Et modifiez votre fichier `client/vite.config.js` pour ajouter le support de l'historique HTML5:
   
   ```js
   // Dans client/vite.config.js
   server: {
     port: 3000,
     // Ceci est crucial pour que le routage SPA fonctionne correctement:
     historyApiFallback: true,
     proxy: {
       // ...existing proxy settings
     }
   }
   ```

### Problèmes courants:

1. **Impossible de se connecter à la base de données**
   - Vérifiez que MongoDB est bien installé et en cours d'exécution
   - Vérifiez l'URL de connexion dans le fichier `.env`

2. **Problèmes avec les emails**
   - Vérifiez vos paramètres d'email dans le fichier `.env`
   - Pour Gmail, vous devrez peut-être activer l'accès pour les applications moins sécurisées

3. **Erreurs côté client**
   - Vérifiez la console du navigateur (F12) pour identifier les erreurs
   - Essayez de vider le cache du navigateur

4. **Le socket ne se connecte pas**
   - Vérifiez que le serveur est bien en cours d'exécution
   - Assurez-vous que les ports ne sont pas bloqués par un pare-feu

5. **Erreur "@vitejs/plugin-react can't detect preamble"**
   - Cette erreur indique un problème avec la configuration de Vite ou avec votre code React
   - Solutions possibles:
     - Vérifiez que toutes les dépendances sont installées correctement: `cd client && npm install`
     - Assurez-vous que la version de `@vitejs/plugin-react` est compatible avec votre version de Vite
     - Recherchez des erreurs de syntaxe dans vos fichiers JSX, particulièrement dans `App.jsx`
     - Essayez de recréer le fichier `vite.config.js` avec les paramètres par défaut:
       ```js
       import { defineConfig } from 'vite'
       import react from '@vitejs/plugin-react'
       
       export default defineConfig({
         plugins: [react()],
         server: {
           port: 3000,
           proxy: {
             '/api': 'http://localhost:4000',
             '/socket.io': {
               target: 'http://localhost:4000',
               ws: true
             }
           }
         }
       })
       ```
     - Si le problème persiste, essayez de downgrader Vite: `npm install vite@4.4.5 --save-dev`
     - Dans certains cas, il peut être utile de vider le cache de Vite: `rm -rf node_modules/.vite`

Pour tout autre problème, consultez les logs du serveur ou contactez l'équipe de développement.
