import { existsSync, readdirSync } from 'node:fs';

import { defaultClientConditions, defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';

import { SOURCE_CONDITION } from './source-condition.ts';

const packagesDir = `${import.meta.dirname}/packages`;

// packages/ is absent until the first `pnpm new`, and readdirSync throws on a missing folder.
const projects = existsSync(packagesDir)
    ? readdirSync(packagesDir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => ({
              extends: true,
              test: {
                  name: entry.name,
                  include: [`packages/${entry.name}/src/**/*.test.ts`],
              },
          }))
    : [];

export default defineConfig({
    resolve: {
        conditions: [SOURCE_CONDITION, ...defaultClientConditions],
    },
    ssr: {
        resolve: {
            conditions: [SOURCE_CONDITION, ...defaultServerConditions],
        },
    },
    test: {
        environment: 'node',
        passWithNoTests: true,
        // Vitest 5 rejects an empty projects array, so the root config runs alone until a package exists.
        projects: projects.length > 0 ? projects : undefined,
    },
});
