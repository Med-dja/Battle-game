# Guide de Déploiement - Bataille Navale

Ce guide détaille les étapes pour déployer l'application Bataille Navale en production.

## Table des matières
1. [Préparation](#préparation)
2. [Déploiement sur un serveur traditionnel](#déploiement-sur-un-serveur-traditionnel)
3. [Déploiement sur Heroku](#déploiement-sur-heroku)
4. [Déploiement avec Docker](#déploiement-avec-docker)
5. [Déploiement sur d'autres plateformes cloud](#déploiement-sur-dautres-plateformes-cloud)
6. [Configuration post-déploiement](#configuration-post-déploiement)
7. [Surveillance et maintenance](#surveillance-et-maintenance)

## Préparation

### 1. Préparer l'application pour la production

1. **Modifier les variables d'environnement**:
   Créez un fichier `.env.production` avec les configurations appropriées pour l'environnement de production:

   ```
   NODE_ENV=production
   PORT=80
   MONGO_URI=your_production_mongodb_uri
   JWT_SECRET=your_secure_jwt_secret
   EMAIL_SERVICE=your_email_service
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

2. **Construire le frontend**:
   ```bash
   npm run build:client
   ```
   Cette commande crée une version optimisée du frontend dans `/Users/Meddja/Desktop/tpApp/client/dist/`.

3. **Préparer le package.json**:
   Assurez-vous que le script de démarrage est configuré dans `package.json`:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

## Déploiement sur un serveur traditionnel

### 1. Configurer le serveur

1. **Installer Node.js**:
   ```bash
   # Sur Ubuntu/Debian
   curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Vérifier l'installation
   node --version
   npm --version
   ```

2. **Installer MongoDB**:
   ```bash
   # Sur Ubuntu/Debian
   wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org

   # Démarrer MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

### 2. Déployer l'application

1. **Transférer les fichiers**:
   ```bash
   # Créer un répertoire pour l'application
   mkdir -p /var/www/bataille-navale
   
   # Copier les fichiers de l'application (à partir de votre machine locale)
   scp -r /Users/Meddja/Desktop/tpApp/* user@your-server:/var/www/bataille-navale/
   ```

2. **Installer les dépendances**:
   ```bash
   cd /var/www/bataille-navale
   npm install --production
   ```

3. **Configurer les variables d'environnement**:
   ```bash
   cp .env.production .env
   ```

4. **Configurer un gestionnaire de processus (PM2)**:
   ```bash
   # Installer PM2
   npm install -g pm2
   
   # Démarrer l'application avec PM2
   pm2 start server.js --name "bataille-navale"
   
   # Configurer le démarrage automatique
   pm2 startup
   pm2 save
   ```

### 3. Configurer un serveur web (Nginx)

1. **Installer Nginx**:
   ```bash
   sudo apt-get install -y nginx
   ```

2. **Créer une configuration pour l'application**:
   ```bash
   sudo nano /etc/nginx/sites-available/bataille-navale
   ```
   
   Ajouter la configuration suivante:
   ```
   server {
     listen 80;
     server_name yourdomain.com www.yourdomain.com;

     location / {
       proxy_pass http://localhost:5000;  # Le port sur lequel votre app Node.js s'exécute
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }

     # Configuration pour Socket.IO
     location /socket.io/ {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

3. **Activer la configuration**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/bataille-navale /etc/nginx/sites-enabled/
   sudo nginx -t  # Tester la configuration
   sudo systemctl restart nginx
   ```

4. **Configurer HTTPS avec Let's Encrypt**:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## Déploiement sur Heroku

### 1. Préparation

1. **Installer Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Se connecter à Heroku**:
   ```bash
   heroku login
   ```

3. **Créer une application Heroku**:
   ```bash
   heroku create bataille-navale-app
   ```

4. **Configurer MongoDB Atlas**:
   - Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Créez un cluster
   - Obtenez l'URI de connexion

### 2. Configurer l'application

1. **Ajouter un fichier Procfile à la racine**:
   ```
   web: node server.js
   ```

2. **Configurer les variables d'environnement**:
   ```bash
   heroku config:set MONGO_URI=your_mongodb_atlas_uri
   heroku config:set JWT_SECRET=your_secure_jwt_secret
   heroku config:set NODE_ENV=production
   heroku config:set EMAIL_SERVICE=your_email_service
   heroku config:set EMAIL_USER=your_email
   heroku config:set EMAIL_PASS=your_email_password
   ```

3. **Modifier le serveur pour utiliser le port attribué par Heroku**:
   Dans `server.js`, assurez-vous que votre application écoute sur le port fourni par Heroku:
   ```javascript
   const PORT = process.env.PORT || 5000;
   ```

### 3. Déployer l'application

1. **Ajouter un remote Git pour Heroku**:
   ```bash
   heroku git:remote -a bataille-navale-app
   ```

2. **Pousser le code sur Heroku**:
   ```bash
   git push heroku master
   ```

3. **Ouvrir l'application**:
   ```bash
   heroku open
   ```

4. **Vérifier les logs**:
   ```bash
   heroku logs --tail
   ```

## Déploiement avec Docker

### 1. Créer les fichiers Docker

1. **Créer un Dockerfile à la racine**:
   ```Dockerfile
   FROM node:16-alpine

   WORKDIR /app

   # Copier les fichiers de configuration
   COPY package*.json ./
   COPY .env.production .env

   # Installer les dépendances
   RUN npm install --production

   # Copier le code source
   COPY . .

   # Construire le client
   RUN npm run build:client

   # Exposer le port
   EXPOSE 5000

   # Commande de démarrage
   CMD ["node", "server.js"]
   ```

2. **Créer un fichier docker-compose.yml**:
   ```yaml
   version: '3'
   services:
     app:
       build: .
       ports:
         - "80:5000"
       environment:
         - NODE_ENV=production
         - MONGO_URI=mongodb://mongo:27017/bataille-navale
         - JWT_SECRET=your_secure_jwt_secret
         - EMAIL_SERVICE=your_email_service
         - EMAIL_USER=your_email
         - EMAIL_PASS=your_email_password
       depends_on:
         - mongo
       restart: always
     
     mongo:
       image: mongo
       volumes:
         - mongodb_data:/data/db
       restart: always

   volumes:
     mongodb_data:
   ```

### 2. Construire et exécuter les conteneurs

```bash
# Construire les images
docker-compose build

# Démarrer les conteneurs
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f
```

### 3. Déploiement sur un service Docker (optionnel)

Instructions pour déployer sur des services comme Docker Hub, AWS ECS, Google Cloud Run, etc.

## Déploiement sur d'autres plateformes cloud

### AWS Elastic Beanstalk

1. **Installer l'interface CLI EB**:
   ```bash
   pip install awsebcli
   ```

2. **Initialiser une application EB**:
   ```bash
   eb init
   ```
   Suivez les instructions pour configurer votre application.

3. **Déployer l'application**:
   ```bash
   eb create bataille-navale-env
   ```

4. **Configurer les variables d'environnement**:
   ```bash
   eb setenv MONGO_URI=your_mongodb_uri JWT_SECRET=your_secure_jwt_secret NODE_ENV=production
   ```

### Google Cloud Run

1. **Installer Google Cloud SDK**:
   Suivez les instructions sur [cloud.google.com/sdk](https://cloud.google.com/sdk)

2. **Se connecter à Google Cloud**:
   ```bash
   gcloud init
   ```

3. **Construire et déployer avec Cloud Build**:
   ```bash
   gcloud builds submit --tag gcr.io/your-project-id/bataille-navale
   
   gcloud run deploy bataille-navale \
     --image gcr.io/your-project-id/bataille-navale \
     --platform managed \
     --set-env-vars MONGO_URI=your_mongodb_uri,JWT_SECRET=your_secure_jwt_secret,NODE_ENV=production
   ```

## Configuration post-déploiement

### 1. Vérifications après déploiement

1. **Tester toutes les fonctionnalités principales**:
   - Inscription et connexion
   - Création et participation à des parties
   - Fonctionnalités en temps réel (chat, mouvements)

2. **Vérifier les performances**:
   - Temps de réponse de l'API
   - Charge du serveur

### 2. Mettre en place un monitoring

1. **Configurer New Relic ou Datadog** pour la surveillance des performances
2. **Configurer Sentry** pour le suivi des erreurs
3. **Configurer des alertes** pour les événements critiques

### 3. Sécurité

1. **Activer le pare-feu**:
   Ne permettre l'accès qu'aux ports nécessaires (80, 443, SSH)

2. **Configurer un WAF** (Web Application Firewall):
   Utiliser CloudFlare, AWS WAF ou similaire

3. **Mettre en place des sauvegardes régulières**:
   ```bash
   # Sur MongoDB
   mongodump --uri="your_mongodb_uri" --out=/backup/$(date +%Y-%m-%d)
   ```

## Surveillance et maintenance

### 1. Mises à jour régulières

1. **Mettre à jour les dépendances**:
   ```bash
   npm outdated  # Vérifier les mises à jour disponibles
   npm update    # Mettre à jour selon package.json
   ```

2. **Déployer les mises à jour**:
   Suivre la procédure de déploiement spécifique à votre plateforme

### 2. Surveillance des performances

1. **Vérifier les métriques clés**:
   - Temps de réponse des requêtes
   - Utilisation de la mémoire
   - Utilisation du CPU
   - Nombre de connexions simultanées

2. **Optimiser si nécessaire**:
   - Ajouter de la mise en cache
   - Mettre à l'échelle horizontalement ou verticalement

### 3. Sauvegarde et récupération

1. **Mettre en place des sauvegardes automatiques**:
   ```bash
   # Exemple de script de sauvegarde (à mettre dans un cron job)
   #!/bin/bash
   DATE=$(date +%Y-%m-%d)
   mongodump --uri="$MONGO_URI" --out=/backup/$DATE
   
   # Archiver les sauvegardes anciennes
   find /backup -type d -mtime +7 -exec tar -czf {}.tar.gz {} \; -exec rm -rf {} \;
   ```

2. **Tester régulièrement la restauration**:
   ```bash
   mongorestore --uri="$MONGO_URI" --drop /backup/latest/
   ```

## Conclusion

Le déploiement d'une application comme Bataille Navale en production nécessite une attention particulière à la configuration du serveur, à la sécurité et à la surveillance continue. Ce guide fournit les bases pour un déploiement réussi, mais n'hésitez pas à l'adapter en fonction des besoins spécifiques de votre environnement.

Pour toute question ou problème, consultez la documentation des outils spécifiques ou contactez l'équipe de développement.
