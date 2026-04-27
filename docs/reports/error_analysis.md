# Analyse des erreurs - 10 avril 2026

## Introduction
Ce document liste les erreurs potentielles détectées lors de l'analyse du travail effectué depuis le début de la conversation. L'objectif est d'identifier les problèmes introduits pendant les corrections de linting TypeScript.

## Erreurs de TypeScript (Compilation)

### 1. **SyncController - Incompatibilité de type critique**
**Fichier** : `apps/api/src/app/sync/sync.controller.ts`
**Ligne 36** : `await this.syncService.pushChanges(changes);`
**Problème** : La variable `changes` est de type `unknown`, mais la méthode `pushChanges` attend un paramètre de type `SyncPushPayload` (interface définie dans `sync.service.ts`).
**Impact** : Erreur de compilation TypeScript - `unknown` n'est pas assignable à `SyncPushPayload`.
**Solution** :
```typescript
// Option 1 : Validation avec Zod
import { SyncPushPayloadSchema } from './sync.schema'; // À créer
const validatedChanges = SyncPushPayloadSchema.parse(changes);

// Option 2 : Assertion de type (moins sûr)
await this.syncService.pushChanges(changes as SyncPushPayload);
```

### 2. **TickerController - Import manquant**
**Fichier** : `apps/api/src/app/ticker/ticker.controller.ts`
**Ligne 9** : `type AuthenticatedFastifyRequest = FastifyRequest & { user?: { userId: string } };`
**Problème** : `FastifyRequest` n'est pas importé.
**Impact** : Erreur de compilation TypeScript - `FastifyRequest` n'est pas défini.
**Solution** :
```typescript
import type { FastifyRequest } from 'fastify';
```

### 3. **ZodValidationPipe - Import manquant**
**Fichier** : `apps/api/src/app/drug-interaction/dto/drug-interaction.dto.ts`
**Ligne 25** : `if (error instanceof ZodError) {`
**Problème** : `ZodError` n'est pas importé.
**Impact** : Erreur de compilation TypeScript - `ZodError` n'est pas défini.
**Solution** :
```typescript
import { z, ZodError } from 'zod';
```

### 4. **ActionType - Type potentiellement incorrect**
**Fichier** : `apps/api/src/app/ticker/ticker.controller.ts`
**Ligne 56** : `actionType: 'EXPORT_REPORT' as string,`
**Problème** : `actionType` attend probablement un type spécifique (enum `AuditActionType` ou similaire). Utiliser `as string` contourne la vérification TypeScript.
**Impact** : Risque d'erreur à l'exécution si le type attendu est plus restrictif.
**Solution** : Vérifier le type attendu par `AuditService.logAudit()` et utiliser le type approprié.

### 5. **FastifyRequest.ip - Propriété potentiellement absente**
**Fichier** : `apps/api/src/app/consent-manager/consent-manager.controller.ts`
**Ligne 22** : `const ipAddress = req.ip || 'unknown';`
**Problème** : La propriété `.ip` peut ne pas exister sur le type `FastifyRequest` standard. Cela dépend de la configuration Fastify.
**Impact** : Erreur de compilation si `ip` n'est pas dans les types.
**Solution** : Vérifier la définition de type de `FastifyRequest` dans le projet ou utiliser `req.socket.remoteAddress`.

## Erreurs de Logique Potentielle

### 1. **Validation manquante pour les données externes**
**Contexte** : Plusieurs endpoints reçoivent désormais des données de type `unknown` sans validation.
- `createPatient(fhirPayload: unknown)` - FHIR payload devrait être validé avec `FhirPatientSchema`
- `createObservation(fhirPayload: unknown)` - Idem
- `revokeConsent(body: unknown)` - Déjà validé avec Zod ✓
- `createDualSignOff(payload: unknown)` - Déjà validé avec Zod ✓

**Risque** : Données malformées peuvent passer jusqu'au service.
**Recommandation** : Toujours valider les données de type `unknown` avec les schémas Zod existants.

### 2. **Types de retour trop génériques**
**Fichier** : `apps/api/src/app/procurement/procurement.controller.ts`
```typescript
async getDrafts(): Promise<unknown> { ... }
async approveDraft(...): Promise<unknown> { ... }
```
**Problème** : `Promise<unknown>` masque la structure réelle des données retournées.
**Impact** : Perte d'autocomplétion et de vérification TypeScript pour les consommateurs de ces méthodes.
**Solution** : Importer et utiliser les types Prisma appropriés.

## Erreurs de Processus

### 1. **Absence de vérification de compilation**
**Problème** : Aucune commande `npx nx build api` n'a été exécutée après les modifications pour vérifier que le code compile sans erreurs.
**Impact** : Des erreurs de compilation pourraient passer inaperçues jusqu'au déploiement.
**Recommandation** : Toujours exécuter la compilation après des modifications de types.

### 2. **Corrections partielles**
**Problème** : Certains fichiers de test (`.spec.ts`) contiennent encore des types `any`. Bien que moins critiques, ils font partie du codebase.
**Recommandation** : Planifier une seconde passe pour les fichiers de test.

## Fichiers avec problèmes potentiels à revérifier

1. **`fhir.mapper.ts`** :
   - Ligne modifiée : `const base: Partial<FhirObservation> & { [key: string]: unknown } = { ... }`
   - Vérifier que l'accès aux propriétés dynamiques (`base[key]`) fonctionne toujours.

2. **`soft-delete.filter.ts`** :
   - Les assertions de type `(data as Record<string, unknown>)[key]` pourraient cacher des problèmes si `data` n'est pas un objet simple.
   - La méthode `removeSoftDeleted` est récursive - tester avec des structures complexes.

3. **`inventory-predictor.service.ts`** :
   - L'assertion `const invItem = item as { id: string; name: string; quantity: number }` suppose une structure spécifique.
   - Vérifier que `item` a toujours ces propriétés.

## Résumé des priorités

### **Haute Priorité** (Bloquant la compilation) :
1. Import manquant de `FastifyRequest` dans `ticker.controller.ts`
2. Import manquant de `ZodError` dans `drug-interaction.dto.ts`
3. Incompatibilité de type dans `sync.controller.ts`

### **Moyenne Priorité** (Risques fonctionnels) :
1. Validation des `unknown` dans les endpoints FHIR
2. Vérification de `req.ip` dans `consent-manager.controller.ts`
3. Typage précis des retours dans `procurement.controller.ts`

### **Basse Priorité** (Améliorations) :
1. Nettoyage des `any` restants dans les fichiers de test
2. Remplacement des `@ts-ignore` par `@ts-expect-error`
3. Exécution complète du linter sur tout le projet

## Actions recommandées

1. **Exécuter la compilation** :
   ```bash
   npx nx build api
   ```

2. **Corriger les imports manquants** dans les 2 fichiers identifiés.

3. **Résoudre l'incompatibilité de type** dans `sync.controller.ts` :
   - Exporter l'interface `SyncPushPayload` depuis `sync.service.ts`
   - Valider `changes` avec Zod ou utiliser une assertion de type

4. **Vérifier la propriété `ip`** sur `FastifyRequest` et ajuster si nécessaire.

5. **Exécuter le linter complet** pour voir l'état actuel :
   ```bash
   npx nx lint api
   ```

## Conclusion
Les corrections apportées ont significativement amélioré la sécurité de type du projet, mais quelques erreurs ont été introduites pendant le processus. La plupart sont faciles à corriger (imports manquants) et une nécessite une attention particulière (validation des données `unknown`).

**Recommandation finale** : Corriger les 3 erreurs de haute priorité avant de poursuivre d'autres développements.