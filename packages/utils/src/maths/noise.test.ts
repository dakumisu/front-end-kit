import { describe, expect, it } from 'vitest';

import { createRandom } from '#distribution/index.ts';

import { simplex2D } from './noise.ts';

const sampleGrid = (noise: (x: number, y: number) => number): number[] => {
    const values: number[] = [];
    for (let y = 0; y < 20; y++) {
        for (let x = 0; x < 20; x++) {
            values.push(noise(x * 0.37, y * 0.37));
        }
    }
    return values;
};

describe('simplex2D', () => {
    it('gives the same values for the same seed', () => {
        const a = sampleGrid(simplex2D(createRandom(1)));
        const b = sampleGrid(simplex2D(createRandom(1)));
        expect(a).toEqual(b);
    });

    it('gives different values for different seeds', () => {
        const a = sampleGrid(simplex2D(createRandom(1)));
        const b = sampleGrid(simplex2D(createRandom(2)));
        expect(a).not.toEqual(b);
    });

    it('stays within [-1, 1]', () => {
        const noise = simplex2D(createRandom(1));
        for (let y = 0; y < 100; y++) {
            for (let x = 0; x < 100; x++) {
                const value = noise(-10 + x * 0.2, -10 + y * 0.2);
                expect(value).toBeGreaterThanOrEqual(-1);
                expect(value).toBeLessThanOrEqual(1);
            }
        }
    });
});
