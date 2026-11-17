import { writable, type Writable } from '@dakumisu/reactivity';

import { damp } from '#maths/interpolate.ts';

import { deferredPromise, type DeferredPromise } from './deferredPromise.ts';

const NOOP = () => {};
const NOOP_PROMISE = () => Promise.resolve(null);
// Lag smoothing: a frame gap over 500ms counts as 33ms
const LAG_THRESHOLD_MS = 500;
const LAG_ADJUSTED_MS = 33;
let uid = 0;

type TaskPromise = (() => Promise<unknown>) | Promise<unknown>;

export interface SubTask {
    readonly id: string;
    readonly details?: Readonly<Record<string, unknown>>;
    isComplete: boolean;
}

type ProgressListener = (progress: number, queue: Queue, task: Task, subtask?: SubTask) => void;

type TaskOptions = {
    id?: string;
    weigth?: number;
    onComplete?: (task: Task) => void;
    onError?: (error: unknown) => void;
};

export class Task {
    public id: string;
    public weigth: number;
    public onComplete: (task: Task) => void;
    public onError: (error: unknown) => void;
    public isTask: boolean;
    public promise: TaskPromise;
    public subtasks: SubTask[];
    public share: number;
    public isComplete: boolean;
    public queue: Queue | null;
    public result: unknown;

    constructor(promise: TaskPromise = NOOP_PROMISE, opts: TaskOptions = {}) {
        opts = opts || {};

        this.id = `task-${opts.id ?? uid++}`;
        this.weigth = opts.weigth ?? 1;
        this.onComplete = opts.onComplete ?? NOOP;
        this.onError = opts.onError ?? NOOP;

        this.isTask = true;
        this.promise = promise;
        this.subtasks = [];
        this.share = 0;
        this.isComplete = false;
        this.queue = null;
        this.result = null;
    }

    /** Applies `opts` to a task made before its queue, such as a `deferredTask()`. */
    configure(opts: TaskOptions): this {
        if (opts.id !== undefined) {
            this.id = `task-${opts.id}`;
        }
        if (opts.weigth !== undefined) {
            this.weigth = opts.weigth;
        }
        if (opts.onComplete) {
            this.onComplete = opts.onComplete;
        }
        if (opts.onError) {
            this.onError = opts.onError;
        }
        return this;
    }

    public readonly subtask = (
        id: string,
        promise: PromiseLike<unknown>,
        details?: SubTask['details'],
    ): void => {
        const subtask: SubTask = { id, details, isComplete: false };
        this.subtasks.push(subtask);

        const settle = () => {
            subtask.isComplete = true;
            if (this.isComplete) {
                return;
            }
            const settled = this.subtasks.filter((s) => s.isComplete).length;
            this.share = Math.max(this.share, settled / this.subtasks.length);
            this.queue?.refresh(this, subtask);
        };
        promise.then(settle, settle);
    };

    async load(
        onComplete: (task: Task) => void = NOOP,
        onError: (error: unknown) => void = NOOP,
    ): Promise<this> {
        if (this.isComplete) {
            return this;
        }

        try {
            this.result =
                typeof this.promise === 'function' ? await this.promise() : await this.promise;

            this.share = 1;
            this.isComplete = true;
            this.onComplete(this);
            onComplete(this);
        } catch (error) {
            this.onError(error);
            onError(error);
            throw error;
        }

        return this;
    }
}

export interface DeferredTask extends Task, Pick<DeferredPromise<void>, 'resolve' | 'reject'> {
    readonly promise: Promise<void>;
}

/** The type of `task.subtask`, for loaders that add their assets to a task. */
export type AddSubtask = Task['subtask'];

export class Queue {
    public _isQueue: boolean;
    public id: string;
    public tasks: Task[];
    public pending: Task[];
    public isComplete: Writable<boolean>;
    public isReallyComplete: Writable<boolean>;
    public isLoading: boolean;
    public isReallyLoading: boolean;
    public progress: Writable<number>;
    public smoothProgress: Writable<number>;
    public length: number;
    public complete: DeferredPromise<this>;
    public onStart: (cb: (queue: Queue) => void | Promise<void>) => void;
    public onProgress: (cb: ProgressListener) => void;
    public onComplete: (cb: (queue: Queue) => void) => void;
    public onRealComplete: (cb: (queue: Queue) => void) => void;
    public createTask: Queue['task'];

    private _onStart: Array<(queue: Queue) => void | Promise<void>>;
    private _onProgress: Array<ProgressListener>;
    private _onComplete: Array<(queue: Queue) => void>;
    private _onRealComplete: Array<(queue: Queue) => void>;

    // 0 while stopped: `requestAnimationFrame` ids start at 1
    private _rafId: number = 0;
    private _lastTime: number = 0;

    // `requestAnimationFrame` needs the same reference on every frame, so this cannot be re-bound per call.
    private readonly _tick = (time: number): void => {
        const elapsed = time - this._lastTime;
        this._lastTime = time;
        // Schedule first: `updateProgress` may stop the ticker at the end of the same frame
        this._rafId = requestAnimationFrame(this._tick);
        this.updateProgress(elapsed > LAG_THRESHOLD_MS ? LAG_ADJUSTED_MS : elapsed);
    };

