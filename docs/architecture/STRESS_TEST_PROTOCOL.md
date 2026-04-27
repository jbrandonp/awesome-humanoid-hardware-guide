# Protocoles de Test d'Épreuve du Feu (Hostile Environments)

L'objectif de ces tests est de certifier que le "Système de Santé Résilient V3.0" ne perdra aucune donnée et ne crashera pas dans les pires conditions matérielles et réseaux possibles (Cliniques de brousse, connexion capricieuse, matériel obsolète).

---

## 1. Stress Test Windows 7 & RAM (Protocol Humain)

**Objectif :** Valider la stricte consommation mémoire imposée par le design "Low-Resource" (< 2.1 Go max).

**Pré-requis Matériel :**

- Un PC physique ou une Machine Virtuelle (VM) exécutant Windows 7 SP1.
- Allocation de mémoire bloquée à **4 Go de RAM** maximum.
- L'installateur `.exe` compilé de Tauri (WebView2 v109 Fixed Runtime intégré).

### Déroulement du test :

1. Démarrer le PC, laisser l'OS se stabiliser. Ouvrir le **Gestionnaire des tâches** (Task Manager).
2. Installer et lancer l'application Desktop "Système de Santé Résilient". Vérifier que l'interface "Zen" (Flat design, sans ombres) s'affiche.
3. Noter la consommation mémoire initiale de l'application (devrait se situer ~150-200 Mo).
4. Ouvrir un dossier patient. Brancher un microphone.
5. Déclencher une dictée vocale (via `Whisper.cpp`). Parler pendant 30 secondes ("_Patient presents with severe malaria symptoms..._").
6. Pendant que Whisper traite l'audio en arrière-plan :
   - Brancher un câble réseau défectueux ou avec une latence énorme.
   - Forcer une synchronisation massive (Upload de 1000 faux dossiers ou radiographies).
7. **Observation :** Surveiller le Gestionnaire des tâches. Le processus Whisper.cpp (configuré avec `-t 2 -mc 0`) ne **doit jamais** dépasser 1.8 Go de RAM.
8. **Critère de Succès :** L'ordinateur ne doit pas geler (freeze), la dictée doit retourner le texte avec les médicaments extraits, et la synchronisation doit s'effectuer en arrière-plan sans "Out Of Memory Exception".

---

## 2. Test de Résilience CRDT Yjs (Double Tablette Hors-Ligne)

**Objectif :** S'assurer que le remplacement du protocole "Last-Write-Wins" (LWW) par la fusion CRDT (Yjs) garantit 0% de perte de notes cliniques.

**Pré-requis Matériel :**

- Deux tablettes Android (Tablet A et Tablet B) exécutant l'application Mobile compilée (`.apk`).
- Un serveur API tournant en local.

### Déroulement du test :

1. Connecter Tablet A et Tablet B au même réseau Wi-Fi local que le serveur.
2. Sur les deux tablettes, ouvrir le dossier du patient "Jean Dupont".
3. **Couper le routeur Wi-Fi** (simuler une panne totale de réseau de la clinique).
4. _Pendant la panne :_
   - Sur Tablet A, le Médecin 1 tape dans les notes cliniques : `Patient reçu pour douleurs abdominales. Prescription de Spasfon.`
   - Sur Tablet B, l'Infirmière 2 (qui est dans une autre pièce sans le savoir) modifie les notes du même patient : `Constantes relevées : Température 39°C. Frottis sanguin positif.`
5. Fermer l'application sur les deux tablettes.
6. Rallumer le routeur Wi-Fi.
7. Relancer l'application sur Tablet A. Elle effectuera un "Push" prioritaire via `BackgroundSyncQueue` vers PostgreSQL.
8. Relancer l'application sur Tablet B. Elle enverra son Push à son tour.
9. Attendre 15 secondes (pour que le cycle de Push/Pull CRDT soit terminé). Rafraîchir le dossier "Jean Dupont" sur les deux écrans.
10. **Critère de Succès :** Les notes des deux praticiens doivent apparaître conjointement à l'écran, sans écrasement (ex: `Patient reçu pour douleurs abdominales. Prescription de Spasfon. Constantes relevées : Température 39°C. Frottis sanguin positif.`).
