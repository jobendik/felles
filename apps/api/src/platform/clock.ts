// The one clock (AD-6). API and domain code receive a `Clock`; Date.now(), argument-less `new Date()`
// and performance.now() are lint-banned everywhere else.

export interface Clock {
  /** The current instant in epoch milliseconds. */
  now(): number;
}

/** The wall clock. */
export function systemClock(): Clock {
  return { now: () => Date.now() };
}

/**
 * A clock that starts at `startMs` and keeps advancing with the monotonic timer. This is what
 * `FELLES_NOW` sets up: a START instant, not a frozen one.
 */
export function advancingClock(startMs: number): Clock {
  const origin = performance.now();
  return { now: () => Math.floor(startMs + (performance.now() - origin)) };
}

/** A clock that tests can set and step (injected through `buildApp({ clock })`). */
export interface SteppableClock extends Clock {
  set(ms: number): void;
  advance(ms: number): void;
}

export function steppableClock(startMs: number): SteppableClock {
  let current = startMs;
  return {
    now: () => current,
    set(ms) {
      current = ms;
    },
    advance(ms) {
      current += ms;
    },
  };
}

/** A clock fixed at one instant. */
export function fixedClock(ms: number): Clock {
  return { now: () => ms };
}