    private _startTicker(): void {
        if (this._rafId !== 0) {
            return;
        }
        this._lastTime = performance.now();
        this._rafId = requestAnimationFrame(this._tick);
    }

    private _stopTicker(): void {
        cancelAnimationFrame(this._rafId);
        this._rafId = 0;
    }

    /** `deltaTime` is the time since the last frame, in milliseconds. */
    private updateProgress(deltaTime: number): void {
        this.smoothProgress.set(
            damp(this.smoothProgress.get(), this.progress.get(), 0.1, deltaTime),
        );

        if (this.smoothProgress.get() >= 1) {
            this._stopTicker();
            this.smoothProgress.set(1);
        }
    }

    constructor({ id = `${uid++}` }: { id?: string } = {}) {
        this._isQueue = true;

        this.id = 'queue-' + id;
        this.tasks = [];
        this.pending = [];

        this.isComplete = writable(false);
        this.isReallyComplete = writable(false);

        this.isLoading = false;
        this.isReallyLoading = false;

        this.progress = writable(0);
        this.smoothProgress = writable(0);
        this.length = 0;
        this.complete = deferredPromise<this>();

        this._onStart = [];
        this._onProgress = [];
        this._onComplete = [];
        this._onRealComplete = [];

        this.onStart = (cb: (queue: Queue) => void | Promise<void>) => {
            if (typeof cb === 'function') {
                this._onStart.push(cb);
            }
        };
        this.onProgress = (cb: ProgressListener) => {
            if (typeof cb === 'function') {
                this._onProgress.push(cb);
            }
        };
        this.onComplete = (cb: (queue: Queue) => void) => {
            if (typeof cb === 'function') {
                this._onComplete.push(cb);
            }
        };
        this.onRealComplete = (cb: (queue: Queue) => void) => {
            if (typeof cb === 'function') {
                this._onRealComplete.push(cb);
            }
        };

        this.task = this.task.bind(this);
        this.createTask = this.task.bind(this);
    }

    task(promise: TaskPromise | Task = NOOP_PROMISE, opts: TaskOptions = {}): Promise<unknown> {
        const task = promise instanceof Task ? promise.configure(opts) : new Task(promise, opts);
        this.add(task);
        return typeof task.promise === 'function' ? task.promise() : task.promise;
    }

    fakeTask(ms: number = 500, weigth: number = 1): Queue {
        const promise = () => new Promise<void>((resolve) => setTimeout(resolve, ms));
        const task = new Task(promise, { id: 'fake-task', weigth });
        return this.add(task);
    }

    add(task: Task): this {
        if (!task.isTask) {
            throw new Error('Task must be an instance of Task');
        }
        if (this.tasks.includes(task)) {
            return this;
        }

        this.tasks.push(task);
        this.length += task.weigth;
        task.queue = this;

        return this;
    }

    /**
     * Recomputes `progress` over the running tasks: a settled one in full, a pending one by its
     * share.
     */
    refresh(task: Task, subtask?: SubTask): void {
        if (!this.pending.includes(task)) {
            return;
        }

        let loaded = 0;
        let total = 0;
        for (let i = 0; i < this.pending.length; i++) {
            const t = this.pending[i];
            loaded += t.weigth * (t.isComplete ? 1 : t.share);
            total += t.weigth;
        }
        this.progress.set(loaded / total);
        for (const cb of this._onProgress) {
            cb(this.progress.get(), this, task, subtask);
        }
    }

    async start(): Promise<this | undefined> {
        if (this.isLoading || this.isComplete.get()) {
            return undefined;
        }
        this.isLoading = true;

        this.progress.set(0);
        this._startTicker();

        for (const cb of this._onStart) {
            await cb(this);
        }

        this.pending = this.tasks.filter((task: Task) => !task.isComplete);

        try {
            await Promise.all(
                this.pending.map((task: Task) => task.load(() => this.refresh(task))),
            );
        } catch (error) {
            this._stopTicker();
            throw error;
        }

        this.isReallyComplete.set(true);
        for (const cb of this._onRealComplete) {
            cb(this);
        }
        this.isReallyLoading = false;
        this.progress.set(1);

        // Wait for the damped progress to reach 1 so the completion is smooth
        this.smoothProgress.watch(
            (value: number) => {
                if (value >= 1) {
                    this._stopTicker();
                    this.smoothProgress.set(1);
                    this.isComplete.set(true);
                    this.isLoading = false;
                    for (const cb of this._onComplete) {
                        cb(this);
                    }
                    this.complete.resolve(this);
                }
            },
            { immediate: true },
        );

        return this;
    }
}

export function createQueue(options: { id?: string } = {}): Queue {
    return new Queue(options);
}

export function createTask(promise: TaskPromise = NOOP_PROMISE, opts: TaskOptions = {}): Task {
    return new Task(promise, opts);
}

export function deferredTask(): DeferredTask {
    const { promise, resolve, reject } = deferredPromise<void>();
    return Object.assign(new Task(promise), { promise, resolve, reject });
}
