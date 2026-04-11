# 🏥 Système de Santé Résilient V3.0 (Offline-First)

Bienvenue sur le monorepo **Système de Santé Résilient**, une plateforme EMR/EHR (Dossier Médical Électronique) pensée pour survivre aux pires environnements : ordinateurs obsolètes (Windows 7, 4 Go RAM), réseaux instables, et pannes électriques.

## 🚀 Démarrage Rapide (Quick Start)

L'application est conçue pour être déployée localement sur le réseau LAN de la clinique (zéro dépendance au Cloud public).

### Prérequis

- `Node.js` v18+
- `Docker` et `Docker Compose`
- `Rust` (Pour la compilation du client Desktop Tauri)

### 1. Installation

```bash
# 1. Cloner le projet
npm install

# 2. Démarrer l'infrastructure des bases de données (PostgreSQL, MongoDB, MinIO)
npm run docker:up

# 3. Déployer le schéma de la base de données relationnelle
npm run db:push
```

### 2. Démarrage de l'Environnement de Développement

```bash
# Démarre l'API, le backend, le client Web et l'expo bundler simultanément
npm run start:all
```

Pour compiler le client natif de bureau (Tauri / Windows) :

```bash
cd apps/desktop/src-tauri
cargo build --release
```

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
