# Plan d'Exécution — Système de Santé Résilient V3.0

**Basé sur** : `260426.md` — Audit exhaustif 6 passes, ~560+ bugs  
**Total actions** : **67** (59 du plan original + 8 suppléments issus de la relecture)  
**Ordre** : P0 → P1 → P2 → puis P3/P4/P5/P6/P7/P9 en parallèle → P8

---

## Dépendances entre phases

```
P0 (Environnement)
 └─ P1 (Build)
      ├─ P2 (Tests) ───────────── doit passer avant de continuer
      ├─ P3 (Docker)
      ├─ P4 (Sécurité) ─────────┐
      ├─ P5 (Intégrité données)─┤ parallélisables après P1
      ├─ P6 (Nettoyage) ────────┤
      ├─ P7 (Fonctionnel) ──────┤
      ├─ P9 (Suppléments) ──────┘
      └─ P8 (CI/CD) ─── dépend de P3
```

---

## Progression

| Phase | Actions | Complété | Statut |
|-------|---------|----------|--------|
| P0 — Environnement | 2 | 0/2 | ⬜ |
| P1 — Build | 13 | 0/13 | ⬜ |
| P2 — Tests | 4 | 0/4 | ⬜ |
| P3 — Docker | 5 | 0/5 | ⬜ |
| P4 — Sécurité | 6 | 0/6 | ⬜ |
| P5 — Intégrité données | 8 | 0/8 | ⬜ |
| P6 — Nettoyage | 6 | 0/6 | ⬜ |
| P7 — Fonctionnel | 10 | 0/10 | ⬜ |
| P8 — CI/CD + Qualité | 5 | 0/5 | ⬜ |
| P9 — Suppléments (vérification) | 8 | 0/8 | ⬜ |
| **TOTAL** | **67** | **0/67** | |

---

## Suppléments ajoutés après relecture (P9)

Actions manquantes du plan original, identifiées par re-analyse du fichier `260426.md` :

| # | Action | Bugs couverts |
|---|--------|---------------|
| 09.1 | Corriger tauri.conf.json (frontendDist, CSP, identifier, capabilities) | C13, C22, C23, H.3 |
| 09.2 | Supprimer Math.random() et OTP hardcodé de abdm.service.ts | A29, AB3 |
| 09.3 | dpdpa-consent : transaction PostgreSQL+MongoDB atomique | A7, INT10 |
| 09.4 | Corriger configs libs (jest, tsconfig) | C14, C15, C17 |
| 09.5 | Corriger bugs infrastructure critiques (healthcheck, secrets, clés) | INF2, INF5, INF6, INF7 |
| 09.6 | Nettoyer état Git (nbproject, 1455 unstaged files) | H.5, H.8 |
| 09.7 | Corriger conflits config frontend/mobile + webhook Meta | C27, C30, AB7 |
| 09.8 | fhir.service.ts : ne pas bloquer l'export si pas de vitals | LB14 |

---

## Commandes de vérification globales

```bash
# Après P1 : Build complet
npx nx run-many --target=typecheck --all
npx nx run-many --target=build --all

# Après P2 : Tests complets
npx nx run-many --target=test --all

# Après P3 : Docker
docker compose -f infra/docker/docker-compose.yml up --build
docker ps  # tous "healthy"

# Après P8 : Qualité finale
npm audit
npx eslint .
npx prettier --check .
```
