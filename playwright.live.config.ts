import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({ ...config, testDir: './tests/live', workers: 1,
  timeout: 90_000, retries: 0 });
