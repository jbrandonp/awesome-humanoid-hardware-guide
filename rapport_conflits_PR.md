# Rapport d'Analyse des Conflits de Pull Requests
Ce rapport fournit une analyse détaillée et des recommandations de résolution pour chaque Pull Request (PR) actuellement en conflit sur le dépôt jbrandonp/awesome-humanoid-hardware-guide.

## [PR #58: Pull Request #58](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/58)
- **Branche de base :** `main`
- **Branche source :** `pr_58` (locale)

### Fichiers en conflit :
- `apps/api/jest.config.js`
```diff
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true, tsconfig: '<rootDir>/../tsconfig.app.json' }],
>>>>>>> pr_58
>>>>>>> pr_58
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/app.module.ts`
```diff
<<<<<<< HEAD
=======
import { AdtModule } from './adt/adt.module';
>>>>>>> pr_58
>>>>>>> pr_58
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/app/App.tsx`
```diff
<<<<<<< HEAD
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
=======
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
>>>>>>> pr_58
>>>>>>> pr_58
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
=======
        "@nestjs/event-emitter": "^3.0.1",
>>>>>>> pr_58
>>>>>>> pr_58
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
=======
    "@types/jest": "^30.0.0",
>>>>>>> pr_58
>>>>>>> pr_58
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `prisma/schema.prisma`
```diff
<<<<<<< HEAD
=======

enum BedStatus {
  AVAILABLE
  OCCUPIED
  MAINTENANCE
  CLEANING
}

enum BedType {
  STANDARD
  ICU // Soins intensifs
  PEDIATRIC // Pédiatrie
  MATERNITY // Maternité
}

