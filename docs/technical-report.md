# Rapport Technique - Bataille Navale

Ce document présente un rapport détaillé sur le développement du jeu Bataille Navale, expliquant les choix techniques, l'architecture, et les défis rencontrés.

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Technologies utilisées](#technologies-utilisées)
4. [Fonctionnalités clés](#fonctionnalités-clés)
5. [Défis et solutions](#défis-et-solutions)
6. [Opportunités d'amélioration](#opportunités-damélioration)

## Vue d'ensemble

Bataille Navale est un jeu multijoueur en ligne basé sur le jeu de société classique. Il permet aux utilisateurs de s'affronter en temps réel, avec des fonctionnalités complètes d'authentification, de matchmaking, de classement et de chat.

### Objectifs du projet

1. Créer une implémentation complète et fonctionnelle du jeu Bataille Navale
2. Mettre en œuvre une architecture client-serveur robuste
3. Développer une interface utilisateur réactive et intuitive
4. Intégrer des fonctionnalités sociales et compétitives

## Architecture

### Architecture système

L'application suit une architecture MERN stack (MongoDB, Express.js, React, Node.js) avec communication en temps réel via Socket.IO. Elle est structurée selon les principes du modèle MVC (Modèle-Vue-Contrôleur).

```
+----------------+     +----------------+     +----------------+
|                |     |                |     |                |
|  Client React  | <=> |  API Express   | <=> |  MongoDB      |
|                |     |                |     |                |
+----------------+     +----------------+     +----------------+
        ^                     ^
        |                     |
        v                     v
+----------------------------------------+
|                                        |
|            Socket.IO                   |
|                                        |
+----------------------------------------+
```

### Structure du projet

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

## Technologies utilisées

### Backend

- **Node.js & Express** : Serveur web et API RESTful
- **MongoDB & Mongoose** : Base de données et ODM (Object Document Mapper)
- **Socket.IO** : Communication en temps réel pour les mises à jour des parties
- **JSON Web Tokens (JWT)** : Authentification sécurisée
- **Bcrypt.js** : Hachage sécurisé des mots de passe
- **Nodemailer** : Envoi d'emails pour la récupération de mot de passe

### Frontend

- **React** : Bibliothèque UI pour construire l'interface utilisateur
- **Redux Toolkit** : Gestion d'état global
- **React Router** : Gestion des routes côté client
- **Socket.IO Client** : Communication en temps réel avec le serveur
- **Styled Components** : CSS-in-JS pour le styling
- **React Icons** : Bibliothèque d'icônes
- **Axios** : Requêtes HTTP
- **React Toastify** : Notifications utilisateur

### Outils de développement

- **Nodemon** : Redémarrage automatique du serveur pendant le développement
- **ESLint** : Linting du code
- **Concurrently** : Exécution simultanée des scripts npm

## Fonctionnalités clés

### 1. Système d'authentification

Nous avons implémenté un système d'authentification complet avec :
- Inscription et connexion
- Récupération de mot de passe par email
- Protection des routes avec JWT
- Déconnexion automatique lorsque le token expire

```javascript
// Exemple d'authentification middleware
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    // Vérification du token
    // ...
  }
  // ...
};
```

### 2. Logique de jeu

#### Modèle de données

Le modèle de données `Game` est au cœur du système. Il gère :
- État du jeu (attente, configuration, actif, pause, terminé, abandonné)
- Gestion des joueurs et de leur flotte
- Position des navires
- Historique des tirs
- Système de tours
- Références aux messages du chat
- Horodatages de début et de fin

#### Placement des navires

L'interface de placement des navires permet aux joueurs de :
- Positionner 5 types de navires différents sur la grille
- Changer l'orientation (horizontale/verticale)
- Vérifier les collisions et les limites du plateau

#### Mécanismes de tir

Les tirs sont gérés avec un système complet qui :
- Vérifie si c'est le tour du joueur
- Enregistre les résultats (touché, manqué, coulé)
- Met à jour les deux joueurs en temps réel via Socket.IO
- Détermine si le jeu est terminé

```javascript
// Exemple de méthode recordShot du modèle Game
gameSchema.methods.recordShot = function(userId, x, y) {
  // Logique pour déterminer si un tir touche un navire
  // ...
  
  // Retourne le résultat du tir
  return {
    hit: !!hitShip,
    shipType: hitShip ? hitShip.type : null,
    sunk: hitShip ? hitShip.sunk : false,
    gameOver: this.status === 'completed'
  };
};
```

#### Gestion du cycle de vie de la partie
- Création, attente de joueur, configuration, jeu actif, fin de partie (victoire/défaite), abandon.
- Possibilité pour un joueur de supprimer une partie de son historique/tableau de bord via une requête `DELETE`.

### 3. Communication en temps réel

Socket.IO est utilisé pour:
- Mettre à jour l'interface en temps réel lors des mouvements des adversaires
- Système de chat en jeu
- Notifications de matchmaking
- Gestion des déconnexions

### 4. Système de classement

Le système de classement inclut:
- Classement global (tous les temps)
- Classement hebdomadaire
- Classement quotidien
- Historique personnel des parties

### 5. Matchmaking

Un système de matchmaking qui:
- Met en file d'attente les joueurs cherchant une partie
- Apparier les joueurs selon leur niveau (ELO rating)
- Considère le temps d'attente pour éviter des attentes trop longues

## Défis et solutions

### 1. Gestion des états du jeu en temps réel

**Défi**: La synchronisation de l'état du jeu entre le serveur et plusieurs clients.

**Solution**: Nous avons implémenté une architecture où le serveur fait autorité sur l'état du jeu. Chaque action du joueur est d'abord validée par le serveur, puis le résultat est diffusé à tous les clients concernés.

### 2. Persistance des parties

**Défi**: Permettre aux joueurs de reprendre une partie interrompue.

**Solution**: Nous stockons l'état complet des parties dans la base de données MongoDB. Les joueurs peuvent mettre en pause une partie et la reprendre ultérieurement. En cas de déconnexion, l'état est préservé.

### 3. Équilibrage du matchmaking

**Défi**: Créer des parties équilibrées sans temps d'attente excessifs.

**Solution**: Notre algorithme de matchmaking utilise un système d'évaluation ELO et prend en compte à la fois le niveau des joueurs et leur temps d'attente, s'adaptant dynamiquement pour trouver le meilleur compromis.

### 4. Validation du placement des navires

**Défi**: S'assurer que les navires sont placés selon les règles du jeu.

**Solution**: Nous avons implémenté une validation côté client ET côté serveur pour vérifier que les navires ne se chevauchent pas et respectent les limites du plateau.

### 5. Protection contre la triche

**Défi**: Empêcher les joueurs de tricher en modifiant les données côté client.

**Solution**: Toute la logique critique du jeu est implémentée côté serveur. Les actions des joueurs sont validées avant d'être appliquées, et les vérifications d'autorisation sont effectuées à chaque requête.

## Opportunités d'amélioration

1. **Interface mobile** : Adapter l'interface pour une meilleure expérience sur appareils mobiles
2. **Intelligence artificielle** : Ajouter des adversaires IA pour le mode solo
3. **Mode spectateur** : Permettre aux utilisateurs de regarder des parties en cours
4. **Système d'amis** : Ajouter des fonctionnalités sociales
5. **Personnalisation** : Permettre aux joueurs de personnaliser l'apparence de leurs navires
6. **Tournois** : Implémenter un système de tournois automatiques
7. **Statistiques avancées** : Fournir des analyses détaillées des performances des joueurs
8. **Internationalisation** : Ajouter le support de plusieurs langues

## Conclusion

Le développement de Bataille Navale a été un projet complet qui a permis d'explorer et d'intégrer de nombreuses technologies modernes de développement web. La combinaison de React, Node.js, MongoDB et Socket.IO s'est avérée particulièrement efficace pour créer une expérience de jeu en temps réel fluide et interactive.

Les défis rencontrés ont été principalement liés à la gestion d'état distribuée et la synchronisation en temps réel, mais l'architecture choisie a permis de résoudre ces problèmes de manière élégante.

Ce projet constitue une base solide qui pourrait être étendue avec de nombreuses fonctionnalités additionnelles pour enrichir l'expérience utilisateur.
