import type { UserConfig } from 'tsdown';

import { SOURCE_CONDITION } from './source-condition.ts';

/** Shared tsdown options. A package config spreads this and sets its own `entry`. */
export const baseConfig: UserConfig = {
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    // Rolldown inlines `process.env.NODE_ENV` for browser builds; consumers' bundlers must see it
    define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
    dts: true,
    // Keeps one output file per source file, so `sideEffects` can name files
    unbundle: true,
    exports: { devExports: SOURCE_CONDITION },
    publint: true,
    attw: { profile: 'esm-only', level: 'error' },
};
