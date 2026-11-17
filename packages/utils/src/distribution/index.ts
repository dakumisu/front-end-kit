/** Seeded dart-throwing over a rectangle, with no DOM and no three. */

/** A seeded PRNG (mulberry32): uniform numbers in [0, 1), the same for the same seed. */
export function createRandom(seed: number): () => number {
    let a = seed;

    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** A box, whose diagonal is its size. */
export type DistributionItem = { width: number; height: number };

export type DistributionOptions<T extends DistributionItem> = {
    random: () => number;
    /** The rectangle's size, in the items' unit. */
    width: number;
    height: number;
    /** Of its own width and height, how far past an edge an item's centre may land. */
    bleed: number;
    /** The caller's test on a dart's centre, such as areas to keep clear. */
    accept: (x: number, y: number, item: T) => boolean;
    /** Mean sizes kept between two items' centres, to start with. Default 2. */
    spacing?: number;
    /** What `spacing` is multiplied by after every `missesPerRelax` misses. Default 0.95. */
    relax?: number;
    missesPerRelax?: number;
    /** Below this spacing, an item with no room after `maxDarts` more darts is dropped. Default 0.5. */
    minSpacing?: number;
    maxDarts?: number;
};

export type DistributionResult = {
    /** Each item's centre, in the items' order, or null when it was dropped. */
    points: ({ x: number; y: number } | null)[];
    /** The lowest spacing any item relaxed to. */
    spacing: number;
};

/**
 * Throws darts for each item, in the given order (tightest first), until one passes `accept()` and keeps
 * `spacing` mean sizes from every placed item. Misses relax the spacing; an item with no room is dropped.
 */
export function distribute<T extends DistributionItem>(
    items: readonly T[],
    options: DistributionOptions<T>,
): DistributionResult {
    const {
        random,
        width,
        height,
        bleed,
        accept,
        spacing: initialSpacing = 2,
        relax = 0.95,
        missesPerRelax = 100,
        minSpacing = 0.5,
        maxDarts = 2000,
    } = options;
    const points: ({ x: number; y: number } | null)[] = [];
    // x, y and size of every placed item
    const placed: number[] = [];
    let lowest = initialSpacing;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const size = Math.hypot(item.width, item.height);
        const bleedX = bleed * item.width;
        const bleedY = bleed * item.height;
        let spacing = initialSpacing;
        let misses = 0;
        let lateDarts = 0;
        let x: number;
        let y: number;
        let isPlaced = false;

        for (;;) {
            x = random() * (width + 2 * bleedX) - bleedX;
            y = random() * (height + 2 * bleedY) - bleedY;

            let isClear = accept(x, y, item);

            for (let j = 0; isClear && j < placed.length; j += 3) {
                const dx = x - placed[j];
                const dy = y - placed[j + 1];
                const gap = (spacing * (size + placed[j + 2])) / 2;

                if (dx * dx + dy * dy < gap * gap) {
                    isClear = false;
                }
            }

            if (isClear) {
                isPlaced = true;
                break;
            }

            if (++misses === missesPerRelax) {
                spacing *= relax;
                misses = 0;
            }

            if (spacing < minSpacing && ++lateDarts > maxDarts) {
                break;
            }
        }

        lowest = Math.min(lowest, spacing);

        if (isPlaced) {
            placed.push(x, y, size);
            points.push({ x, y });
        } else {
            points.push(null);
        }
    }

    return { points, spacing: lowest };
}
