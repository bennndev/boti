/** Contract between the app and the Botiquin Rive file (view model `BotiquinVM`). */

export const MASCOT_FILE = "/rive/botiquin.riv";
export const MASCOT_STATE_MACHINE = "State Machine 1";

/** Values of the `mode` enum (`BotiquinMode`). These persist until changed. */
export const MASCOT_MODES = [
  "idle",
  "thinking",
  "listening",
  "working",
  "warning",
  "sleeping",
] as const;

export type MascotMode = (typeof MASCOT_MODES)[number];

/**
 * One-shot reactions (view model triggers). They interrupt the current state,
 * play once, then the machine returns to whatever `mode` says. `appear`
 * replays the entrance animation.
 */
export interface MascotHandle {
  success(): void;
  error(): void;
  appear(): void;
}
