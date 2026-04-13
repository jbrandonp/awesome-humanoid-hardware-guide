# 🏥 Système de Santé Résilient V3.0 (Offline-First)

Bienvenue sur le monorepo **Système de Santé Résilient**, une plateforme EMR/EHR (Dossier Médical Électronique) pensée pour survivre aux pires environnements : ordinateurs obsolètes (Windows 7, 4 Go RAM), réseaux instables, et pannes électriques.

## 📊 État du projet (Avril 2026)

✅ **Opérationnel** - Tous les bugs critiques résolus, tests passants (112/112), API fonctionnelle, applications mobiles et desktop prêtes.

**Dernière analyse complète** : [ANALYSE_BUGS_COMPLETE.md](ANALYSE_BUGS_COMPLETE.md) (27+ bugs identifiés, 7 critiques, tous corrigés)

### ✅ Corrections principales récentes

1. **Cause racine résolue** : Incompatibilité de configuration TypeScript (moduleResolution) entre librairies et API
2. **Configuration Webpack** : Externalisation incorrecte des packages workspace corrigée
3. **Liaison npm** : Packages workspace (`@systeme-sante/*`) correctement liés via `npm link`
4. **Tests** : 112/112 tests passants après corrections des imports et caractères BOM
5. **Applications mobiles** : Scanner code-barres BCMA implémenté, intégration API complète
6. **Variables d'environnement** : Configuration unifiée, ajout des variables manquantes (HOST, etc.)
7. **Infrastructure** : Scripts d'initialisation corrigés, workspace Nx nettoyé

### ⚠️ Problèmes connus

- **Node.js v24 + next/font sur Windows** : Erreur ESM `ERR_UNSUPPORTED_ESM_URL_SCHEME` avec les polices Next.js
  - **Solution temporaire** : Polices désactivées dans `apps/portail-pwa`
  - **Solution recommandée** : Utiliser Node.js v20 ou configurer Next.js avec `experimental.esmExternals: false`
