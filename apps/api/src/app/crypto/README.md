# CryptoModule & Key Rotation Service

Ce module (et son service utilitaire `KeyRotationService`) permet de gérer le chiffrement (Encryption-at-Rest) de manière granulaire des champs ultra-sensibles, comme les notes psychiatriques ou autres données médicales PHI, au sein de la base de données. 

Conformément aux normes de sécurité, une base chiffrée n'est sécurisée que si la clé de chiffrement tourne régulièrement.

## Architecture DEK vs KEK

L'architecture s'appuie sur le principe de l'enveloppe cryptographique (Envelope Encryption) :

1. **DEK (Data Encryption Key)** : 
   - C'est la clé de chiffrement des données (AES-256-GCM). 
   - Elle est utilisée en mémoire vive par `KeyRotationService` pour déchiffrer et rechiffrer directement les `EncryptedPayload`.
   - Les DEK sont stockées de façon chiffrée.

2. **KEK (Key Encryption Key)** :
   - C'est la "Master Key" (Clé Maître) qui sert uniquement à chiffrer et déchiffrer les DEK.
   - Elle n'est jamais exposée ni stockée en base de données. 
   - Elle réside dans un système de gestion de clés externe.

## Intégration KMS / Vault en architecture "Offline-First"

Notre architecture exige que le système fonctionne parfaitement même sans connexion Internet (Offline-First). L'intégration KMS (Key Management System) doit donc être réfléchie pour ne pas introduire un Point-of-Failure lié au réseau.

### HashiCorp Vault (Mode Local)

Pour les déploiements hors-ligne (ex: Raspberry Pi, ou serveurs locaux dans une clinique rurale), **HashiCorp Vault** peut être configuré en tant que service local fonctionnant en parallèle du backend NestJS. 

- **Démarrage** : Au démarrage, l'administrateur ou un processus sécurisé de l'OS déverrouille (unseal) le Vault local (soit par Shamir's Secret Sharing, soit par un auto-unseal via TPM/HSM matériel ou via clé USB sécurisée).
- **Accès NestJS** : L'API NestJS s'authentifie sur `localhost:8200` (ex: via token ou AppRole) pour récupérer les KEK. 
- **Rotation** : Lors de la rotation, l'API demande à Vault de générer une nouvelle version de la KEK.

### AWS KMS (Mode Connecté)

Pour les serveurs cloud ou les appareils synchronisés de façon régulière, AWS KMS peut être utilisé :

- **Mise en cache** : Afin de respecter l'Offline-First, AWS KMS ne doit pas être sollicité pour *chaque* lecture de base de données. 
- Le backend NestJS fera appel à KMS (via l'action `kms:Decrypt`) au démarrage de l'application (ou lors du déverrouillage de session) pour obtenir le DEK en clair et le conserver de manière sécurisée en mémoire.
- **Rotation KMS** : On utilise l'Alias AWS KMS. Lors de la rotation, AWS KMS génère un nouveau CMK (Customer Master Key) sous le même Alias. L'API NestJS génère une nouvelle DEK (Data Key), demande à KMS de la chiffrer, puis lance le `KeyRotationService.rotateKeys`.

## Procédure de rotation (KeyRotationService)

Le `KeyRotationService.rotateKeys()` est conçu pour permettre une rotation *sans interruption de service majeure*.

1. **Recherche** : Le service stream (via un Cursor) l'ensemble des enregistrements ciblant la version actuelle de la clé (`keyVersion = oldVersion`).
2. **Déchiffrement** : Le contenu chiffré (`ciphertext`, `iv`, `tag`) est déchiffré avec l'ancienne DEK.
3. **Rechiffrement** : Le contenu est immédiatement rechiffré avec la nouvelle DEK et tagué avec le `newVersion`.
4. **Mise à jour Atomique** : Le service sauvegarde la donnée via l'opérateur MongoDB `$set`, avec une condition stricte sur `keyVersion: oldVersion`. Cela garantit que si un utilisateur modifie cette même note *pendant* la rotation (concurrent edit), la rotation échouera silencieusement pour ce document, évitant d'écraser la nouvelle donnée clinique par une vieille version juste rechiffrée. Le service de synchronisation ou une passe ultérieure de rotation s'occupera de traiter ce cas.
