"use client";

/*
 * ============================================================
 * EON 2.0 — COMMAND ENGINE
 * Enhanced Operations Network
 * ============================================================
 *
 * Responsible for:
 * - Understanding basic EON commands
 * - Detecting command intent
 * - Routing commands to the correct action
 *
 * This is intentionally modular so future agents,
 * web intelligence, vision, engineering and AI reasoning
 * can plug into the same command pipeline.
 * ============================================================
 */

export type CommandIntent =
  | "MODE_NO_LIMITS"
  | "MODE_NORMAL"
  | "SYSTEM_STATUS"
  | "CURRENT_MODE"
  | "RESET"
  | "HELP"
  | "STOP"
  | "GENERAL";

export type CommandResult = {
  intent: CommandIntent;
  original: string;
  normalized: string;
  message: string;
};

function normalizeCommand(command: string): string {
  return command
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function processCommand(
  command: string
): CommandResult {
  const original = command.trim();
  const normalized = normalizeCommand(command);

  if (!normalized) {
    return {
      intent: "GENERAL",
      original,
      normalized,
      message: "No command received.",
    };
  }

  /*
   * ==========================================================
   * NO LIMITS MODE
   * ==========================================================
   */

  if (
    normalized.includes("eon has no limits") ||
    normalized.includes("activate no limits") ||
    normalized.includes("enter no limits") ||
    normalized.includes("enable no limits") ||
    normalized.includes("activate operator mode")
  ) {
    return {
      intent: "MODE_NO_LIMITS",
      original,
      normalized,
      message: "No Limits mode activation requested.",
    };
  }

  /*
   * ==========================================================
   * NORMAL MODE
   * ==========================================================
   */

  if (
    normalized.includes("eon has limits") ||
    normalized.includes("activate normal mode") ||
    normalized.includes("activate normal") ||
    normalized.includes("restore normal mode") ||
    normalized.includes("return to normal mode") ||
    normalized.includes("disable no limits") ||
    normalized.includes("exit no limits") ||
    normalized.includes("eon has limits")
  ) {
    return {
      intent: "MODE_NORMAL",
      original,
      normalized,
      message: "Normal mode restoration requested.",
    };
  }

  /*
   * ==========================================================
   * SYSTEM STATUS
   * ==========================================================
   */

  if (
    normalized.includes("system status") ||
    normalized.includes("system state") ||
    normalized.includes("status report") ||
    normalized === "status" ||
    normalized === "status eon" ||
    normalized.includes("how is the system")
  ) {
    return {
      intent: "SYSTEM_STATUS",
      original,
      normalized,
      message: "System status request detected.",
    };
  }

  /*
   * ==========================================================
   * CURRENT MODE
   * ==========================================================
   */

  if (
    normalized.includes("what mode are you in") ||
    normalized.includes("what mode are you") ||
    normalized.includes("current mode") ||
    normalized.includes("which mode are you in") ||
    normalized.includes("are you in alert mode") ||
    normalized.includes("are you in normal mode")
  ) {
    return {
      intent: "CURRENT_MODE",
      original,
      normalized,
      message: "Current mode request detected.",
    };
  }

  /*
   * ==========================================================
   * RESET
   * ==========================================================
   */

  if (
    normalized === "reset" ||
    normalized === "reset eon" ||
    normalized.includes("reset system") ||
    normalized.includes("reset eon system")
  ) {
    return {
      intent: "RESET",
      original,
      normalized,
      message: "EON reset requested.",
    };
  }

  /*
   * ==========================================================
   * HELP
   * ==========================================================
   */

  if (
    normalized === "help" ||
    normalized.includes("what can you do") ||
    normalized.includes("show commands") ||
    normalized.includes("list commands") ||
    normalized.includes("available commands")
  ) {
    return {
      intent: "HELP",
      original,
      normalized,
      message: "Command help requested.",
    };
  }

  /*
   * ==========================================================
   * STOP
   * ==========================================================
   */

  if (
    normalized === "stop" ||
    normalized === "stop speaking" ||
    normalized === "be quiet" ||
    normalized === "silence"
  ) {
    return {
      intent: "STOP",
      original,
      normalized,
      message: "Speech stop requested.",
    };
  }

  /*
   * ==========================================================
   * GENERAL COMMAND
   * ==========================================================
   *
   * These commands will later be routed to the AI brain,
   * web agent, vision agent, engineering agent, etc.
   */

  return {
    intent: "GENERAL",
    original,
    normalized,
    message: "General command detected.",
  };
}

export function getHelpMessage(): string {
  return [
    "Available EON commands.",
    "System status.",
    "Current mode.",
    "Activate No Limits mode.",
    "Activate normal mode.",
    "EON has no limits.",
    "EON has limits.",
    "Reset EON.",
    "Stop speaking.",
    "General commands will be routed to the AI brain.",
  ].join(" ");
}

export default processCommand;