- **Authentification mobile** : Nurse ID mocké pour le développement (à intégrer avec contexte d'authentification)
- **Documentation Swagger** : Manquante (à implémenter)

### 🚀 Prochaines étapes

- Intégration complète de l'authentification mobile
- Documentation API Swagger/OpenAPI
- Tests de charge et validation hors-ligne
- Déploiement en environnement de production

## 🚀 Démarrage Rapide (Quick Start)

L'application est conçue pour être déployée localement sur le réseau LAN de la clinique (zéro dépendance au Cloud public).

### Prérequis

- **Node.js** v20.x (recommandé) ou v18+ (v24 peut causer des problèmes ESM avec next/font sur Windows)
- **Docker** et **Docker Compose**
- **Rust** (Pour la compilation du client Desktop Tauri)
- **Git** (pour cloner le dépôt)
- **npm** v9+ ou **yarn** v1.22+

### 1. Installation et Configuration

```bash
# 1. Cloner le projet et installer les dépendances
git clone <url-du-depot>
cd awesome-humanoid-hardware-guide
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env selon votre configuration (DATABASE_URL, etc.)

# 3. Démarrer l'infrastructure des bases de données (PostgreSQL, MongoDB, MinIO, Redis)
npm run docker:up

# 4. Déployer le schéma de la base de données relationnelle
npm run db:push

# 5. Lier les packages workspace (nécessaire après l'installation)
npm run link:workspace

# 6. Vérifier que tout fonctionne
npm run test:all
```

### 2. Démarrage de l'Environnement de Développement

```bash
# Option A : Démarrer toutes les applications (API, desktop, mobile, portail-pwa)
npm run start:all

# Option B : Démarrer des applications spécifiques avec Nx
npx nx run-many --target=serve --projects=api,desktop,mobile,portail-pwa

# Option C : Démarrer l'API seule
npx nx serve api

# Option D : Démarrer l'application mobile (Expo)
npx nx serve mobile

# Option E : Démarrer le portail patient (Next.js)
npx nx serve portail-pwa
```

### 3. Compilation du client natif de bureau (Tauri / Windows)

```bash
cd apps/desktop/src-tauri
cargo build --release
```

---

## 🔧 Dépannage (Troubleshooting)

### Problèmes courants et solutions

#### ❌ "Cannot find module '@systeme-sante/models'"
**Cause** : Les packages workspace ne sont pas correctement liés dans node_modules.
**Solution** :
```bash
npm run link:workspace
# Ou manuellement :
cd libs/models && npm link
cd ../../apps/api && npm link @systeme-sante/models
```

#### ❌ Erreurs de compilation TypeScript (moduleResolution)
**Cause** : Incompatibilité entre les configurations TypeScript.
**Solution** : Toutes les configurations ont été uniformisées en `commonjs`. Vérifiez que vous utilisez les dernières modifications.

#### ❌ Caractères BOM dans les fichiers SQL/scripts
**Cause** : Fichiers UTF-8 avec BOM générés par certains éditeurs.
**Solution** : Les fichiers concernés ont été nettoyés. Si le problème persiste, exécutez :
```bash
node scripts/fix-bom.js
```

#### ❌ Erreur ESM avec next/font sur Windows (Node.js v24)
**Cause** : Node.js v24 a des problèmes avec les URL ESM de next/font.
**Solution** :
1. Utiliser Node.js v20.x (recommandé)
2. Ou désactiver les polices dans `apps/portail-pwa/src/app/layout.tsx`
3. Ou configurer Next.js avec `experimental.esmExternals: false` dans `next.config.js`

#### ❌ Tests échouants
**Cause** : Imports incorrects ou dépendances non liées.
**Solution** :
```bash
npm run test:all  # Exécute tous les tests
# Ou pour un projet spécifique :
npx nx test api
npx nx test mobile
```

#### ❌ API ne démarre pas
**Cause** : Variables d'environnement manquantes ou base de données non accessible.
**Solution** :
1. Vérifiez que `.env` existe et contient `DATABASE_URL`, `MONGO_URL`, etc.
2. Démarrer les services Docker : `npm run docker:up`
3. Appliquer les migrations : `npm run db:push`

---

## 🏗️ Architecture du Projet

Le code est géré par **Nx**, et divisé en 4 espaces de travail :

- **`apps/api` (NestJS + Fastify)** : Le cerveau du système. Il embarque la gestion des rôles (RBAC), le moteur d'intelligence artificielle locale (via _Whisper.cpp_), et l'exportation _HL7/FHIR R4_.
- **`apps/desktop` (React + Tauri)** : Application de bureau native optimisée pour Windows 7. Elle incorpore le mode `FixedRuntime` de WebView2, un "Zéro-Menu" _ZenConsultationLayout_ et un moteur d'impression thermique direct en Rust via la crate `serialport`.
- **`apps/mobile` (React Native + Expo)** : Le terminal mobile pour les visites en brousse ou l'acquisition de signaux vitaux. Économe en batterie via le _PowerManagementService_.
- **`libs/models` (Zod + Types)** : Le contrat de données partagé.

## 🛡️ Sécurité & Conformité DPDPA / HIPAA

Ce projet s'engage à une politique de **Zéro Trust & Zéro Cloud Logs**.

1. **Consent Manager** : Avant la consultation ou l'exportation vers un spécialiste, le consentement du patient est validé (`DpdpaConsent`). En cas de révocation, les données sont immédiatement purgées localement (Tombstone).
2. **Audit Log Inaltérable** : Chaque action est stockée via l'`AuditInterceptor` dans PostgreSQL avec IP et estampille temporelle.
3. **Anonymisation (Zero-PHI)** : Le partage vers un réseau de confrères génère un clone de `ClinicalRecord` sans PII (remplacé par un UUID généré aléatoirement).

## 🧬 Innovation Clinique

- **Moteur d'Ordonnance Éclair (Omnibox)** : Prescrivez en 15 secondes via une recherche floue `fuse.js`, sans lever les mains du clavier (`useKeyboardShortcuts`).
- **Détection des Interactions** : Un système local avertit le médecin en temps réel des interactions dangereuses (ex: Artemether + antibiotiques incompatibles).
- **Synchronisation Infaillible (CRDT)** : Les notes médicales ne s'écrasent jamais. Elles sont fusionnées mathématiquement par `Yjs` (côté client et serveur).
- **Epi-Ticker & SSE** : Un bandeau visuel prévient les praticiens de tout pic d'épidémie local et de pénurie de médicaments en temps réel via un Server-Sent Event ultra léger.

  ---

## 📦 Scripts NPM disponibles

### Développement
```bash
npm run start:all           # Démarre toutes les applications
npm run dev                 # Démarre l'API en mode développement
npm run serve:api           # Démarrer l'API seule
npm run serve:mobile        # Démarrer l'application mobile (Expo)
npm run serve:portail-pwa   # Démarrer le portail patient (Next.js)
```

### Base de données & Migration
```bash
npm run db:push            # Applique les migrations Prisma
npm run db:studio          # Ouvre Prisma Studio
npm run docker:up          # Lance l'infrastructure Docker (PostgreSQL, MongoDB, Redis, MinIO)
npm run docker:down        # Arrête les conteneurs Docker
```

### Tests & Qualité
```bash
npm run test:all           # Exécute tous les tests (Jest + Vitest)
npm run test:api           # Tests de l'API
npm run test:mobile        # Tests de l'application mobile
npm run lint               # Vérification du code avec ESLint
npm run typecheck          # Vérification des types TypeScript
```

### Workspace & Dépendances
```bash
npm run link:workspace     # Lie les packages workspace (@systeme-sante/*)
npm run clean              # Nettoie les dossiers de build et cache
npm run build:all          # Build toutes les applications
```

### Déploiement
```bash
npm run build:api          # Build l'API pour la production
npm run build:mobile       # Build l'application mobile (Expo)
npm run build:portail-pwa  # Build le portail patient (Next.js)
```

---

## 🔧 Additional Setup

### Whisper.cpp Local Speech Recognition

The API includes local speech-to-text using Whisper.cpp. To enable this feature:

1. **Download or compile Whisper.cpp**:
   - Clone the repository: `git clone https://github.com/ggerganov/whisper.cpp.git`
   - Follow build instructions for your platform.
   - The binary `main` (or `main.exe` on Windows) should be placed in `bin/whisper.cpp/` at the project root.

2. **Download a model**:
   - Download a quantized model (e.g., `ggml-medium.en-q8_0.bin`) from [Hugging Face](https://huggingface.co/ggerganov/whisper.cpp/tree/main) and place it in `models/`.

3. **Set environment variables** (optional):
   - `WHISPER_BIN_PATH`: absolute path to the binary
   - `WHISPER_MODEL_PATH`: absolute path to the model file

If the binary is not found, the Whisper service will log a warning and skip transcription.

---

## 🚢 Deployment

See [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) for detailed production deployment instructions.

---

_Ce projet est sous licence MIT._