model Bed {
  id         String    @id @default(uuid())
  roomNumber String
  status     BedStatus @default(AVAILABLE)
  bedType    BedType   @default(STANDARD)

  // Capacités médicales (ex: ["OXYGEN", "VENTILATOR", "ISOLATION"])
  features String[]

  // Optimistic Locking pour la synchro Offline
  version Int @default(1)

  // Relations
  currentPatientId String?        @unique
  encounters       BedEncounter[] // Historique complet d'occupation

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// L'entité critique pour la facturation et la traçabilité
model BedEncounter {
  id        String @id @default(uuid())
  patientId String
  bedId     String
  bed       Bed    @relation(fields: [bedId], references: [id])

  admittedAt   DateTime  @default(now())
  dischargedAt DateTime? // Rempli lors de la sortie ou du transfert

  // Raison du transfert ou de la sortie (ex: "Amélioration", "Transfert Réa", "Décès")
  dischargeReason String?

... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Schéma Prisma :** Unir les nouveaux modèles ou champs ajoutés dans la PR avec ceux existants sur main, sans en supprimer aucun. Si un enum ou un modèle est ajouté des deux côtés, combiner les valeurs.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

## [PR #57: Pull Request #57](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/57)
- **Branche de base :** `main`
- **Branche source :** `pr_57` (locale)

### Fichiers en conflit :
- `apps/api/jest.config.js`
```diff
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit-dpdpa.module.ts`
```diff
<<<<<<< HEAD
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
=======
@Module({
  imports: [PrismaModule],
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit.interceptor.ts`
```diff
<<<<<<< HEAD
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
=======
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/billing/billing.module.ts`
```diff
<<<<<<< HEAD

@Module({
  providers: [BillingService],
  controllers: [BillingController],
=======
import { ReconciliationService } from './pos/reconciliation.service';
import { PosController } from './pos/pos.controller';

@Module({
  providers: [BillingService, ReconciliationService],
  controllers: [BillingController, PosController],
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/cors.spec.ts`
```diff
<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
=======

import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.controller.ts`
```diff
<<<<<<< HEAD
import { Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters, Res, HttpStatus } from '@nestjs/common';
=======
import { Controller, Get, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.module.ts`
```diff
<<<<<<< HEAD
import { FhirMapper } from './fhir.mapper';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
  providers: [FhirService, FhirMapper],
=======

@Module({
  providers: [FhirService],
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.service.ts`
```diff
<<<<<<< HEAD
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';
=======

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// Ces schémas Zod garantissent que le backend ne crache JAMAIS un JSON
// illégal ou incomplet vers une autre institution médicale (Hôpital/État).
// ============================================================================

export const FhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().uuid(),
  name: z.array(z.object({
    use: z.string(),
    family: z.string().min(1, 'Le nom de famille est obligatoire en FHIR'),
    given: z.array(z.string())
  })).min(1, 'Au moins un nom complet est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance non conforme (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
});

export const FhirObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().uuid(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended']),
  subject: z.object({ reference: z.string() }),
  effectiveDateTime: z.string().datetime(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(), // ex: http://loinc.org
      code: z.string(),
      display: z.string()
    }))
  }),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  valueString: z.string().optional()
... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/iot/iot.module.ts`
```diff
<<<<<<< HEAD
import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
=======
@Module({
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.controller.spec.ts`
```diff
<<<<<<< HEAD
import { SyncService } from './sync.service';
import { JwtService } from '@nestjs/jwt';
=======
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.service.spec.ts`
```diff
<<<<<<< HEAD
import { PrismaService } from '../prisma/prisma.service';
=======
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.lock`
```diff
<<<<<<< HEAD
name = "aes"
version = "0.8.4"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "b169f7a6d4742236a0a00c541b845991d0ac43e546831af1249753ab4c3aa3a0"
dependencies = [
 "cfg-if",
 "cipher",
 "cpufeatures",
]

[[package]]
=======
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.toml`
```diff
<<<<<<< HEAD
printpdf = "0.9.1"
tauri-plugin-dialog = "2.6.0"
image = "0.25.6"
=======
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/src/lib.rs`
```diff
<<<<<<< HEAD
mod report_generator;
=======
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/app/App.tsx`
```diff
<<<<<<< HEAD
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
=======
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/components/SmartPenCanvas.tsx`
```diff
<<<<<<< HEAD
=======
      console.log("[SmartPen] Connexion au SDK matériel (Ex: WondrxSDK)...");
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/hooks/useBleScanner.ts`
```diff
<<<<<<< HEAD
=======
      console.error("[CRITICAL DB ERROR] Crash d'écriture WatermelonDB.", dbError);
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/background-sync.service.ts`
```diff
<<<<<<< HEAD
=======
  console.log(`[OS Background Worker] Réveil de la tâche de synchronisation...`);

>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/mdns-scanner.service.ts`
```diff
<<<<<<< HEAD
=======
           console.log(`[mDNS Scanner] Serveur découvert sur ${fullUrl}`);

>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/pdf-generator.service.ts`
```diff
<<<<<<< HEAD
=======
      console.log(`[PDF Engine] Ordonnance générée avec succès : ${file.filePath}`);

>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
        "@nestjs/bullmq": "^11.0.4",
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/jwt": "^11.0.2",
        "@nestjs/mongoose": "^11.0.4",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@nestjs/schedule": "^6.1.1",
        "@nestjs/throttler": "^6.5.0",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
        "bullmq": "^5.71.0",
=======
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
    "@types/supertest": "^7.2.0",
=======
>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `prisma/schema.prisma`
```diff
<<<<<<< HEAD
=======
enum RegisterStatus {
  OPEN
  PENDING_APPROVAL
  CLOSED
}

enum TransactionType {
  PAYMENT
  REFUND
  PAY_IN
  PAY_OUT
}

enum PaymentMethod {
  CASH
  CARD
  UPI
}

>>>>>>> pr_57
>>>>>>> pr_57
```
**Recommandation de résolution :**
  - **Schéma Prisma :** Unir les nouveaux modèles ou champs ajoutés dans la PR avec ceux existants sur main, sans en supprimer aucun. Si un enum ou un modèle est ajouté des deux côtés, combiner les valeurs.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

## [PR #54: Pull Request #54](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/54)
- **Branche de base :** `main`
- **Branche source :** `pr_54` (locale)

### Fichiers en conflit :
- `apps/api/src/app/app.module.ts`
```diff
<<<<<<< HEAD
=======
import { EventEmitterModule } from '@nestjs/event-emitter';
import { QueueModule } from './queue/queue.module';
>>>>>>> pr_54
>>>>>>> pr_54
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
=======
        "@nestjs/event-emitter": "^3.0.1",
>>>>>>> pr_54
>>>>>>> pr_54
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
=======
    "@nestjs/event-emitter": "^3.0.1",
>>>>>>> pr_54
>>>>>>> pr_54
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
## [PR #51: Pull Request #51](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/51)
- **Branche de base :** `main`
- **Branche source :** `pr_51` (locale)

### Fichiers en conflit :
- `apps/api/jest.config.js`
```diff
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/app.module.ts`
```diff
<<<<<<< HEAD
=======
import { WaitingRoomModule } from './waiting-room/waiting-room.module';
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit-dpdpa.module.ts`
```diff
<<<<<<< HEAD
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
=======
@Module({
  imports: [PrismaModule],
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit.interceptor.ts`
```diff
<<<<<<< HEAD
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
=======
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/cors.spec.ts`
```diff
<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
=======

import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.controller.ts`
```diff
<<<<<<< HEAD
import { Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters, Res, HttpStatus } from '@nestjs/common';
=======
import { Controller, Get, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.module.ts`
```diff
<<<<<<< HEAD
import { FhirMapper } from './fhir.mapper';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
  providers: [FhirService, FhirMapper],
=======

@Module({
  providers: [FhirService],
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.service.ts`
```diff
<<<<<<< HEAD
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';
=======

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// Ces schémas Zod garantissent que le backend ne crache JAMAIS un JSON
// illégal ou incomplet vers une autre institution médicale (Hôpital/État).
// ============================================================================

export const FhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().uuid(),
  name: z.array(z.object({
    use: z.string(),
    family: z.string().min(1, 'Le nom de famille est obligatoire en FHIR'),
    given: z.array(z.string())
  })).min(1, 'Au moins un nom complet est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance non conforme (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
});

export const FhirObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().uuid(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended']),
  subject: z.object({ reference: z.string() }),
  effectiveDateTime: z.string().datetime(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(), // ex: http://loinc.org
      code: z.string(),
      display: z.string()
    }))
  }),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  valueString: z.string().optional()
... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/iot/iot.module.ts`
```diff
<<<<<<< HEAD
import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
=======
@Module({
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.controller.spec.ts`
```diff
<<<<<<< HEAD
import { SyncService } from './sync.service';
import { JwtService } from '@nestjs/jwt';
=======
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.service.spec.ts`
```diff
<<<<<<< HEAD
import { PrismaService } from '../prisma/prisma.service';
=======
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.lock`
```diff
<<<<<<< HEAD
name = "aes"
version = "0.8.4"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "b169f7a6d4742236a0a00c541b845991d0ac43e546831af1249753ab4c3aa3a0"
dependencies = [
 "cfg-if",
 "cipher",
 "cpufeatures",
]

[[package]]
=======
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.toml`
```diff
<<<<<<< HEAD
printpdf = "0.9.1"
tauri-plugin-dialog = "2.6.0"
image = "0.25.6"
=======
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/src/lib.rs`
```diff
<<<<<<< HEAD
mod report_generator;
=======
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/app/App.tsx`
```diff
<<<<<<< HEAD
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
=======
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/components/SmartPenCanvas.tsx`
```diff
<<<<<<< HEAD
=======
      console.log("[SmartPen] Connexion au SDK matériel (Ex: WondrxSDK)...");
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/hooks/useBleScanner.ts`
```diff
<<<<<<< HEAD
=======
      console.error("[CRITICAL DB ERROR] Crash d'écriture WatermelonDB.", dbError);
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/background-sync.service.ts`
```diff
<<<<<<< HEAD
=======
  console.log(`[OS Background Worker] Réveil de la tâche de synchronisation...`);

>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/mdns-scanner.service.ts`
```diff
<<<<<<< HEAD
=======
           console.log(`[mDNS Scanner] Serveur découvert sur ${fullUrl}`);

>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/pdf-generator.service.ts`
```diff
<<<<<<< HEAD
=======
      console.log(`[PDF Engine] Ordonnance générée avec succès : ${file.filePath}`);

>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
        "@nestjs/bullmq": "^11.0.4",
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/jwt": "^11.0.2",
        "@nestjs/mongoose": "^11.0.4",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@nestjs/schedule": "^6.1.1",
        "@nestjs/throttler": "^6.5.0",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
        "bullmq": "^5.71.0",
=======
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/jwt": "^11.0.2",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@nestjs/platform-socket.io": "^11.1.17",
        "@nestjs/websockets": "^11.1.17",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
        "class-transformer": "^0.5.1",
        "class-validator": "^0.15.1",
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
    "@types/supertest": "^7.2.0",
=======
>>>>>>> pr_51
>>>>>>> pr_51
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
## [PR #50: Pull Request #50](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/50)
- **Branche de base :** `main`
- **Branche source :** `pr_50` (locale)

### Fichiers en conflit :
- `apps/api/jest.config.js`
```diff
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/abdm/inventory.service.ts`
```diff
<<<<<<< HEAD
=======

           if (recommendedOrder > 0) {
             await this.generateDraftPurchaseOrder(item.id, recommendedOrder, tx);
           }
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/app.module.ts`
```diff
<<<<<<< HEAD
=======
import { ProcurementModule } from './procurement/procurement.module';
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit-dpdpa.module.ts`
```diff
<<<<<<< HEAD
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
=======
@Module({
  imports: [PrismaModule],
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit.interceptor.ts`
```diff
<<<<<<< HEAD
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
=======
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/cors.spec.ts`
```diff
<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
=======

import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.controller.ts`
```diff
<<<<<<< HEAD
import { Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters, Res, HttpStatus } from '@nestjs/common';
=======
import { Controller, Get, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.module.ts`
```diff
<<<<<<< HEAD
import { FhirMapper } from './fhir.mapper';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
  providers: [FhirService, FhirMapper],
=======

@Module({
  providers: [FhirService],
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.service.ts`
```diff
<<<<<<< HEAD
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';
=======

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// Ces schémas Zod garantissent que le backend ne crache JAMAIS un JSON
// illégal ou incomplet vers une autre institution médicale (Hôpital/État).
// ============================================================================

export const FhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().uuid(),
  name: z.array(z.object({
    use: z.string(),
    family: z.string().min(1, 'Le nom de famille est obligatoire en FHIR'),
    given: z.array(z.string())
  })).min(1, 'Au moins un nom complet est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance non conforme (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
});

export const FhirObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().uuid(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended']),
  subject: z.object({ reference: z.string() }),
  effectiveDateTime: z.string().datetime(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(), // ex: http://loinc.org
      code: z.string(),
      display: z.string()
    }))
  }),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  valueString: z.string().optional()
... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/iot/iot.module.ts`
```diff
<<<<<<< HEAD
import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
=======
@Module({
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.controller.spec.ts`
```diff
<<<<<<< HEAD
import { SyncService } from './sync.service';
import { JwtService } from '@nestjs/jwt';
=======
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.service.spec.ts`
```diff
<<<<<<< HEAD
import { PrismaService } from '../prisma/prisma.service';
=======
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.lock`
```diff
<<<<<<< HEAD
name = "aes"
version = "0.8.4"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "b169f7a6d4742236a0a00c541b845991d0ac43e546831af1249753ab4c3aa3a0"
dependencies = [
 "cfg-if",
 "cipher",
 "cpufeatures",
]

[[package]]
=======
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.toml`
```diff
<<<<<<< HEAD
printpdf = "0.9.1"
tauri-plugin-dialog = "2.6.0"
image = "0.25.6"
=======
printpdf = "0.5.0"
qrcode = "0.14"
image = "0.24"
sha2 = "0.10"
chrono = "0.4"
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/src/lib.rs`
```diff
<<<<<<< HEAD
mod report_generator;
=======
mod purchase_order;
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src/components/ZenConsultationLayout.tsx`
```diff
<<<<<<< HEAD
=======
import { PurchaseOrderQueue } from './PurchaseOrderQueue';
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/app/App.tsx`
```diff
<<<<<<< HEAD
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
=======
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/components/SmartPenCanvas.tsx`
```diff
<<<<<<< HEAD
=======
      console.log("[SmartPen] Connexion au SDK matériel (Ex: WondrxSDK)...");
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/hooks/useBleScanner.ts`
```diff
<<<<<<< HEAD
=======
      console.error("[CRITICAL DB ERROR] Crash d'écriture WatermelonDB.", dbError);
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/background-sync.service.ts`
```diff
<<<<<<< HEAD
=======
  console.log(`[OS Background Worker] Réveil de la tâche de synchronisation...`);

>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/mdns-scanner.service.ts`
```diff
<<<<<<< HEAD
=======
           console.log(`[mDNS Scanner] Serveur découvert sur ${fullUrl}`);

>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/pdf-generator.service.ts`
```diff
<<<<<<< HEAD
=======
      console.log(`[PDF Engine] Ordonnance générée avec succès : ${file.filePath}`);

>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
        "mongoose": "^9.3.2",
        "node-dns-sd": "^1.0.1",
        "passport": "^0.7.0",
=======
        "lucide-react": "^1.0.1",
        "mongoose": "^9.3.2",
        "node-dns-sd": "^1.0.1",
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
    "@types/supertest": "^7.2.0",
=======
>>>>>>> pr_50
>>>>>>> pr_50
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `prisma/schema.prisma`
```diff
<<<<<<< HEAD
model InventoryItem {
  id             String   @id @default(uuid())
  name           String   @unique
  quantity       Int      @default(0)
  unitPriceCents Int      @map("unit_price_cents") // Prix de vente unitaire
  updatedAt      DateTime @updatedAt

  @@map("inventory_items")
}

=======
model Supplier {
  id           String   @id @default(uuid())
  name         String   @unique
  contactEmail String?  @map("contact_email")
  contactPhone String?  @map("contact_phone")
  leadTimeDays Int      @default(7) @map("lead_time_days") // Délai de livraison habituel
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  inventoryItems InventoryItem[]
  purchaseOrders PurchaseOrder[]

  @@map("suppliers")
}

model PurchaseOrder {
  id             String   @id @default(uuid())
  supplierId     String   @map("supplier_id")
  status         String   @default("DRAFT") // DRAFT, PENDING_APPROVAL, APPROVED, SENT, RECEIVED
  idempotencyKey String?  @unique @map("idempotency_key")
  totalCents     Int      @default(0) @map("total_cents")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  supplier Supplier            @relation(fields: [supplierId], references: [id])
  items    PurchaseOrderItem[]

  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id              String @id @default(uuid())
  purchaseOrderId String @map("purchase_order_id")
  inventoryItemId String @map("inventory_item_id")
  quantity        Int
  unitPriceCents  Int    @map("unit_price_cents") // Prix d'achat au moment de la commande

... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Schéma Prisma :** Unir les nouveaux modèles ou champs ajoutés dans la PR avec ceux existants sur main, sans en supprimer aucun. Si un enum ou un modèle est ajouté des deux côtés, combiner les valeurs.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

## [PR #49: Pull Request #49](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/49)
- **Branche de base :** `main`
- **Branche source :** `pr_49` (locale)

### Fichiers en conflit :
- `apps/api/jest.config.js`
```diff
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/app.module.ts`
```diff
<<<<<<< HEAD
=======
import { InventoryPredictorModule } from './inventory-predictor/inventory-predictor.module';
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit-dpdpa.module.ts`
```diff
<<<<<<< HEAD
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
=======
@Module({
  imports: [PrismaModule],
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit.interceptor.ts`
```diff
<<<<<<< HEAD
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
=======
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/cors.spec.ts`
```diff
<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
=======

import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.controller.ts`
```diff
<<<<<<< HEAD
import { Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters, Res, HttpStatus } from '@nestjs/common';
=======
import { Controller, Get, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.module.ts`
```diff
<<<<<<< HEAD
import { FhirMapper } from './fhir.mapper';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
  providers: [FhirService, FhirMapper],
=======

@Module({
  providers: [FhirService],
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.service.ts`
```diff
<<<<<<< HEAD
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';
=======

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// Ces schémas Zod garantissent que le backend ne crache JAMAIS un JSON
// illégal ou incomplet vers une autre institution médicale (Hôpital/État).
// ============================================================================

export const FhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().uuid(),
  name: z.array(z.object({
    use: z.string(),
    family: z.string().min(1, 'Le nom de famille est obligatoire en FHIR'),
    given: z.array(z.string())
  })).min(1, 'Au moins un nom complet est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance non conforme (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
});

export const FhirObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().uuid(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended']),
  subject: z.object({ reference: z.string() }),
  effectiveDateTime: z.string().datetime(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(), // ex: http://loinc.org
      code: z.string(),
      display: z.string()
    }))
  }),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  valueString: z.string().optional()
... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/iot/iot.module.ts`
```diff
<<<<<<< HEAD
import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
=======
@Module({
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.controller.spec.ts`
```diff
<<<<<<< HEAD
import { SyncService } from './sync.service';
import { JwtService } from '@nestjs/jwt';
=======
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.service.spec.ts`
```diff
<<<<<<< HEAD
import { PrismaService } from '../prisma/prisma.service';
=======
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.lock`
```diff
<<<<<<< HEAD
name = "aes"
version = "0.8.4"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "b169f7a6d4742236a0a00c541b845991d0ac43e546831af1249753ab4c3aa3a0"
dependencies = [
 "cfg-if",
 "cipher",
 "cpufeatures",
]

[[package]]
=======
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.toml`
```diff
<<<<<<< HEAD
printpdf = "0.9.1"
tauri-plugin-dialog = "2.6.0"
image = "0.25.6"
=======
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/src/lib.rs`
```diff
<<<<<<< HEAD
mod report_generator;
=======
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/app/App.tsx`
```diff
<<<<<<< HEAD
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
=======
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/components/SmartPenCanvas.tsx`
```diff
<<<<<<< HEAD
=======
      console.log("[SmartPen] Connexion au SDK matériel (Ex: WondrxSDK)...");
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/hooks/useBleScanner.ts`
```diff
<<<<<<< HEAD
=======
      console.error("[CRITICAL DB ERROR] Crash d'écriture WatermelonDB.", dbError);
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/background-sync.service.ts`
```diff
<<<<<<< HEAD
=======
  console.log(`[OS Background Worker] Réveil de la tâche de synchronisation...`);

>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/mdns-scanner.service.ts`
```diff
<<<<<<< HEAD
=======
           console.log(`[mDNS Scanner] Serveur découvert sur ${fullUrl}`);

>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/pdf-generator.service.ts`
```diff
<<<<<<< HEAD
=======
      console.log(`[PDF Engine] Ordonnance générée avec succès : ${file.filePath}`);

>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
        "@nestjs/bullmq": "^11.0.4",
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/jwt": "^11.0.2",
        "@nestjs/mongoose": "^11.0.4",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@nestjs/schedule": "^6.1.1",
        "@nestjs/throttler": "^6.5.0",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
        "bullmq": "^5.71.0",
=======
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
    "@types/supertest": "^7.2.0",
=======
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `prisma/schema.prisma`
```diff
<<<<<<< HEAD
  id             String   @id @default(uuid())
  name           String   @unique
  quantity       Int      @default(0)
  unitPriceCents Int      @map("unit_price_cents") // Prix de vente unitaire
  updatedAt      DateTime @updatedAt
=======
  id                String   @id @default(uuid())
  name              String   @unique
  quantity          Int      @default(0)
  criticalThreshold Int      @default(50) @map("critical_threshold")
  unitPriceCents    Int      @map("unit_price_cents") // Prix de vente unitaire
  updatedAt         DateTime @updatedAt
>>>>>>> pr_49
>>>>>>> pr_49
```
**Recommandation de résolution :**
  - **Schéma Prisma :** Unir les nouveaux modèles ou champs ajoutés dans la PR avec ceux existants sur main, sans en supprimer aucun. Si un enum ou un modèle est ajouté des deux côtés, combiner les valeurs.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

## [PR #48: Pull Request #48](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/48)
- **Branche de base :** `main`
- **Branche source :** `pr_48` (locale)

### Fichiers en conflit :
- `apps/api/jest.config.js`
```diff
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true, tsconfig: 'apps/api/tsconfig.app.json' }],
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit-dpdpa.module.ts`
```diff
<<<<<<< HEAD
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
=======
@Module({
  imports: [PrismaModule],
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit.interceptor.ts`
```diff
<<<<<<< HEAD
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
=======
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/cors.spec.ts`
```diff
<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
=======

import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.controller.ts`
```diff
<<<<<<< HEAD
import { Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters, Res, HttpStatus } from '@nestjs/common';
=======
import { Controller, Get, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.module.ts`
```diff
<<<<<<< HEAD
import { FhirMapper } from './fhir.mapper';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
  providers: [FhirService, FhirMapper],
=======

@Module({
  providers: [FhirService],
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.service.ts`
```diff
<<<<<<< HEAD
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';
=======

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// Ces schémas Zod garantissent que le backend ne crache JAMAIS un JSON
// illégal ou incomplet vers une autre institution médicale (Hôpital/État).
// ============================================================================

export const FhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().uuid(),
  name: z.array(z.object({
    use: z.string(),
    family: z.string().min(1, 'Le nom de famille est obligatoire en FHIR'),
    given: z.array(z.string())
  })).min(1, 'Au moins un nom complet est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance non conforme (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
});

export const FhirObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().uuid(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended']),
  subject: z.object({ reference: z.string() }),
  effectiveDateTime: z.string().datetime(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(), // ex: http://loinc.org
      code: z.string(),
      display: z.string()
    }))
  }),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  valueString: z.string().optional()
... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/iot/iot.module.ts`
```diff
<<<<<<< HEAD
import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
=======
@Module({
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.controller.spec.ts`
```diff
<<<<<<< HEAD
import { JwtService } from '@nestjs/jwt';
=======
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.module.ts`
```diff
<<<<<<< HEAD

@Module({})
=======
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TickerModule } from '../ticker/ticker.module';

@Module({
  imports: [PrismaModule, TickerModule],
  providers: [SyncService],
  controllers: [SyncController],
  exports: [SyncService]
})
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.service.spec.ts`
```diff
<<<<<<< HEAD
=======
import { EpiTickerService } from '../ticker/epi-ticker.service';
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.service.ts`
```diff
<<<<<<< HEAD
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
=======
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EpiTickerService } from '../ticker/epi-ticker.service';
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/ticker/epi-ticker.service.ts`
```diff
<<<<<<< HEAD
export type TickerAlertType = 'EPIDEMIOLOGY' | 'INVENTORY' | 'SYSTEM';
=======
export type TickerAlertType = 'EPIDEMIOLOGY' | 'INVENTORY' | 'SYSTEM' | 'INCIDENT';
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.lock`
```diff
<<<<<<< HEAD
name = "aes"
version = "0.8.4"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "b169f7a6d4742236a0a00c541b845991d0ac43e546831af1249753ab4c3aa3a0"
dependencies = [
 "cfg-if",
 "cipher",
 "cpufeatures",
]

[[package]]
=======
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.toml`
```diff
<<<<<<< HEAD
printpdf = "0.9.1"
tauri-plugin-dialog = "2.6.0"
image = "0.25.6"
=======
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/src/lib.rs`
```diff
<<<<<<< HEAD
mod report_generator;
=======
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/app/App.tsx`
```diff
<<<<<<< HEAD
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
=======
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/components/SmartPenCanvas.tsx`
```diff
<<<<<<< HEAD
=======
      console.log("[SmartPen] Connexion au SDK matériel (Ex: WondrxSDK)...");
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/hooks/useBleScanner.ts`
```diff
<<<<<<< HEAD
=======
      console.error("[CRITICAL DB ERROR] Crash d'écriture WatermelonDB.", dbError);
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/background-sync.service.ts`
```diff
<<<<<<< HEAD
=======
  console.log(`[OS Background Worker] Réveil de la tâche de synchronisation...`);

>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/mdns-scanner.service.ts`
```diff
<<<<<<< HEAD
=======
           console.log(`[mDNS Scanner] Serveur découvert sur ${fullUrl}`);

>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/pdf-generator.service.ts`
```diff
<<<<<<< HEAD
=======
      console.log(`[PDF Engine] Ordonnance générée avec succès : ${file.filePath}`);

>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
        "@nestjs/bullmq": "^11.0.4",
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/jwt": "^11.0.2",
        "@nestjs/mongoose": "^11.0.4",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@nestjs/schedule": "^6.1.1",
        "@nestjs/throttler": "^6.5.0",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
        "bullmq": "^5.71.0",
=======
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
=======
    "@nestjs/bullmq": "^11.0.4",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/mongoose": "^11.0.4",
    "@nestjs/schedule": "^6.1.1",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@nestjs/throttler": "^6.5.0",
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `prisma/schema.prisma`
```diff
<<<<<<< HEAD
  id             String    @id @default(uuid())
  visitId        String    @map("visit_id")
  patientId      String    @map("patient_id")
  medicationName String    @map("medication_name")
  dosage         String
  instructions   String?
  prescribedAt   DateTime  @map("prescribed_at")
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  // Sync Status Fields
  status         String    @default("created") @map("_status")
  deletedAt      DateTime? @map("deleted_at")
=======
  administrations Bytes? // Will store Yjs Binary Updates (Uint8Array) for eMAR
  id              String    @id @default(uuid())
  visitId         String    @map("visit_id")
  patientId       String    @map("patient_id")
  medicationName  String    @map("medication_name")
  dosage          String
  instructions    String?
  prescribedAt    DateTime  @map("prescribed_at")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  // Sync Status Fields
  status          String    @default("created") @map("_status")
  deletedAt       DateTime? @map("deleted_at")
>>>>>>> pr_48
>>>>>>> pr_48
```
**Recommandation de résolution :**
  - **Schéma Prisma :** Unir les nouveaux modèles ou champs ajoutés dans la PR avec ceux existants sur main, sans en supprimer aucun. Si un enum ou un modèle est ajouté des deux côtés, combiner les valeurs.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

## [PR #45: Pull Request #45](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/45)
- **Branche de base :** `main`
- **Branche source :** `pr_45` (locale)

### Fichiers en conflit :
- `apps/api/jest.config.js`
```diff
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/app.module.ts`
```diff
<<<<<<< HEAD
=======
import { PacsIndexerModule } from './pacs-indexer/pacs-indexer.module';
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit-dpdpa.module.ts`
```diff
<<<<<<< HEAD
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
=======
@Module({
  imports: [PrismaModule],
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit.interceptor.ts`
```diff
<<<<<<< HEAD
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
=======
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/cors.spec.ts`
```diff
<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
=======

import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.controller.ts`
```diff
<<<<<<< HEAD
import { Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters, Res, HttpStatus } from '@nestjs/common';
=======
import { Controller, Get, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.module.ts`
```diff
<<<<<<< HEAD
import { FhirMapper } from './fhir.mapper';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
  providers: [FhirService, FhirMapper],
=======

@Module({
  providers: [FhirService],
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.service.ts`
```diff
<<<<<<< HEAD
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';
=======

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// Ces schémas Zod garantissent que le backend ne crache JAMAIS un JSON
// illégal ou incomplet vers une autre institution médicale (Hôpital/État).
// ============================================================================

export const FhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().uuid(),
  name: z.array(z.object({
    use: z.string(),
    family: z.string().min(1, 'Le nom de famille est obligatoire en FHIR'),
    given: z.array(z.string())
  })).min(1, 'Au moins un nom complet est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance non conforme (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
});

export const FhirObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().uuid(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended']),
  subject: z.object({ reference: z.string() }),
  effectiveDateTime: z.string().datetime(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(), // ex: http://loinc.org
      code: z.string(),
      display: z.string()
    }))
  }),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  valueString: z.string().optional()
... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/iot/iot.module.ts`
```diff
<<<<<<< HEAD
import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
=======
@Module({
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.controller.spec.ts`
```diff
<<<<<<< HEAD
import { SyncService } from './sync.service';
import { JwtService } from '@nestjs/jwt';
=======
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.service.spec.ts`
```diff
<<<<<<< HEAD
import { PrismaService } from '../prisma/prisma.service';
=======
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.lock`
```diff
<<<<<<< HEAD
name = "aes"
version = "0.8.4"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "b169f7a6d4742236a0a00c541b845991d0ac43e546831af1249753ab4c3aa3a0"
dependencies = [
 "cfg-if",
 "cipher",
 "cpufeatures",
]

[[package]]
=======
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.toml`
```diff
<<<<<<< HEAD
printpdf = "0.9.1"
tauri-plugin-dialog = "2.6.0"
image = "0.25.6"
=======
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/src/lib.rs`
```diff
<<<<<<< HEAD
mod report_generator;
=======
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/app/App.tsx`
```diff
<<<<<<< HEAD
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
=======
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/components/SmartPenCanvas.tsx`
```diff
<<<<<<< HEAD
=======
      console.log("[SmartPen] Connexion au SDK matériel (Ex: WondrxSDK)...");
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/hooks/useBleScanner.ts`
```diff
<<<<<<< HEAD
=======
      console.error("[CRITICAL DB ERROR] Crash d'écriture WatermelonDB.", dbError);
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/background-sync.service.ts`
```diff
<<<<<<< HEAD
=======
  console.log(`[OS Background Worker] Réveil de la tâche de synchronisation...`);

>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/mdns-scanner.service.ts`
```diff
<<<<<<< HEAD
=======
           console.log(`[mDNS Scanner] Serveur découvert sur ${fullUrl}`);

>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/pdf-generator.service.ts`
```diff
<<<<<<< HEAD
=======
      console.log(`[PDF Engine] Ordonnance générée avec succès : ${file.filePath}`);

>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
=======
        "@aws-sdk/client-s3": "^3.1015.0",
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
    "@types/supertest": "^7.2.0",
=======
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `prisma/schema.prisma`
```diff
<<<<<<< HEAD
=======
  dicomStudies  DicomStudy[]
>>>>>>> pr_45
>>>>>>> pr_45
```
**Recommandation de résolution :**
  - **Schéma Prisma :** Unir les nouveaux modèles ou champs ajoutés dans la PR avec ceux existants sur main, sans en supprimer aucun. Si un enum ou un modèle est ajouté des deux côtés, combiner les valeurs.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

## [PR #44: Pull Request #44](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/44)
- **Branche de base :** `main`
- **Branche source :** `pr_44` (locale)

### Fichiers en conflit :
- `apps/api/src/app/app.module.ts`
```diff
<<<<<<< HEAD
=======
import { HighAlertMedicationModule } from './high-alert-medication/high-alert-medication.module';
>>>>>>> pr_44
>>>>>>> pr_44
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `libs/models/src/lib/models.ts`
```diff
<<<<<<< HEAD
=======

export const DualSignOffSchema = z.object({
  primaryUserId: z.string().uuid(),
  secondaryPin: z.string().min(4).max(8).optional(),
  secondaryBadgeId: z.string().min(1).optional(),
  patientId: z.string().uuid(),
  medicationName: z.string().min(1),
  dosage: z.string().min(1),
  timestamp: z.string().datetime(),
  offlineHash: z.string().optional(),
}).refine(data => data.secondaryPin || data.secondaryBadgeId, {
  message: "Either PIN or Badge ID must be provided for secondary sign-off",
});

export type DualSignOff = z.infer<typeof DualSignOffSchema>;
>>>>>>> pr_44
>>>>>>> pr_44
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
      "resolved": "https://registry.npmjs.org/@nozbe/with-observables/-/with-observables-1.6.0.tgz",
      "integrity": "sha512-X/qGRBrmXLBVP3pqGQKD461UNx4sKfNoKWe4dlM/Gvtd12BOmv+nYOxw8PXiUr28yXxVYi03LpwDBd+JFo1Adg==",
=======
>>>>>>> pr_44
>>>>>>> pr_44
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `prisma/schema.prisma`
```diff
<<<<<<< HEAD
=======
  pin         String?  // Hashed PIN for secondary auth
  badgeId     String?  @map("badge_id") // Optional hardware badge token
>>>>>>> pr_44
>>>>>>> pr_44
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

## [PR #43: Pull Request #43](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/43)
- **Branche de base :** `main`
- **Branche source :** `pr_43` (locale)

### Fichiers en conflit :
- `apps/api/jest.config.js`
```diff
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit-dpdpa.module.ts`
```diff
<<<<<<< HEAD
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
=======
@Module({
  imports: [PrismaModule],
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit.interceptor.ts`
```diff
<<<<<<< HEAD
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
=======
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/cors.spec.ts`
```diff
<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
=======

import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.controller.ts`
```diff
<<<<<<< HEAD
import { Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters, Res, HttpStatus } from '@nestjs/common';
=======
import { Controller, Get, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.module.ts`
```diff
<<<<<<< HEAD
import { FhirMapper } from './fhir.mapper';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
  providers: [FhirService, FhirMapper],
=======

@Module({
  providers: [FhirService],
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.service.ts`
```diff
<<<<<<< HEAD
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';
=======

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// Ces schémas Zod garantissent que le backend ne crache JAMAIS un JSON
// illégal ou incomplet vers une autre institution médicale (Hôpital/État).
// ============================================================================

export const FhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().uuid(),
  name: z.array(z.object({
    use: z.string(),
    family: z.string().min(1, 'Le nom de famille est obligatoire en FHIR'),
    given: z.array(z.string())
  })).min(1, 'Au moins un nom complet est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance non conforme (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
});

export const FhirObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().uuid(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended']),
  subject: z.object({ reference: z.string() }),
  effectiveDateTime: z.string().datetime(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(), // ex: http://loinc.org
      code: z.string(),
      display: z.string()
    }))
  }),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  valueString: z.string().optional()
... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/iot/iot.module.ts`
```diff
<<<<<<< HEAD
import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
=======
@Module({
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.controller.spec.ts`
```diff
<<<<<<< HEAD
import { SyncService } from './sync.service';
import { JwtService } from '@nestjs/jwt';
=======
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.service.spec.ts`
```diff
<<<<<<< HEAD
import { PrismaService } from '../prisma/prisma.service';
=======
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.lock`
```diff
<<<<<<< HEAD
name = "aes"
version = "0.8.4"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "b169f7a6d4742236a0a00c541b845991d0ac43e546831af1249753ab4c3aa3a0"
dependencies = [
 "cfg-if",
 "cipher",
 "cpufeatures",
]

[[package]]
=======
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.toml`
```diff
<<<<<<< HEAD
printpdf = "0.9.1"
tauri-plugin-dialog = "2.6.0"
image = "0.25.6"
=======
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/src/lib.rs`
```diff
<<<<<<< HEAD
mod report_generator;
=======
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/package.json`
```diff
<<<<<<< HEAD
    "expo-battery": "~10.0.8",
=======
    "expo-barcode-scanner": "^13.0.1",
    "expo-battery": "~10.0.8",
    "expo-camera": "~17.0.10",
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `apps/mobile/src/app/App.tsx`
```diff
<<<<<<< HEAD
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
=======
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/components/SmartPenCanvas.tsx`
```diff
<<<<<<< HEAD
=======
      console.log("[SmartPen] Connexion au SDK matériel (Ex: WondrxSDK)...");
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/hooks/useBleScanner.ts`
```diff
<<<<<<< HEAD
=======
      console.error("[CRITICAL DB ERROR] Crash d'écriture WatermelonDB.", dbError);
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/background-sync.service.ts`
```diff
<<<<<<< HEAD
=======
  console.log(`[OS Background Worker] Réveil de la tâche de synchronisation...`);

>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/mdns-scanner.service.ts`
```diff
<<<<<<< HEAD
=======
           console.log(`[mDNS Scanner] Serveur découvert sur ${fullUrl}`);

>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/pdf-generator.service.ts`
```diff
<<<<<<< HEAD
=======
      console.log(`[PDF Engine] Ordonnance générée avec succès : ${file.filePath}`);

>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
        "@nestjs/bullmq": "^11.0.4",
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/jwt": "^11.0.2",
        "@nestjs/mongoose": "^11.0.4",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@nestjs/schedule": "^6.1.1",
        "@nestjs/throttler": "^6.5.0",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
        "bullmq": "^5.71.0",
        "expo": "~54.0.0",
        "expo-splash-screen": "~31.0.11",
        "expo-status-bar": "~3.0.8",
        "expo-system-ui": "~6.0.8",
        "ioredis": "^5.10.1",
        "mongoose": "^9.3.2",
        "node-dns-sd": "^1.0.1",
        "passport": "^0.7.0",
        "passport-jwt": "^4.0.1",
=======
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@nozbe/watermelondb": "^0.28.0",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
        "expo": "~54.0.0",
        "expo-barcode-scanner": "^13.0.1",
        "expo-camera": "^55.0.10",
        "expo-splash-screen": "~31.0.11",
        "expo-status-bar": "~3.0.8",
        "expo-system-ui": "~6.0.8",
        "node-dns-sd": "^1.0.1",
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
    "@types/supertest": "^7.2.0",
=======
>>>>>>> pr_43
>>>>>>> pr_43
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
## [PR #42: Pull Request #42](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/42)
- **Branche de base :** `main`
- **Branche source :** `pr_42` (locale)

### Fichiers en conflit :
- `apps/api/src/app/app.module.ts`
```diff
<<<<<<< HEAD
=======
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Hl7MllpModule } from './hl7-mllp/hl7-mllp.module';
>>>>>>> pr_42
>>>>>>> pr_42
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
=======
        "@nestjs/event-emitter": "^3.0.1",
>>>>>>> pr_42
>>>>>>> pr_42
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
=======
    "@nestjs/event-emitter": "^3.0.1",
>>>>>>> pr_42
>>>>>>> pr_42
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `prisma/schema.prisma`
```diff
<<<<<<< HEAD
=======
  hl7Messages   Hl7DeadLetterQueue[]
>>>>>>> pr_42
>>>>>>> pr_42
```
**Recommandation de résolution :**
  - **Schéma Prisma :** Unir les nouveaux modèles ou champs ajoutés dans la PR avec ceux existants sur main, sans en supprimer aucun. Si un enum ou un modèle est ajouté des deux côtés, combiner les valeurs.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

## [PR #41: Pull Request #41](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/41)
- **Branche de base :** `main`
- **Branche source :** `pr_41` (locale)

### Fichiers en conflit :
- `apps/api/jest.config.js`
```diff
<<<<<<< HEAD
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.app.json' }],
=======
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/app.module.ts`
```diff
<<<<<<< HEAD
=======
import { NursingStationModule } from './nursing-station/nursing-station.module';
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit-dpdpa.module.ts`
```diff
<<<<<<< HEAD
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
=======
@Module({
  imports: [PrismaModule],
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/audit/audit.interceptor.ts`
```diff
<<<<<<< HEAD
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
=======
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/cors.spec.ts`
```diff
<<<<<<< HEAD
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
=======

import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.controller.ts`
```diff
<<<<<<< HEAD
import { Controller, Get, Post, Param, Query, Body, UseGuards, UseFilters, Res, HttpStatus } from '@nestjs/common';
=======
import { Controller, Get, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.module.ts`
```diff
<<<<<<< HEAD
import { FhirMapper } from './fhir.mapper';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalRecordModule } from '../clinical-record/clinical-record.module';

@Module({
  imports: [PrismaModule, ClinicalRecordModule],
  providers: [FhirService, FhirMapper],
=======

@Module({
  providers: [FhirService],
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/fhir/fhir.service.ts`
```diff
<<<<<<< HEAD
import {
  FhirMapper,
  FhirBundleSchema,
  FhirBundle,
  FhirPatientSchema,
  FhirPatient,
  FhirObservationSchema,
  FhirObservation
} from './fhir.mapper';
=======

// ============================================================================
// TYPAGES STRICTS - STANDARD HL7 FHIR (R4) - ZÉRO 'ANY' POLICY
// Ces schémas Zod garantissent que le backend ne crache JAMAIS un JSON
// illégal ou incomplet vers une autre institution médicale (Hôpital/État).
// ============================================================================

export const FhirPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().uuid(),
  name: z.array(z.object({
    use: z.string(),
    family: z.string().min(1, 'Le nom de famille est obligatoire en FHIR'),
    given: z.array(z.string())
  })).min(1, 'Au moins un nom complet est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance non conforme (YYYY-MM-DD)'),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional()
});

export const FhirObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().uuid(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended']),
  subject: z.object({ reference: z.string() }),
  effectiveDateTime: z.string().datetime(),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(), // ex: http://loinc.org
      code: z.string(),
      display: z.string()
    }))
  }),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  valueString: z.string().optional()
... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/iot/iot.module.ts`
```diff
<<<<<<< HEAD
import { DpdpaModule } from '../audit/audit-dpdpa.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DpdpaModule, PrismaModule],
=======
@Module({
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.controller.spec.ts`
```diff
<<<<<<< HEAD
import { SyncService } from './sync.service';
import { JwtService } from '@nestjs/jwt';
=======
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/sync/sync.service.spec.ts`
```diff
<<<<<<< HEAD
import { PrismaService } from '../prisma/prisma.service';
=======
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.lock`
```diff
<<<<<<< HEAD
name = "aes"
version = "0.8.4"
source = "registry+https://github.com/rust-lang/crates.io-index"
checksum = "b169f7a6d4742236a0a00c541b845991d0ac43e546831af1249753ab4c3aa3a0"
dependencies = [
 "cfg-if",
 "cipher",
 "cpufeatures",
]

[[package]]
=======
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/Cargo.toml`
```diff
<<<<<<< HEAD
printpdf = "0.9.1"
tauri-plugin-dialog = "2.6.0"
image = "0.25.6"
=======
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/desktop/src-tauri/src/lib.rs`
```diff
<<<<<<< HEAD
mod report_generator;
=======
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/app/App.tsx`
```diff
<<<<<<< HEAD
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
=======
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Imports :** Combiner les imports des deux branches (garder ceux de la branche de base et ajouter les nouveaux de la PR).
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/components/SmartPenCanvas.tsx`
```diff
<<<<<<< HEAD
=======
      console.log("[SmartPen] Connexion au SDK matériel (Ex: WondrxSDK)...");
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/hooks/useBleScanner.ts`
```diff
<<<<<<< HEAD
=======
      console.error("[CRITICAL DB ERROR] Crash d'écriture WatermelonDB.", dbError);
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/background-sync.service.ts`
```diff
<<<<<<< HEAD
=======
  console.log(`[OS Background Worker] Réveil de la tâche de synchronisation...`);

>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/mdns-scanner.service.ts`
```diff
<<<<<<< HEAD
=======
           console.log(`[mDNS Scanner] Serveur découvert sur ${fullUrl}`);

>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/mobile/src/services/pdf-generator.service.ts`
```diff
<<<<<<< HEAD
=======
      console.log(`[PDF Engine] Ordonnance générée avec succès : ${file.filePath}`);

>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
        "@nestjs/bullmq": "^11.0.4",
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/jwt": "^11.0.2",
        "@nestjs/mongoose": "^11.0.4",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@nestjs/schedule": "^6.1.1",
        "@nestjs/throttler": "^6.5.0",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
        "bullmq": "^5.71.0",
=======
        "@nestjs/common": "^11.0.0",
        "@nestjs/core": "^11.0.0",
        "@nestjs/platform-express": "^11.0.0",
        "@nestjs/platform-fastify": "^11.1.17",
        "@prisma/client": "^5.22.0",
        "axios": "^1.6.0",
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `package.json`
```diff
<<<<<<< HEAD
    "@types/supertest": "^7.2.0",
=======
>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
- `prisma/schema.prisma`
```diff
<<<<<<< HEAD
=======
enum MedicationAdministrationStatus {
  ADMINISTERED
  REFUSED
  OMITTED
  PARTIAL
}

>>>>>>> pr_41
>>>>>>> pr_41
```
**Recommandation de résolution :**
  - **Schéma Prisma :** Unir les nouveaux modèles ou champs ajoutés dans la PR avec ceux existants sur main, sans en supprimer aucun. Si un enum ou un modèle est ajouté des deux côtés, combiner les valeurs.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

## [PR #39: Pull Request #39](https://github.com/jbrandonp/awesome-humanoid-hardware-guide/pull/39)
- **Branche de base :** `main`
- **Branche source :** `pr_39` (locale)

### Fichiers en conflit :
- `apps/api/src/app/auth/auth.controller.ts`
```diff
<<<<<<< HEAD
=======
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('request-otp')
  async requestOtp(@Body() body: { phone: string }) {
    if (!body.phone) {
      throw new Error('Phone number is required');
    }
    return this.authService.requestOtp(body.phone);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone: string; otp: string }) {
    if (!body.phone || !body.otp) {
      throw new Error('Phone number and OTP are required');
    }
    return this.authService.verifyOtp(body.phone, body.otp);
  }

>>>>>>> pr_39
>>>>>>> pr_39
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/auth/auth.service.ts`
```diff
<<<<<<< HEAD
=======
  async requestOtp(phone: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient) {
      throw new UnauthorizedException('Patient non trouvé avec ce numéro.');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.patient.update({
      where: { phone },
      data: { otp, otpExpiresAt },
    });

    // In a real scenario, integrate with SMS/WhatsApp provider here
    console.log(`[OTP] Generated OTP ${otp} for phone ${phone}`);

    return { message: 'OTP envoyé avec succès.' };
  }

  async verifyOtp(phone: string, otp: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { phone },
    });

    if (!patient || !patient.otp || !patient.otpExpiresAt) {
      throw new UnauthorizedException('OTP invalide ou expiré.');
    }

    if (patient.otp !== otp || patient.otpExpiresAt < new Date()) {
      throw new UnauthorizedException('OTP invalide ou expiré.');
    }

    // Clear OTP after successful validation
    await this.prisma.patient.update({
      where: { phone },
      data: { otp: null, otpExpiresAt: null },
    });

    // PWA users authenticate as a PATIENT role (or similar)
    // Here we'll just return a standard login payload using their ID
    return this.login(patient.id, 'PATIENT');
  }

... (et d'autres conflits)
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `apps/api/src/app/engagement/engagement.controller.ts`
```diff
<<<<<<< HEAD
=======
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
        }>;
>>>>>>> pr_39
>>>>>>> pr_39
```
**Recommandation de résolution :**
  - **Action recommandée générale :** Combiner les blocs de code en conflit. Examiner attentivement les changements métier. Si les deux branches ajoutent des éléments indépendants (nouvelles fonctions, nouveaux cas), conserver les deux ajouts.

- `package-lock.json`
```diff
<<<<<<< HEAD
    "apps/desktop/node_modules/@nozbe/with-observables": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/@nozbe/with-observables/-/with-observables-1.6.0.tgz",
      "integrity": "sha512-X/qGRBrmXLBVP3pqGQKD461UNx4sKfNoKWe4dlM/Gvtd12BOmv+nYOxw8PXiUr28yXxVYi03LpwDBd+JFo1Adg==",
      "license": "MIT",
      "dependencies": {
        "hoist-non-react-statics": "^3.3.2"
      },
      "peerDependencies": {
        "@types/hoist-non-react-statics": "^3.3.1",
        "@types/react": "^16||^17||^18",
        "react": "^16||^17||^18"
      },
      "peerDependenciesMeta": {
        "@types/hoist-non-react-statics": {
          "optional": true
        },
        "@types/react": {
          "optional": true
        }
      }
    },
=======
>>>>>>> pr_39
>>>>>>> pr_39
```
**Recommandation de résolution :**
  - **Modules/Providers :** Fusionner les listes (ex: `imports`, `providers`, `controllers`) en conservant les éléments de `HEAD` et en y ajoutant ceux de la branche entrante.
  - **Dépendances (`package.json`) :** Fusionner manuellement les versions de packages dans `package.json`, puis exécuter `npm install` pour régénérer le fichier `package-lock.json` sans conflit.
