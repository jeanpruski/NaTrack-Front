# NaTrack — Suivi Natation & Running
**Version : Alpha 0.0.13**

NaTrack est une application web de suivi sportif (natation + running) avec dashboards, historiques, cartes bots (défi/rare/événement), et intégration Strava (import automatique du dernier run).

Objectif : permettre à une team de suivre les distances, comparer les performances, et débloquer des cartes en réalisant des défis.

---

## 🌟 Ce que permet l’app

- Dashboard global public (classement, KPIs, graphes)
- Dashboards individuels (stats détaillées par user)
- Historique des séances, import/export CSV
- Cartes bots (défi, rare, événement) avec victoire
- Notifications et popup de victoire (one‑shot)
- Mode clair/sombre persistant
- Page **Événements spéciaux**
- Intégration Strava (import auto du dernier run)

---

## 🧭 Pages & navigation

### Routes principales (front)

- `/`
  Dashboard global public.
- `/user/:slug`
  Dashboard individuel (ex: `/user/jean`).
- `/cards`
  Galerie de cartes (bots / users).
- `/events`
  Listing **Toutes les news** (passées & futures).

> Note : `/events` remplace l’ancien `/news` (peut être bloqué chez certains hébergeurs).

### Query params utiles

Ces params s’appliquent aux dashboards (global + user) :

- `mode=all|run|swim`
- `range=all|month|3m|6m|2026|2025|season:X`
- `card=open` (ouvre la carte dans `/user/:slug`)

Exemples :
```
/user/jean?mode=swim&range=3m
/user/jean?mode=all&range=season:2
/user/jean?card=open
```

---

## 🔐 Connexion & édition

- Le site est public en lecture.
- Pour éditer des séances, il faut se connecter.
- Une fois connecté, on peut modifier ses propres données.
- Les admins peuvent modifier les données de tous les utilisateurs.

**Connexion (version alpha)**
- Si un utilisateur n’a pas de compte, il faut contacter l’équipe.

---

## 🧩 Fonctionnalités principales

### Dashboard global (public)

- Classement des utilisateurs
- Podium et comparatifs
- KPIs globaux (distance, séances, etc.)
- Section événements à venir (2 plus proches)
- Accès aux cartes

### Dashboard individuel

- KPIs par période
- Graphiques (courbes, heatmap, comparatifs)
- Historique des séances
- Cartes débloquées (défi, rare, événement)
- Mode édition sécurisé

### Historique des séances

- Ajout, édition, suppression
- Import/export CSV
- Filtre par type (run / swim)
- Affichage adaptatif mobile

---

## 🧠 Cartes, défis et événements

### Types de cartes

- **Défi** : objectif distance à réaliser sur une durée limitée
- **Rare** : même mécanique, drop plus faible
- **Événement** : carte journalière (ex: “1000m aujourd’hui”)

### Règles de durée (actuelles)

- Quand un défi / rare démarre un jour J, il est réalisable **jusqu’à J + 2 jours inclus**.
- Exemple : départ mercredi 11 (matin) → valable mercredi 11, jeudi 12, vendredi 13. Fin **vendredi 13 inclus**.

### Victoire

- Quand un objectif est atteint, une carte “victoire” est créée.
- Une **popup de victoire** s’affiche **une seule fois** pour la dernière victoire non vue.
- Une fois fermée, elle ne réapparaît plus.

---

## 🔔 Notifications

- Notifications pour les nouveaux défis et événements.
- La popup de victoire est indépendante des notifications.

---

## 🔌 Intégration Strava

### Objectif

- Importer automatiquement le **dernier run** Strava.
- Convertir distance en mètres (format NaTrack).
- Déclencher les règles de défis / cartes à l’import.

### Principe

- Connexion OAuth Strava par utilisateur.
- Webhook Strava pour détecter les activités.
- Déduplication avec `strava_activity_id`.

### Limitations (version alpha)

- Strava limite par défaut le nombre d’athlètes connectés.
- En mode “dev”, c’est souvent limité à **1** athlète.
- Après validation par Strava, la limite peut augmenter.

---

## 📰 Événements spéciaux (/events)

Liste de toutes les news (passées + futures) :

- Filtre **Tous / Futurs / Passés**
- Ordre :
  - Tous / Futurs → du plus proche au plus lointain
  - Passés → du plus récent au plus ancien

### Champs DB news

- `title` (titre)
- `subtitle` (sous‑titre)
- `city` (ville)
- `image_url` (image)
- `link_url` (lien, optionnel)
- `event_date` (date)
- `image_focus_y` (optionnel, 0–100)

