# Intégration Native de SQLCipher pour WatermelonDB dans React Native (Expo)

L'implémentation de `SecurityManager.ts` récupère une clé AES-256 via les enclaves sécurisées. Cependant, WatermelonDB utilise par défaut SQLite standard. Pour activer le chiffrement, il faut substituer SQLite par **SQLCipher** côté natif.

## 1. Côté iOS (Podfile / Objective-C)

### a. Modification de l'injection des dépendances (Podfile)
Dans le fichier `ios/Podfile`, il faut surcharger la dépendance SQLite de WatermelonDB pour utiliser SQLCipher.
Ajoutez ce code avant le bloc `post_install` :

```ruby
# Override WatermelonDB SQLite with SQLCipher
pod 'WatermelonDB', :path => '../node_modules/@nozbe/watermelondb'
pod 'SQLCipher', '~> 4.5.5'
```

### b. Modification du Database Driver (C++)
WatermelonDB utilise un driver C++ (ou Objective-C++). Il faut éditer ou patcher `node_modules/@nozbe/watermelondb/native/ios/WatermelonDB/Database.cpp` (ou via un patch `patch-package`) pour appeler `sqlite3_key` après l'ouverture de la connexion :

```cpp
#include <sqlite3.h> // Ensure this resolves to SQLCipher's header

// Inside the database open function (e.g., Database::Database)
int status = sqlite3_open_v2(path.c_str(), &_db, SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX, nullptr);

if (status == SQLITE_OK) {
    // encryptionKey is the key passed from JS -> JSI/NativeBridge
    const char* key = encryptionKey.c_str();
    sqlite3_key(_db, key, strlen(key));
}
```

## 2. Côté Android (build.gradle / Java)

### a. Remplacement de la librairie native (build.gradle)
Dans `android/app/build.gradle`, forcez l'utilisation de `android-database-sqlcipher` :

```gradle
dependencies {
    // ...
    implementation "net.zetetic:android-database-sqlcipher:4.5.4@aar"
    implementation "androidx.sqlite:sqlite:2.2.0"
}
```

### b. Modification du Database Driver (Java)
Dans le code source Java de WatermelonDB (souvent dans `Database.java` de l'adapter Android), il faut utiliser le package `net.zetetic.database.sqlcipher.SQLiteDatabase` au lieu de `android.database.sqlite.SQLiteDatabase`.

```java
import net.zetetic.database.sqlcipher.SQLiteDatabase;

// Inside the connection open method:
// String encryptionKey = ... (Retrieved from JS context)
SQLiteDatabase.loadLibs(context);
SQLiteDatabase db = SQLiteDatabase.openOrCreateDatabase(dbPath, encryptionKey, null);
```

## 3. Communication JS -> Natif

Dans le fichier `apps/mobile/src/database.ts`, nous avons utilisé l'approche suivante :

```typescript
;(adapter as any)._encryptionKey = encryptionKey;
```

Cela nécessite soit :
1. De forker `@nozbe/watermelondb` pour accepter officiellement une `key` dans les options de `SQLiteAdapterOptions` et de le transmettre aux modules natifs (via `NativeModules.DatabaseBridge`).
2. De créer un module natif React Native personnalisé (`EncryptionBridge`) qui ouvre la connexion SQLCipher *avant* d'initialiser WatermelonDB, et de passer le `dbPath` à WatermelonDB.

## 4. Recommandation Expo (EAS Build)
Puisque le projet utilise Expo (Bare Workflow ou Expo Modules), l'approche recommandée pour la maintenabilité est de créer un **Expo Config Plugin** local (`app.plugin.js`) qui va automatiquement appliquer ces modifications (les dépendances Gradle et Podfile) lors de la phase de `prebuild`. Cela évite de commiter les dossiers `ios` et `android`.