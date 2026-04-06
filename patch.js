const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import { DualSignOff } from '@systeme-sante/models';",
  "import { DualSignOff } from '@systeme-sante/models';\nimport { useConnectionStore } from '../stores/connection.store';"
);

content = content.replace(
  "    if (this.isSyncing) return;\n    this.isSyncing = true;",
  "    if (this.isSyncing) return;\n    this.isSyncing = true;\n\n    const connectionState = useConnectionStore.getState();\n    if (connectionState.status !== 'CONNECTED' || !connectionState.serverUrl) {\n      this.isSyncing = false;\n      return;\n    }"
);

content = content.replace(
  "const response = await fetch('http://localhost:3000/high-alert-medications/dual-sign-off', {",
  "const response = await fetch(`${connectionState.serverUrl}/high-alert-medications/dual-sign-off`, {"
);

fs.writeFileSync(filePath, content);
