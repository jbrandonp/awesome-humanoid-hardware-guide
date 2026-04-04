const fs = require('fs');
const file = 'apps/mobile/src/components/SmartPenCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `    } else {
      // Le bloc est intentionnellement vide lors de la déconnexion
    }`;

const replaceStr = `    } else {
      // Sauvegarde du tracé en cours en cas de déconnexion brutale
      if (isPenDownRef.current && currentPathRef.current.length > 0) {
         commitCurrentPathToState();
      }
      isPenDownRef.current = false;
      lastPointRef.current = null;
    }`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Patched successfully');
} else {
  console.error('Search string not found');
}
