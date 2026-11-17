import { map, type MapStore } from '@dakumisu/reactivity';

import { simplex2D } from '#maths/noise.ts';
import { clamp, normalize } from '#maths/range.ts';

export type Vec2 = { x: number; y: number };
export type Size = { width: number; height: number };

/** Pointer position in pixels, and the same position as 0..1 progress across the container. */
export type FakePointerState = { x: number; y: number; normalizedX: number; normalizedY: number };

/** A number applies to both axes. */
export type FakePointerOptions = {
    speed?: number | Vec2; // time multiplier, default 0.5
    scale?: number | Vec2; // noise amplitude, default 0.75
    offset?: number | Vec2; // from center, normalized [-0.5, 0.5], default 0
    range?: number | Vec2; // 1 = full container, default 0.75
    seed?: number | Vec2; // default random per instance, in [0, 100)
    size?: Size; // fixed size; no tracking
    target?: Element; // tracks its content box with a ResizeObserver
    autoUpdate?: boolean; // default true
};

/** The options `set` can change while the pointer runs. */
export type FakePointerSettings = Omit<FakePointerOptions, 'size' | 'target'>;

export type FakePointer = {
    $pointer: MapStore<FakePointerState>;
    start: () => void;
    stop: () => void;
    reset: () => void;
    isActive: () => boolean;
    set: (settings: FakePointerSettings) => void;
    setSize: (size: Size) => void;
    update: (time: number) => void; // ms, a rAF timestamp
};

type Resolved = {
    speed: Vec2;
    scale: Vec2;
    offset: Vec2;
    range: Vec2;
    seed: Vec2;
    autoUpdate: boolean;
};

type SizeSource = { attach: () => void; detach: () => void };

const toVec2 = (value: number | Vec2): Vec2 => {
    return typeof value === 'number' ? { x: value, y: value } : { ...value };
};

const resolve = (settings: FakePointerSettings, base: Resolved): Resolved => ({
    speed: toVec2(settings.speed ?? base.speed),
    scale: toVec2(settings.scale ?? base.scale),
    offset: toVec2(settings.offset ?? base.offset),
    range: toVec2(settings.range ?? base.range),
    seed: toVec2(settings.seed ?? base.seed),
    autoUpdate: settings.autoUpdate ?? base.autoUpdate,
});

// A container with no size yet (a ResizeObserver has not reported) rests at the middle
const progress = (value: number, extent: number): number => {
    return extent > 0 ? normalize(value, 0, extent) : 0.5;
};

const trackTarget = (target: Element, onSize: (size: Size) => void): SizeSource => {
    let observer: ResizeObserver | null = null;

    return {
        attach: () => {
            observer = new ResizeObserver((entries) => {
                const rect = entries.at(-1)?.contentRect;
                if (rect) {
                    onSize({ width: rect.width, height: rect.height });
                }
            });
            observer.observe(target);
        },
        detach: () => {
            observer?.disconnect();
            observer = null;
        },
    };
};

const trackWindow = (onSize: (size: Size) => void): SizeSource => {
    const onResize = (): void => onSize({ width: innerWidth, height: innerHeight });

    return {
        attach: () => {
            onResize();
            addEventListener('resize', onResize, { passive: true });
        },
        detach: () => removeEventListener('resize', onResize),
    };
};

/**
 * Pointer that drifts on its own along simplex noise, for demos and idle states.
 * It starts right away. Client only: it needs `requestAnimationFrame` and a size source.
 * The size comes from `size`, else from `target`, else from the window.
 */
export const createFakePointer = (options?: FakePointerOptions): FakePointer => {
    const size: Size = { width: options?.size?.width ?? 0, height: options?.size?.height ?? 0 };
    const noise = simplex2D();
    const defaults: Resolved = {
        speed: { x: 0.5, y: 0.5 },
        scale: { x: 0.75, y: 0.75 },
        offset: { x: 0, y: 0 },
        range: { x: 0.75, y: 0.75 },
        seed: { x: Math.random() * 100, y: Math.random() * 100 },
        autoUpdate: true,
    };
    let settings = resolve(options ?? {}, defaults);
    let active = false;
    let frame: number | null = null;

    const $pointer = map<FakePointerState>({
        x: size.width * 0.5,
        y: size.height * 0.5,
        normalizedX: 0.5,
        normalizedY: 0.5,
    });

    const setSize = (next: Size): void => {
        size.width = next.width;
        size.height = next.height;
    };

    // A given size is fixed, so it has no source to track
    const source: SizeSource | null = options?.size
        ? null
        : options?.target
          ? trackTarget(options.target, setSize)
          : trackWindow(setSize);

    // In place with one forced notify: a watcher runs once per frame, and no object is allocated
    const write = (x: number, y: number, normalizedX: number, normalizedY: number): void => {
        const state = $pointer.value;
        state.x = x;
        state.y = y;
        state.normalizedX = normalizedX;
        state.normalizedY = normalizedY;
        $pointer.set(state, true);
    };

    const update = (time: number): void => {
        if (!active) {
            return;
        }

        const t = time * 0.001;
        const { speed, scale, offset, range, seed } = settings;
        const noiseX = noise(t * speed.x + seed.x, seed.x) * scale.x;
        const noiseY = noise(t * speed.y + seed.y, seed.y) * scale.y;
        const x = clamp(
            size.width * (0.5 + offset.x) + noiseX * range.x * size.width,
            0,
            size.width,
        );
        const y = clamp(
            size.height * (0.5 + offset.y) + noiseY * range.y * size.height,
            0,
            size.height,
        );

        write(x, y, progress(x, size.width), progress(y, size.height));

        if (settings.autoUpdate) {
            frame = requestAnimationFrame(update);
        }
    };

    const start = (): void => {
        if (active) {
            return;
        }
        active = true;
        source?.attach();
        if (settings.autoUpdate) {
            frame = requestAnimationFrame(update);
        }
    };

    const stop = (): void => {
        if (!active) {
            return;
        }
        active = false;
        if (frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
        }
        source?.detach();
    };

    const reset = (): void => {
        stop();
        write(size.width * 0.5, size.height * 0.5, 0.5, 0.5);
    };

    const set = (next: FakePointerSettings): void => {
        settings = resolve(next, settings);
    };

    start();

    return { $pointer, start, stop, reset, isActive: () => active, set, setSize, update };
};
