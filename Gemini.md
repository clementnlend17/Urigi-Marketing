# Urigi Marketing Pro - Documentation Projet (Pour l'IA)

Ce fichier est un "cerveau" ou un "point de sauvegarde" conçu pour être lu par n'importe quel modèle IA (comme Gemini) afin de comprendre instantanément l'architecture, le design, l'état actuel et les objectifs du projet **Urigi Marketing Pro**.

## 1. Description de l'Application
**Urigi Marketing Pro** est une application web SaaS de marketing et de messagerie de masse sur WhatsApp. Elle permet aux entreprises et aux marketeurs de lier leur compte WhatsApp professionnel, de gérer des listes de contacts, d'extraire des numéros depuis des groupes WhatsApp et de lancer des campagnes de messages (texte + image) ou des statuts WhatsApp de manière automatisée, avec des protections anti-blocage.

## 2. Technologies Utilisées
- **Frontend** : Next.js 14 (App Router), React, TypeScript.
- **Style** : Tailwind CSS, `tailwindcss-animate` (pour les animations fluides).
- **Icônes** : `lucide-react`.
- **Authentification & Base de données** : Supabase (PostgreSQL, Row Level Security - RLS).
- **Moteur WhatsApp (Backend)** : Node.js, Express, `@whiskeysockets/baileys` (tourne indépendamment sur `http://localhost:3001`).

## 3. Structure du Projet
- `/app` : Dossier principal Next.js.
  - `/(dashboard)` : Layout principal protégé par authentification. Contient les pages `/dashboard`, `/contacts`, `/campagnes`, `/parametres`.
  - `/login`, `/register` : Pages d'authentification publiques avec design split-screen.
- `/components` : Composants React réutilisables (ex: `GroupGrabberModal.tsx`, composants de navigation, etc.).
- `/lib` : Fichiers utilitaires, notamment `supabase.ts` pour l'initialisation du client Supabase.
- `server.js` : Le serveur backend indépendant qui gère la connexion WebSocket avec WhatsApp via la librairie Baileys. Il expose des endpoints API :
    *   `/api/send` : Formatage automatique des numéros (ex: ajout de `237` pour le Cameroun), vérification de l'existence du numéro via `onWhatsApp`, puis envoi.
    *   `/api/send-status` : Utilise `sock.sendMessage('status@broadcast', ...)` avec `statusJidList` dans les options pour publier un statut visible uniquement par la liste de contacts fournis.
- `setup_supabase.sql` : Fichiers contenant les requêtes SQL pour structurer la base de données.

## 4. Fonctionnalités Implémentées (À ce jour)
- **Authentification Premium** : Inscription, Connexion et Mot de passe oublié.
- **Dashboard Dynamique** : Statistiques en temps réel (contacts, campagnes).
- **Gestion des Contacts** : Import CSV, ajout manuel, suppression et **Group Grabber** (extraction de participants avec tags automatiques).
- **Gestion des Campagnes** :
  - **Double mode** : Message direct (individuel avec délai) ou **Statut WhatsApp** (publication ciblée via `statusJidList` dans Baileys).
  - Création avec texte et images (base64).
  - **Brouillons** : Sauvegarde et édition ultérieure.
  - **Système Anti-Blocage** : Gestion du délai entre envois.
- **Paramètres du compte** : Gestion de la connexion WhatsApp (QR/Pairing Code).
- **Paiements & Abonnements (SasPay)** :
  - Intégration de la passerelle **SasPay** (Mobile Money : Orange Money, MTN MoMo, Wave, Moov + Carte bancaire).
  - Sessions de checkout hébergées (`/api/saspay/checkout`).
  - Validation automatique instantanée des abonnements via webhook sécurisé HMAC-SHA256 (`/api/webhooks/saspay`).
  - Gestion des plans Pro (4 999 FCFA) et Elite (14 999 FCFA) avec mise à niveau dans Supabase (`subscriptions`).

## 5. Décisions de Design (Design Guidelines)
1. **Style "Premium SaaS"** : Moderne, épuré, minimaliste.
2. **Couleurs** : Vert Émeraude (`#10B981`) comme couleur principale.
3. **Bordures et Formes** : Coins arrondis, bordures subtiles, ombres légères.
4. **UX & Animations** : `tailwindcss-animate`, états de chargement (spinners).
5. **Ergonomie** : Espacement généreux et icônes explicites.

## 6. Instructions Strictes pour les futures IA (Next Steps)
- **Moteur WhatsApp** : Le frontend dépend de `server.js` (port 3001). Toute nouvelle fonctionnalité WhatsApp nécessite une mise à jour de `server.js` (logique Baileys) et de l'interface Next.js.
- **Numéros de téléphone** : Normalisation obligatoire des numéros (ex: `+237` pour le Cameroun).
- **Base de données** : 
  - Toujours respecter les politiques RLS. Les tables (`contacts`, `campaigns`) doivent filtrer par `user_id = auth.uid()`.
  - Structure table `campaigns` : `id, user_id, name, type (message/status), status, total_messages, sent_messages, message_content, target_group, delay_seconds, image_base64, created_at`.
- **Prochaines fonctionnalités prévues** : 
  1. Système de Parrainage rémunéré en pourcentage (avec paiements automatisés aux affiliés via SasPay Payouts).
  2. Planification différée des campagnes.
  3. Suivi analytique avancé des conversions.

*Document mis à jour le 10 Septembre 2026 suite au remplacement de Monetbil/Chariow par SasPay.*
