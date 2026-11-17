import { defineConfig } from 'oxfmt';

export default defineConfig({
    tabWidth: 4,
    singleQuote: true,
    printWidth: 100,
    ignorePatterns: [
        /* Changesets writes these */
        '**/CHANGELOG.md',
        'pnpm-lock.yaml',
        /* Project docs keep `*(user)*` markers, which oxfmt rewrites to `_(user)_` */
        'DECISIONS.md',
        'DECISIONS-DETAILS.md',
        'PROGRESS.md',
        'TODO.md',
        'ROADMAP.md',
    ],
    /* Mirrors Astro's compressHTML so same-line spaces in markup stay as text, not `{' '}` */
    astro: { compressHTML: 'html' },
    sortImports: {
        /* A comment between imports starts a new block; imports never move across it */
        partitionByComment: true,
        groups: [
            'builtin',
            'external',
            ['internal', 'subpath'],
            ['parent', 'sibling', 'index'],
            'style',
            'unknown',
        ],
    },
    overrides: [{ files: ['*.yaml', '*.yml'], options: { tabWidth: 2 } }],
});
