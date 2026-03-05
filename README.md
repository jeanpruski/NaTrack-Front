# NaTrack — Suivi Natation & Running
**Version : Alpha 0.0.21**

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
- un **classement**
- des **stats globales**
- les **événements à venir**

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
