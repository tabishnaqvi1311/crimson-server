export type SlowOptions = {
    windowMs: number;
    delayAfter: number;
    delayMs: (hits: number) => number;
    maxDelayMs: number;
}