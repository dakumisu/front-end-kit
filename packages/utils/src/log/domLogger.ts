interface DomLogOptions {
    duration?: number; // Duration in milliseconds
}

type LogType = 'log' | 'info' | 'warn' | 'error' | 'debug';

const DEFAULT_DURATION = 5000; // 5 seconds

const LOG_COLORS = {
    log: '#ffffff',
    info: '#3399ff',
    warn: '#ffaa00',
    error: '#ff3333',
    debug: '#999999',
} as const;

const LOG_BG_COLORS = {
    log: 'rgba(0, 0, 0, 0.2)',
    info: 'rgba(51, 153, 255, 0.2)',
    warn: 'rgba(255, 170, 0, 0.2)',
    error: 'rgba(255, 51, 51, 0.2)',
    debug: 'rgba(153, 153, 153, 0.2)',
} as const;

const LOG_TYPE_ICONS = {
    log: null,
    info: '💡',
    warn: '⚠️',
    error: '🚨',
    debug: '🐞',
} as const;

let container: HTMLDivElement | null = null;

/**
 * Creates or returns the DOM log container
 */
function getContainer(): HTMLDivElement {
    if (!container) {
        container = document.createElement('div');
        container.id = 'dom-logger-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-width: 400px;
            pointer-events: none;
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            font-size: 14px;
        `;
        document.body.appendChild(container);
    }
    return container;
}

// Plain `String()` on purpose: an object that JSON cannot print falls back to its own toString
const toText = (value: unknown): string => String(value);

/**
 * Formats log arguments into a readable string
 */
function formatLogArgs(args: unknown[]): string {
    return args
        .map((arg) => {
            if (arg === null) {
                return 'null';
            }
            if (arg === undefined) {
                return 'undefined';
            }
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch {
                    return toText(arg);
                }
            }
            return toText(arg);
        })
        .join(' ');
}

/**
 * Creates a log element and adds it to the container
 */
function createLogElement(
    message: string,
    type: LogType = 'log',
    duration: number = DEFAULT_DURATION,
): void {
    const logContainer = getContainer();
    const logElement = document.createElement('div');
    const logTextElement = document.createElement('span');

    const color = LOG_COLORS[type];
    const bgColor = LOG_BG_COLORS[type];
    const icon = LOG_TYPE_ICONS[type];

    logElement.style.cssText = `
        background: ${bgColor};
        padding: 7px 14px;
        border: 1px solid ${color};
        border-radius: 6px;
        word-wrap: break-word;
        white-space: pre-wrap;
        opacity: 0;
        transform: translateX(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: auto;
        overflow-y: clip auto;
    `;

    logTextElement.style.cssText = `
        color: ${color};
    `;

    logTextElement.textContent = icon ? `${icon} • ${message}` : message;
    logElement.appendChild(logTextElement);
    logContainer.appendChild(logElement);

    // Trigger animation
    requestAnimationFrame(() => {
        logElement.style.opacity = '1';
        logElement.style.transform = 'translateX(0)';
    });

    // Remove after duration
    setTimeout(() => {
        logElement.style.opacity = '0';
        logElement.style.transform = 'translateX(20px)';
        setTimeout(() => {
            if (logElement.parentNode) {
                logElement.parentNode.removeChild(logElement);
            }
            // Remove container if empty
            if (container && container.children.length === 0) {
                container.remove();
                container = null;
            }
        }, 300); // Wait for fade out animation
    }, duration);
}

/**
 * Checks if a value is an options object, such as `{ duration: 1000 }`
 */
function isDomLogOptions(value: unknown): value is DomLogOptions {
    return (
        value !== null && typeof value === 'object' && !Array.isArray(value) && 'duration' in value
    );
}

function domLogBase(...argsOrOptions: unknown[]): void {
    let logArgs: unknown[];
    let options: DomLogOptions | undefined;

    // Check if last arg is an options object
    const lastArg = argsOrOptions[argsOrOptions.length - 1];
    if (isDomLogOptions(lastArg)) {
        options = lastArg;
        logArgs = argsOrOptions.slice(0, -1);
    } else {
        logArgs = argsOrOptions;
    }

    const message = formatLogArgs(logArgs);
    const duration = options?.duration ?? DEFAULT_DURATION;
    createLogElement(message, 'log', duration);
}

/**
 * Creates typed log methods (info, warn, error, debug)
 */
function createTypedLogMethod(type: LogType) {
    return (...args: unknown[]): void => {
        let logArgs: unknown[];
        let options: DomLogOptions | undefined;

        // Check if last arg is an options object
        const lastArg = args[args.length - 1];
        if (isDomLogOptions(lastArg)) {
            options = lastArg;
            logArgs = args.slice(0, -1);
        } else {
            logArgs = args;
        }

        const message = formatLogArgs(logArgs);
        const duration = options?.duration ?? DEFAULT_DURATION;
        createLogElement(message, type, duration);
    };
}

/**
 * DOM logger function that displays logs directly on the page
 * @param args - Values to log
 * @param options - Optional configuration
 * @param options.duration - Duration in milliseconds before log disappears (default: 5000)
 *
 * @example
 * domLog('Hello world');
 * domLog('Custom duration', { duration: 10000 });
 * domLog.info('Info message');
 * domLog.error('Error message');
 */
export interface DomLog {
    (...args: unknown[]): void;
    (args: unknown[], options?: DomLogOptions): void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
}

export const domLog: DomLog = Object.assign(domLogBase, {
    info: createTypedLogMethod('info'),
    warn: createTypedLogMethod('warn'),
    error: createTypedLogMethod('error'),
    debug: createTypedLogMethod('debug'),
});
