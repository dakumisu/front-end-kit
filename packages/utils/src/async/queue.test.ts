// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { damp } from '#maths/interpolate.ts';

import { createQueue, deferredTask } from './queue.ts';

describe('Queue with fake timers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('completes two fake tasks and ends on progress 1', async () => {
        const queue = createQueue().fakeTask(10).fakeTask(10);
        void queue.start();

        await vi.advanceTimersByTimeAsync(5000);
        await queue.complete.promise;

        expect(queue.progress.get()).toBe(1);
        expect(queue.smoothProgress.get()).toBe(1);
        expect(queue.isComplete.get()).toBe(true);
    });

    it('reports half the progress when one of two equal tasks is done', async () => {
        const queue = createQueue().fakeTask(10).fakeTask(100);
        void queue.start();

        await vi.advanceTimersByTimeAsync(50);

        expect(queue.progress.get()).toBe(0.5);
        expect(queue.isComplete.get()).toBe(false);
    });

    it('stops asking for frames once complete', async () => {
        const queue = createQueue().fakeTask(10);
        void queue.start();

        await vi.advanceTimersByTimeAsync(5000);

        expect(vi.getTimerCount()).toBe(0);
    });
});

describe('Queue ticker', () => {
    let frames: Map<number, FrameRequestCallback>;
    let nextId: number;
    let now: number;
    let requestFrame: ReturnType<typeof vi.fn>;

    // Runs the one pending frame at `time`, the way the browser would
    const runFrame = (time: number): void => {
        const [id, callback] = [...frames][0];
        frames.delete(id);
        callback(time);
    };

    beforeEach(() => {
        frames = new Map();
        nextId = 1;
        now = 0;
        requestFrame = vi.fn((callback: FrameRequestCallback) => {
            frames.set(nextId, callback);
            return nextId++;
        });
        vi.stubGlobal('requestAnimationFrame', requestFrame);
        vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
        vi.spyOn(performance, 'now').mockImplementation(() => now);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('starts one loop however many times it is asked to start', () => {
        const queue = createQueue();

        queue['_startTicker']();
        queue['_startTicker']();

        expect(requestFrame).toHaveBeenCalledTimes(1);
        expect(frames.size).toBe(1);
    });

    it('cancels the pending frame on stop and can start again', () => {
        const queue = createQueue();

        queue['_startTicker']();
        queue['_stopTicker']();
        expect(frames.size).toBe(0);

        queue['_startTicker']();
        expect(frames.size).toBe(1);
    });

    it('damps the smooth progress by the frame gap in milliseconds', () => {
        const queue = createQueue();
        queue['_startTicker']();
        queue.progress.set(1);

        runFrame(16);

        expect(queue.smoothProgress.get()).toBe(damp(0, 1, 0.1, 16));
    });

    it('counts a frame gap over 500ms as 33ms', () => {
        const queue = createQueue();
        queue['_startTicker']();
        queue.progress.set(1);
        runFrame(16);
        const before = queue.smoothProgress.get();

        runFrame(16 + 1000);

        expect(queue.smoothProgress.get()).toBe(damp(before, 1, 0.1, 33));
    });

    it('keeps a gap of exactly 500ms as it is', () => {
        const queue = createQueue();
        queue['_startTicker']();
        queue.progress.set(1);

        runFrame(500);

        expect(queue.smoothProgress.get()).toBe(damp(0, 1, 0.1, 500));
    });

    it('stops the loop when the smooth progress reaches 1, and keeps going before', () => {
        const queue = createQueue();
        queue['_startTicker']();
        queue.progress.set(1);

        runFrame(16);
        expect(frames.size).toBe(1);

        // damp snaps to 1 once it is within 0.0001, after a few hundred frames
        for (let time = 32; frames.size > 0 && time < 100_000; time += 16) {
            runFrame(time);
        }

        expect(frames.size).toBe(0);
        expect(queue.smoothProgress.get()).toBe(1);
    });

    it('stops the loop when a task fails', async () => {
        const queue = createQueue();
        const task = deferredTask();
        queue.add(task);
        const started = queue.start();
        const failed = expect(started).rejects.toThrow('boom');

        task.reject(new Error('boom'));
        await failed;

        expect(frames.size).toBe(0);
    });
});
