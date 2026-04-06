const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

// In attemptSync, for loop item by item
// item 0: offlineHash is undefined in test mock (so it filters out everything!)
// Let's add offlineHash to the test mocks

content = content.replace(
  "const mockQueue = [{ primaryUserId: 'user1', medicationName: 'MedA' }];",
  "const mockQueue = [{ primaryUserId: 'user1', medicationName: 'MedA', offlineHash: 'hash1' }];"
);

content = content.replace(
  "const mockQueue = [\n        { primaryUserId: 'user1', medicationName: 'MedA' },\n        { primaryUserId: 'user2', medicationName: 'MedB' },\n      ];",
  `const mockQueue = [
        { primaryUserId: 'user1', medicationName: 'MedA', offlineHash: 'hash1' },
        { primaryUserId: 'user2', medicationName: 'MedB', offlineHash: 'hash2' },
      ];`
);

content = content.replace(
  "const mockQueue = [\n        { primaryUserId: 'user1', medicationName: 'MedA' },\n        { primaryUserId: 'user2', medicationName: 'MedB' },\n      ];\n      vi.mocked(AsyncStorage.getItem)",
  `const mockQueue = [
        { primaryUserId: 'user1', medicationName: 'MedA', offlineHash: 'hash1' },
        { primaryUserId: 'user2', medicationName: 'MedB', offlineHash: 'hash2' },
      ];
      vi.mocked(AsyncStorage.getItem)`
);

fs.writeFileSync(filePath, content);
