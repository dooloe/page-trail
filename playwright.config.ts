import { defineConfig } from '@playwright/test';

const browserName = process.env.PAGE_TRAIL_BROWSER === 'firefox' ? 'firefox' : 'chromium';

export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [{ name: browserName, use: { browserName } }],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
