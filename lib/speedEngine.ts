"use client";

/*
 * ============================================================
 * EON 2.0 — SPEED ENGINE
 * Enhanced Operations Network
 * ============================================================
 *
 * Purpose:
 * - Classify requests before sending them to an AI model
 * - Execute instant local operations without network calls
 * - Prioritize requests
 * - Provide a foundation for streaming and parallel execution
 *
 * Architecture:
 *
 * User Request
 *      ↓
 * Speed Engine
 *      ↓
 * ┌──────────────┬───────────────┬───────────────┐
 * │ LOCAL        │ FAST AI       │ HEAVY TASK    │
 * │ <10ms        │ AI request    │ Agents/tools  │
 * └──────────────┴───────────────┴───────────────┘
 *
 * This module does NOT replace commandEngine.ts.
 * It sits above the command engine and decides how a request
 * should be processed.
 * ============================================================
 */

import {
  processCommand,
  type CommandIntent,
  type CommandResult,
} from "./commandEngine";


/* ============================================================
 * REQUEST TYPES
 * ============================================================
 */

export type ProcessingRoute =
  | "LOCAL"
  | "FAST_AI"
  | "HEAVY_TASK";


export type RequestPriority =
  | "INSTANT"
  | "HIGH"
  | "NORMAL"
  | "LOW";


export type SpeedDecision = {
  route: ProcessingRoute;
  priority: RequestPriority;
  command: CommandResult;
  shouldUseAI: boolean;
  shouldUseNetwork: boolean;
};


/* ============================================================
 * LOCAL COMMAND INTENTS
 *
 * These commands should never require an AI request.
 * ============================================================
 */

const LOCAL_INTENTS: CommandIntent[] = [
  "MODE_ALERT",
  "MODE_NORMAL",
  "SYSTEM_STATUS",
  "CURRENT_MODE",
  "RESET",
  "HELP",
  "STOP",
];


/* ============================================================
 * HEAVY TASK KEYWORDS
 *
 * These are requests that may eventually require agents,
 * tools, files, vision, engineering or long-running workflows.
 * ============================================================
 */

const HEAVY_TASK_KEYWORDS = [
  "analyze",
  "analyse",
  "research",
  "design",
  "engineer",
  "engineering",
  "simulate",
  "simulation",
  "calculate",
  "debug",
  "build",
  "develop",
  "create a project",
  "write a program",
  "write code",
  "analyze this file",
  "analyse this file",
  "analyze this image",
  "analyse this image",
  "compare these",
  "solve this problem",
  "deep analysis",
  "detailed analysis",
];


/* ============================================================
 * FAST AI KEYWORDS
 *
 * Short informational requests can be routed to the fast
 * AI path instead of the future heavy-agent pipeline.
 * ============================================================
 */

const FAST_AI_KEYWORDS = [
  "what is",
  "what are",
  "who is",
  "why",
  "how",
  "explain",
  "define",
  "meaning",
  "tell me",
  "summarize",
  "summary",
  "give me",
  "can you explain",
];


/* ============================================================
 * NORMALIZE INPUT
 * ============================================================
 */

function normalizeInput(
  input: string
): string {

  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}


/* ============================================================
 * KEYWORD DETECTION
 * ============================================================
 */

function containsKeyword(
  input: string,
  keywords: string[]
): boolean {

  return keywords.some(
    (keyword) =>
      input.includes(keyword)
  );
}


/* ============================================================
 * PRIORITY DETECTION
 * ============================================================
 */

function determinePriority(
  route: ProcessingRoute,
  input: string
): RequestPriority {

  const normalized =
    normalizeInput(input);


  if (route === "LOCAL") {
    return "INSTANT";
  }


  if (
    normalized.includes("urgent") ||
    normalized.includes("immediately") ||
    normalized.includes("asap")
  ) {
    return "HIGH";
  }


  if (route === "HEAVY_TASK") {
    return "NORMAL";
  }


  if (route === "FAST_AI") {
    return "HIGH";
  }


  return "NORMAL";
}


/* ============================================================
 * ROUTE REQUEST
 * ============================================================
 */

export function routeRequest(
  input: string
): SpeedDecision {

  const command =
    processCommand(input);


  const normalized =
    normalizeInput(input);


  /*
   * LOCAL ROUTE
   *
   * Existing EON commands are handled immediately.
   */

  if (
    LOCAL_INTENTS.includes(
      command.intent
    )
  ) {

    return {
      route: "LOCAL",
      priority: "INSTANT",
      command,
      shouldUseAI: false,
      shouldUseNetwork: false,
    };
  }


  /*
   * HEAVY TASK ROUTE
   *
   * Future agent/tool system will handle these.
   */

  if (
    containsKeyword(
      normalized,
      HEAVY_TASK_KEYWORDS
    )
  ) {

    return {
      route: "HEAVY_TASK",
      priority: determinePriority(
        "HEAVY_TASK",
        normalized
      ),
      command,
      shouldUseAI: true,
      shouldUseNetwork: true,
    };
  }


  /*
   * FAST AI ROUTE
   *
   * Simple questions go through the AI path.
   */

  if (
    containsKeyword(
      normalized,
      FAST_AI_KEYWORDS
    )
  ) {

    return {
      route: "FAST_AI",
      priority: determinePriority(
        "FAST_AI",
        normalized
      ),
      command,
      shouldUseAI: true,
      shouldUseNetwork: true,
    };
  }


  /*
   * DEFAULT
   *
   * General conversation currently goes to the AI.
   */

  return {
    route: "FAST_AI",
    priority: "NORMAL",
    command,
    shouldUseAI: true,
    shouldUseNetwork: true,
  };
}


/* ============================================================
 * LOCAL RESPONSE
 *
 * Returns a response immediately when no AI is required.
 * ============================================================
 */

export function getInstantResponse(
  decision: SpeedDecision
): string | null {

  if (
    decision.route !== "LOCAL"
  ) {
    return null;
  }


  return decision.command.message;
}


/* ============================================================
 * SPEED ENGINE STATUS
 * ============================================================
 */

export function getSpeedEngineStatus() {

  return {
    status: "ONLINE",
    engine: "EON Speed Engine",
    version: "1.0.0",

    routes: {
      local: "INSTANT",
      fastAI: "FAST",
      heavyTask: "AGENT",
    },

    architecture:
      "Route → Prioritize → Process → Verify → Respond",
  };
}


/* ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default routeRequest;
