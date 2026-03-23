# Guide d'Implémentation : Certificate Pinning (Sécurisation Réseau Local)

Ce guide décrit la marche à suivre pour configurer le *Certificate Pinning* dans les applications clientes (React Native Mobile et Tauri Desktop). L'objectif est d'empêcher les attaques Man-in-the-Middle (MITM) sur le réseau local (LAN) de l'hôpital en forçant les clients à faire exclusivement confiance à notre Autorité de Certification locale (Root CA).

## Sommaire
- [1. Génération des certificats](#1-génération-des-certificats)
- [2. Configuration React Native (Mobile Android)](#2-configuration-react-native-mobile-android)
- [3. Configuration Tauri (Desktop)](#3-configuration-tauri-desktop)

---

## 1. Génération des certificats

Le projet utilise un script Node.js situé dans `tools/scripts/generate-local-certs.js` pour créer une CA locale et un certificat SSL/TLS pour l'API.

Pour générer ou renouveler les certificats :
```bash
node tools/scripts/generate-local-certs.js
```
Cette commande créera un dossier `certs/` à la racine contenant :
- `ca.crt` : Le certificat de la CA (à distribuer aux clients).
- `ca.key` : La clé privée de la CA (à garder secrète).
- `server.crt` : Le certificat du serveur (utilisé par NestJS/NGINX).
- `server.key` : La clé privée du serveur (utilisée par NestJS/NGINX).

---

## 2. Configuration React Native (Mobile Android)

Dans React Native, sur Android, la sécurité des communications (notamment avec `fetch` ou `axios`) est gérée au niveau de l'OS via le fichier `network_security_config.xml`.

### Étape 2.1 : Ajouter le certificat CA aux ressources de l'application
Copiez le fichier `certs/ca.crt` généré précédemment et renommez-le `ca_cert.pem`. Placez-le dans le dossier `res/raw` de votre application Android :
```
apps/mobile/android/app/src/main/res/raw/ca_cert.pem
```
*(Créez le dossier `raw` s'il n'existe pas).*

### Étape 2.2 : Configurer le `network_security_config.xml`
Créez ou modifiez le fichier `apps/mobile/android/app/src/main/res/xml/network_security_config.xml` :

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Configurez l'adresse IP de votre serveur local ici (ex: 192.168.1.50) -->
    <domain-config>
        <domain includeSubdomains="true">192.168.X.X</domain>
        <trust-anchors>
            <!-- L'application fera uniquement confiance à notre CA locale pour ce domaine -->
            <certificates src="@raw/ca_cert"/>
        </trust-anchors>
    </domain-config>

    <!-- Alternative: Pinning par clé publique (Plus restrictif) -->
    <!--
    <domain-config>
        <domain includeSubdomains="true">192.168.X.X</domain>
        <pin-set expiration="2028-01-01">
            <pin digest="SHA-256">BASE64_DE_VOTRE_CLE_PUBLIQUE</pin>
        </pin-set>
    </domain-config>
    -->
</network-security-config>
```
*Remplacez `192.168.X.X` par l'IP de votre serveur NestJS local.*

### Étape 2.3 : Déclarer le fichier dans l'AndroidManifest.xml
Assurez-vous que l'application utilise cette configuration réseau dans `apps/mobile/android/app/src/main/AndroidManifest.xml` :

```xml
<application
    ...
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

## 3. Configuration Tauri (Desktop)

Pour l'application Tauri, les requêtes HTTP (si elles sont effectuées depuis le backend Rust pour éviter les problèmes de CORS ou pour plus de sécurité) peuvent utiliser la crate `reqwest` en injectant le certificat CA de confiance.

### Étape 3.1 : Inclure le certificat au build
Placez le fichier `ca.crt` généré dans un emplacement accessible par l'application Tauri (ex. `apps/desktop/src-tauri/certs/ca.crt`).

### Étape 3.2 : Configurer `reqwest` dans Rust (`apps/desktop/src-tauri/src/main.rs` ou `http.rs`)

```rust
use reqwest::{Client, Certificate};
use std::fs::File;
use std::io::Read;

fn create_secure_client() -> Result<Client, Box<dyn std::error::Error>> {
    // Lire le certificat CA local
    let mut buf = Vec::new();
    File::open("certs/ca.crt")?.read_to_end(&mut buf)?;

    // Créer un objet Certificate à partir du fichier PEM
    let cert = Certificate::from_pem(&buf)?;

    // Construire le client reqwest en forçant l'utilisation de cette CA racine
    // Cela empêchera les attaques MITM même si un certificat invalide est présenté
    let client = Client::builder()
        .add_root_certificate(cert)
        // Optionnel : Forcer le nom de domaine s'il ne correspond pas exactement (ex: IP)
        // .danger_accept_invalid_hostnames(true)
        .build()?;

    Ok(client)
}
```
*Ce client Rust sera utilisé pour toutes les communications sécurisées (via des Tauri Commands) avec l'API NestJS locale.*

---

## Vérification

Pour vérifier que le pinning fonctionne :
1. Démarrez le serveur NestJS en HTTPS en utilisant `certs/server.key` et `certs/server.crt`.
2. Lancez l'application cliente configurée.
3. Si un proxy MITM (comme Charles Proxy ou Burp Suite) tente d'intercepter le trafic avec son propre certificat auto-signé, la connexion **doit** être rejetée par le client (Android `TrustAnchor` échouera, ou `reqwest` retournera une erreur de validation de certificat).
