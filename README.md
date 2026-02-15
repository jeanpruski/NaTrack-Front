# NaTrack — Suivi Natation & Running
**Version : Alpha 0.0.12**

Application web responsive pour suivre ses séances de natation et de running, visualiser l’évolution des distances parcourues, et débloquer des cartes (défis, rares, événements).  
Version multi‑utilisateurs avec dashboard global public, dashboards individuels, mode édition sécurisé et cartes bots.

---

## 🌟 En bref

- Dashboard global public + dashboards individuels
- Cartes bots (défi, rare, événement) + notifications
- KPIs, graphiques, heatmap et comparatifs
- Import/Export CSV
- Mode clair/sombre persistant
- Page **Événements spéciaux** / **/events** (news DB)
- Pages & filtres pilotables par **query params**

---

## 🧭 Pages & navigation

### Routes (front)
- `/`  
  Dashboard global public.
- `/user/:slug`  
  Dashboard individuel (ex: `/user/jean`).
- `/cards`  
  Galerie de cartes (bots / users).
- `/events`  
  Listing **Toutes les news** (passées & futures).

> Note: `/events` remplace l’ancien `/news` (qui peut être bloqué chez certains hébergeurs).

### Query params
Ces params s’appliquent aux dashboards (global + user) :

- `mode=all|run|swim`
- `range=all|month|3m|6m|2026|2025|season:X`
- `card=open` (ouvre la carte dans `/user/:slug`)

Exemples:
```
/user/jean?mode=swim&range=3m
/user/jean?mode=all&range=season:2
/user/jean?card=open
```

Sur `/events`, **pas de `mode` / `range`** dans l’URL.

---

## ✨ Fonctionnalités

### Dashboard global (public)
- Classement des utilisateurs
- Comparatif global et podium (bots inclus/masqués)
- Section **Événements spéciaux** (2 news à venir les plus proches)
- Accès rapide aux cartes

### Dashboard individuel
- KPIs par période
- Graphiques (courbes, heatmap, comparatifs, etc.)
- Historique des séances
- Mode édition sécurisé
- Cartes débloquées (défi, rare, événement)

### Cartes & défis
- Bots: 3 types de cartes
  - **Défi**
  - **Rare** (même mécanique que défi, mais drop plus faible)
  - **Événement** (journalier)
- Notifications “défi / événement”
- Popups (notification, victoire, tutoriel)

### Page Événements spéciaux `/events`
Listing de **toutes les news** (passées + futures), triable:
- **Tous**
- **Futurs**
- **Passés**

Ordre:
- Tous / Futurs → **du plus proche au plus lointain**
- Passés → **du plus récent au plus ancien**

---

## 📰 News (Événements spéciaux)

Les news sont stockées en base (backend) et chargées via API.

### Champs DB
- `title` (titre)
- `subtitle` (sous‑titre)
- `city` (ville)
- `image_url` (image)
- `link_url` (lien, optionnel)
- `event_date` (date)
- `image_focus_y` (optionnel, 0–100)

**Focus image**  
Si `image_focus_y` est renseigné, la background image est positionnée à `50% {image_focus_y}%`.  
Si vide → centré (50% 50%).

### Comportement front
Sur le dashboard global:
- La **news la plus proche dans le temps** est affichée à gauche
- On affiche 2 news max
- Zoom léger sur hover **uniquement si lien**

Sur `/events`:
- Toutes les news, avec tri
- Zoom léger sur hover si lien

---

## 🔌 API (front)

Base API: `REACT_APP_API_BASE` (par défaut `/api`)

Endpoints utilisés:

**Public**
- `GET /sessions`
- `GET /dashboard/global`
- `GET /users/public`
- `GET /news`

**Auth**
- `POST /auth/login`
- `GET /auth/me`

**User**
- `GET /me/sessions`
- `POST /me/sessions`
- `PUT /me/sessions/:id`
- `DELETE /me/sessions/:id`
- `GET /me/challenge`
- `GET /me/card-results`

**Admin**
- `GET /users`
- `GET /users/:userId/sessions`
- `POST /users/:userId/sessions`
- `PUT /users/:userId/sessions/:id`
- `DELETE /users/:userId/sessions/:id`

---

## 🗄️ Backend (news DB)

SQL schema news :
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

Exemple d’insert:
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

Accès local:
```
http://localhost:3000
```

---

## ⚙️ Configuration

Exemple `.env`:
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

## 🔐 Sécurité & édition

- Édition verrouillée par défaut
- Login requis pour CRUD
- Admin peut modifier toutes les données

---

## ✅ Notes de déploiement

### SPA routing (Apache/Nginx)
Le front doit renvoyer `index.html` pour toutes les routes (`/user/...`, `/cards`, `/events`).

Exemple Apache `.htaccess`:
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

## 🧪 Tests utiles

Routes rapides:
- `/events`
- `/user/:slug?mode=run&range=month`

---

## 📌 Roadmap (idées)

- UI admin pour créer/éditer/supprimer les news
- Pagination sur `/events`
- Carrousel d’événements

---

## 📄 Licence

Usage privé / projet perso (à adapter si nécessaire).