**Focus image**
- Si `image_focus_y` est renseigné : background position = `50% {image_focus_y}%`.
- Si vide : `50% 50%`.

---

## 🔌 API (front)

Base API : `REACT_APP_API_BASE` (par défaut `/api`)

### Public

- `GET /sessions`
- `GET /dashboard/global`
- `GET /users/public`
- `GET /news`

### Auth

- `POST /auth/login`
- `GET /auth/me`

### User

- `GET /me/sessions`
- `POST /me/sessions`
- `PUT /me/sessions/:id`
- `DELETE /me/sessions/:id`
- `GET /me/challenge`
- `GET /me/card-results`
- `GET /me/victory/latest`
- `POST /me/victory/seen`

### Admin

- `GET /users`
- `GET /users/:userId/sessions`
- `POST /users/:userId/sessions`
- `PUT /users/:userId/sessions/:id`
- `DELETE /users/:userId/sessions/:id`

---

## 🗄️ Backend (news DB)

```sql
CREATE TABLE IF NOT EXISTS news_items (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  image_url VARCHAR(512) NOT NULL,
  image_focus_y TINYINT NULL,
  link_url VARCHAR(512) NULL,
  event_date DATE NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Exemple d’insert :
```sql
INSERT INTO news_items (id, title, subtitle, city, image_url, image_focus_y, link_url, event_date)
VALUES (
  UUID(),
  '10k Paris Adidas',
  'Course officielle',
  'Paris',
  'https://ton-domaine.com/images/adidas10k-2026.jpg',
  20,
  'https://www.adidas10kparis.fr/fr/participer/s-inscrire',
  '2026-06-07'
);
```

---

## 🛠️ Installation (front)

```bash
npm install
npm start
```

Accès local :
```
http://localhost:3000
```

---

## ⚙️ Configuration

Exemple `.env` (front) :
```
REACT_APP_API_BASE=/api
```

---

## 📁 Structure principale

```
src/
├── App.js
├── index.js
├── index.css
├── components/
├── sections/
│   ├── GlobalDashboard.jsx
│   ├── Dashboard.jsx
│   ├── NewsArchive.jsx
│   └── ...
└── utils/
```

---

## ✅ Notes de déploiement

### SPA routing (Apache/Nginx)
Le front doit renvoyer `index.html` pour toutes les routes (`/user/...`, `/cards`, `/events`).

Exemple Apache `.htaccess` :
```
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

Si `/news` est bloqué chez l’hébergeur, utilisez `/events`.

---

## ❓ FAQ / Problèmes fréquents

- **Je ne peux pas éditer.**  
  Vérifie que tu es connecté (popup). Sans login, l’édition est verrouillée.

- **Je suis connecté mais je ne vois pas mes options.**  
  Tu dois être sur ton **propre** dashboard pour modifier tes séances.

- **La popup de victoire revient.**  
  Elle s’affiche seulement pour la dernière victoire non vue.  
  Si elle revient, vérifie que `last_victory_seen_id` est bien sauvegardé côté user.

- **Je ne peux pas connecter plusieurs athlètes Strava.**  
  En mode dev, Strava limite souvent à **1 athlète**.  
  Il faut faire valider l’app pour augmenter la limite.

- **Strava ne redirige pas après autorisation.**  
  Vérifie que `redirect_uri` correspond **exactement** à celui configuré dans Strava,  
  et que le domaine est bien déclaré.

- **Strava callback 401 / invalid_state.**  
  Le paramètre `state` a expiré ou ne correspond pas au user.  
  Relance la connexion Strava depuis l’app et réessaie immédiatement.

- **Cron bots ne tourne pas / pas de nouveaux défis.**  
  Vérifie que le cron backend est bien planifié et que le process tourne.  
  Contrôle les logs et l’heure serveur (UTC vs local).

- **Événements annulés / mauvais jour affiché.**  
  Vérifie `bot_event_date` côté DB et les fuseaux horaires.  
  Assure‑toi que l’événement est bien créé en date locale attendue.

- **Je ne vois pas les événements sur /events.**  
  Vérifie que la table `news_items` contient des données et que l’API `/news` répond.

---

## 🧪 Tests utiles

Routes rapides :
- `/events`
- `/user/:slug?mode=run&range=month`
- `/user/:slug?card=open`

---

## 📌 Roadmap (idées)

- UI admin pour créer/éditer/supprimer les news
- Pagination sur `/events`
- Carrousel d’événements
- Historique d’imports Strava

---

## 📄 Licence

Usage privé / projet perso (à adapter si nécessaire).
