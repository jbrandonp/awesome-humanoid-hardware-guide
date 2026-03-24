const { withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Un plugin Expo minimal pour injecter SQLCipher à la place de SQLite
// lors du "prebuild" (expo prebuild)
const withSqlcipher = (config) => {
  return withSqlcipherAndroid(withSqlcipherIos(config));
};

const withSqlcipherAndroid = (config) => {
  return withAppBuildGradle(config, (config) => {
    // Remplacement de sqlite par sqlcipher dans les dépendances Gradle de l'application
    if (config.modResults.language === 'groovy') {
      let buildGradle = config.modResults.contents;

      const sqlcipherDependency = `
    // Injecté par withSqlcipher.js
    implementation "net.zetetic:android-database-sqlcipher:4.5.4@aar"
    implementation "androidx.sqlite:sqlite:2.2.0"
`;

      if (!buildGradle.includes('android-database-sqlcipher')) {
          // On insère nos dépendances juste avant la fin du bloc dependencies
          buildGradle = buildGradle.replace(/dependencies\s*{/, `dependencies {\n${sqlcipherDependency}`);
          config.modResults.contents = buildGradle;
      }
    }
    return config;
  });
};

const withSqlcipherIos = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfile = fs.readFileSync(podfilePath, 'utf8');

        const sqlcipherPod = `
  # Injecté par withSqlcipher.js
  pod 'WatermelonDB', :path => '../node_modules/@nozbe/watermelondb'
  pod 'SQLCipher', '~> 4.5.5'
`;

        if (!podfile.includes("pod 'SQLCipher'")) {
             // Insère l'override avant le bloc post_install
             podfile = podfile.replace(/post_install\s+do\s+\|installer\|/, `${sqlcipherPod}\n  post_install do |installer|`);
             fs.writeFileSync(podfilePath, podfile);
        }
      }
      return config;
    },
  ]);
};

module.exports = withSqlcipher;