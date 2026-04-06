const fs = require('fs');
const filePath = 'apps/mobile/src/services/HighAlertMedicationService.spec.ts';
let content = fs.readFileSync(filePath, 'utf8');

// In attemptSync, when it's re-reading the queue:
// const currentQueueStr = await AsyncStorage.getItem(DUAL_SIGN_OFF_QUEUE_KEY);
// We need to return the expected values.
// In the 'single item' test:
content = content.replace(
  "vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue));",
  "vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue)).mockResolvedValueOnce(JSON.stringify(mockQueue));"
);

// In the 'multiple items' test:
content = content.replace(
  "// Initial queue\n      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue));\n      // Recursively called queue\n      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([mockQueue[1]]));",
  `// Initial queue
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue));
      // Re-read after 1st fetch
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue));
      // Next iteration read
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([mockQueue[1]]));
      // Re-read after 2nd fetch
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify([mockQueue[1]]));`
);

fs.writeFileSync(filePath, content);
