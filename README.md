# NaTrack — Suivi Natation & Running
**Version : Alpha 0.0.24**

NaTrack est une application web pour suivre ses séances de **natation** et de **running**, comparer les performances d’une équipe, et débloquer des cartes en relevant des défis.

---

## Ce que permet l’app (pour tous)

- Suivre ses distances et ses séances
- Comparer les performances entre membres
- Voir un classement global
- Débloquer des cartes (défi / rare / événement)
- Recevoir des notifications et des victoires
- Importer automatiquement le dernier run Strava

---

## Comment utiliser l’app (non‑tech)

### 1) Explorer le dashboard global
La page d’accueil affiche :
- un **classement (Podium)**
- des **stats globales**
- les **événements à venir**

Quand la période sélectionnée est la **saison en cours** (`range=season:<active>`), le dashboard affiche aussi le bloc **Radar Communauté**.

### 2) Ouvrir un profil
- Clique sur une personne pour voir son **dashboard individuel**
- Tu y retrouves : stats, graphes, historique, cartes débloquées

### 3) Gérer ses séances
- Ajouter, modifier, supprimer une séance
- Importer ou exporter un CSV
- Filtrer par type : running ou natation

### 4) Comprendre les cartes
- **Défi** : objectif à réaliser sur une durée limitée
- **Rare** : même principe, plus rare
- **Événement** : objectif sur un jour précis

Quand l’objectif est atteint :
- une **carte victoire** est créée
- une **popup** s’affiche une seule fois

---

## Pages principales (raccourcis)

- `/` : dashboard global
- `/user/:slug` : dashboard individuel
- `/cards` : galerie de cartes
- `/events` : événements spéciaux

---

## Infos techniques (résumé)

### Connexion
- Le site est public en lecture
- Pour modifier ses séances, il faut se connecter
- Les admins peuvent modifier les données de tous les utilisateurs

### Paramètres d’URL (optionnel)
- `mode=all|run|swim`
- `range=all|month|3m|6m|2026|2025|season:X`
- `card=open`

Exemples :
```
/user/jean?mode=swim&range=3m
/user/jean?mode=all&range=season:2
/user/jean?card=open
```

### Règles de durée des défis (actuelles)
- Un défi/rare lancé un jour J est valable **jusqu’à J + 2 jours inclus**.
- Exemple : départ mercredi 11 → valable mercredi 11, jeudi 12, vendredi 13 (fin vendredi 13 inclus).

### Radar Communauté (saison en cours uniquement)

Le radar suit le **mode actif** (`run`, `swim`, `all`) et affiche (dans cet ordre) :
1. **Meilleures séances récentes**
2. **Montée en charge**
3. **Mauvais élèves**
4. **Retours après pause** (si détectés)

Règles principales :
- **Meilleures séances récentes** : records de distance détectés sur les **7 derniers jours** (dans la période affichée).
- **Montée en charge** : volume des **7 jours glissants** supérieur à la fenêtre précédente de 7 jours.
- **Mauvais élèves** : pas d’activité depuis **au moins 1 mois** (ou jamais pratiqué le sport concerné).

Comportement d’affichage :
- Le nom du **user connecté** est souligné dans les listes du radar.
- Le radar n’est visible que sur la **saison en cours**. Sinon, le Podium prend toute la largeur.

---

## Événements spéciaux

La page `/events` affiche toutes les news :
- Futurs / Passés
- Tri du plus proche au plus lointain

---

## Intégration Strava (résumé)

- Import auto du **dernier run**
- Déduplication via `strava_activity_id`
- En mode dev Strava, le nombre d’athlètes peut être limité
