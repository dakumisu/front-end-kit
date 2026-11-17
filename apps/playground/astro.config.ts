import { defineConfig } from 'astro/config';
import { defaultClientConditions, defaultServerConditions } from 'vite';

import { SOURCE_CONDITION } from '../../source-condition.ts';

export default defineConfig({
    devToolbar: { enabled: false },
    vite: {
        resolve: {
            conditions: [SOURCE_CONDITION, ...defaultClientConditions],
        },
        ssr: {
            resolve: {
                conditions: [SOURCE_CONDITION, ...defaultServerConditions],
            },
        },
    },
});
