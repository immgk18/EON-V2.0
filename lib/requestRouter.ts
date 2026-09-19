"use client";

/*
 * ============================================================
 * EON 2.0 — REQUEST ROUTER V2
 * Enhanced Operations Network
 * ============================================================
 *
 * Central traffic controller for EON requests.
 *
 * User
 *   ↓
 * Request Router
 *   ↓
 * ┌──────────┬──────────┬───────────┬──────────┐
 * │  LOCAL   │    AI    │   WEB     │  VISION  │
 * └──────────┴──────────┴───────────┴──────────┘
 *                  │
 *              AGENTS / TOOLS
 *
 * Request Router v2 adds:
 *
 * - Central request classification
 * - Speed Engine integration
 * - Local routing
 * - AI routing
 * - Heavy task routing
 * - Web routing foundation
 * - Vision routing foundation
 * - Agent routing foundation
 * - Tool routing foundation
 * - Priority classification
 *
 * Routing is now connected to the EON execution layer for AI, web,
 * deterministic tools, specialist agents and backend vision endpoints.
 * ============================================================
 */

import {
  routeRequest,
  type ProcessingRoute,
  type RequestPriority,
  type SpeedDecision,
} from "./speedEngine";


/*
 * ============================================================
 * REQUEST DESTINATIONS
 * ============================================================
 */

export type RequestDestination =
  | "LOCAL"
  | "AI"
  | "HEAVY_AI"
  | "WEB"
  | "VISION"
  | "AGENT"
  | "TOOLS";


/*
 * ============================================================
 * ROUTER RESULT
 * ============================================================
 */

export type RequestRouterResult = {
  original: string;
  normalized: string;

  destination: RequestDestination;

  speedRoute: ProcessingRoute;
  priority: RequestPriority;

  requiresAI: boolean;
  requiresTool: boolean;

  reason: string;

  speedDecision: SpeedDecision;
};


/*
 * ============================================================
 * KEYWORD GROUPS
 * ============================================================
 *
 * These are routing signals only.
 * Actual capabilities will be connected later.
 * ============================================================
 */

const WEB_KEYWORDS = [
  "search the web",
  "search online",
  "browse the web",
  "browse online",
  "look online",
  "look it up",
  "look this up",
  "find online",
  "search online",
  "latest news",
  "latest information",
  "current news",
  "current information",
  "today's news",
  "what happened today",
  "recent news",
  "recent update",
  "latest update",
  "live information",
  "current price",
  "current weather",
  "website",
  "web search",
  "internet",
];


const VISION_KEYWORDS = [
  "analyze this image",
  "analyze the image",
  "analyze image",
  "analyze this photo",
  "analyze the photo",
  "analyze photo",
  "look at this image",
  "look at the image",
  "look at this photo",
  "look at the photo",
  "what is in this image",
  "what is in the image",
  "what does this image show",
  "what does the image show",
  "read this image",
  "read the image",
  "read this screenshot",
  "read the screenshot",
  "image analysis",
  "vision analysis",
  "visual analysis",
];


const AGENT_KEYWORDS = [
  "create a project",
  "build a project",
  "build an app",
  "create an app",
  "develop an app",
  "develop a website",
  "build a website",
  "build a system",
  "create a system",
  "automate this",
  "automate the task",
  "do this for me",
  "handle this for me",
  "complete this task",
  "finish this task",
  "execute this workflow",
  "run this workflow",
  "multi step",
  "multi-step",
  "step by step",
  "plan and execute",
  "research and build",
  "research then build",
  "design and build",
];


const TOOL_KEYWORDS = [
  "calculate",
  "calculate this",
  "convert",
  "summarize this file",
  "read this file",
  "analyze this file",
  "analyze this document",
  "open this file",
  "process this file",
  "process the data",
  "analyze the data",
  "create a file",
  "generate a file",
  "make a pdf",
  "make a document",
  "create a spreadsheet",
  "create an excel",
  "create a presentation",
];


const HEAVY_TASK_KEYWORDS = [
  "complex analysis",
  "deep analysis",
  "deep research",
  "large project",
  "full project",
  "complete application",
  "complete system",
  "architecture",
  "simulation",
  "engineering analysis",
  "engineering design",
  "scientific computation",
  "machine learning",
  "train a model",
  "train an ai",
  "computer vision",
  "data science",
  "large dataset",
  "optimize the system",
  "debug the entire",
  "refactor the entire",
];


/*
 * ============================================================
 * NORMALIZATION
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


/*
 * ============================================================
 * KEYWORD MATCHING
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


/*
 * ============================================================
 * DESTINATION CLASSIFICATION
 * ============================================================
 *
 * Priority:
 *
 * 1. Vision
 * 2. Web
 * 3. Agent
 * 4. Tools
 * 5. Heavy AI
 * 6. Local
 * 7. Fast AI
 * 8. Normal AI
 *
 * This prevents a complex request from accidentally being
 * classified as a simple local request.
 * ============================================================
 */

function determineDestination(
  normalized: string,
  speedDecision: SpeedDecision
): RequestDestination {

  /*
   * ----------------------------------------------------------
   * VISION
   * ----------------------------------------------------------
   */

  if (
    containsKeyword(
      normalized,
      VISION_KEYWORDS
    )
  ) {
    return "VISION";
  }


  /*
   * ----------------------------------------------------------
   * WEB
   * ----------------------------------------------------------
   */

  if (
    containsKeyword(
      normalized,
      WEB_KEYWORDS
    )
  ) {
    return "WEB";
  }


  /*
   * ----------------------------------------------------------
   * AGENTS
   * ----------------------------------------------------------
   */

  if (
    containsKeyword(
      normalized,
      AGENT_KEYWORDS
    )
  ) {
    return "AGENT";
  }


  /*
   * ----------------------------------------------------------
   * TOOLS
   * ----------------------------------------------------------
   */

  if (
    containsKeyword(
      normalized,
      TOOL_KEYWORDS
    )
  ) {
    return "TOOLS";
  }


  /*
   * ----------------------------------------------------------
   * HEAVY AI
   * ----------------------------------------------------------
   */

  if (
    speedDecision.route ===
      "HEAVY_TASK" ||
    containsKeyword(
      normalized,
      HEAVY_TASK_KEYWORDS
    )
  ) {
    return "HEAVY_AI";
  }


  /*
   * ----------------------------------------------------------
   * LOCAL
   * ----------------------------------------------------------
   */

  if (
    speedDecision.route ===
    "LOCAL"
  ) {
    return "LOCAL";
  }


  /*
   * ----------------------------------------------------------
   * FAST AI
   * ----------------------------------------------------------
   */

  if (
    speedDecision.route ===
    "FAST_AI"
  ) {
    return "AI";
  }


  /*
   * ----------------------------------------------------------
   * DEFAULT
   * ----------------------------------------------------------
   */

  return "AI";
}


/*
 * ============================================================
 * ROUTER REASON
 * ============================================================
 */

function getRoutingReason(
  destination: RequestDestination,
  speedDecision: SpeedDecision
): string {

  switch (
    destination
  ) {

    case "LOCAL":
      return "Request can be handled locally without an AI request.";


    case "AI":
      return "Request requires EON AI reasoning.";


    case "HEAVY_AI":
      return "Request requires deeper AI processing or a complex workflow.";


    case "WEB":
      return "Request requires current web or online information.";


    case "VISION":
      return "Request appears to require visual or image understanding.";


    case "AGENT":
      return "Request appears to require a multi-step autonomous workflow.";


    case "TOOLS":
      return "Request appears to require an external tool or file operation.";


    default:
      return `Routed using ${speedDecision.route}.`;
  }
}


/*
 * ============================================================
 * MAIN ROUTER
 * ============================================================
 */

export function routeUserRequest(
  input: string
): RequestRouterResult {

  const original =
    input.trim();


  const normalized =
    normalizeInput(
      input
    );


  /*
   * Empty request
   */

  if (!normalized) {

    const emptySpeedDecision =
      routeRequest("");


    return {
      original,
      normalized,

      destination:
        "LOCAL",

      speedRoute:
        emptySpeedDecision.route,

      priority:
        emptySpeedDecision.priority,

      requiresAI:
        false,

      requiresTool:
        false,

      reason:
        "No request received.",

      speedDecision:
        emptySpeedDecision,
    };
  }


  /*
   * ----------------------------------------------------------
   * SPEED ENGINE
   * ----------------------------------------------------------
   */

  const speedDecision =
    routeRequest(
      original
    );


  /*
   * ----------------------------------------------------------
   * DESTINATION
   * ----------------------------------------------------------
   */

  const destination =
    determineDestination(
      normalized,
      speedDecision
    );


  /*
   * ----------------------------------------------------------
   * REQUIREMENTS
   * ----------------------------------------------------------
   */

  const requiresAI =
    destination === "AI" ||
    destination === "HEAVY_AI" ||
    destination === "WEB" ||
    destination === "VISION" ||
    destination === "AGENT";


  const requiresTool =
    destination === "TOOLS" ||
    destination === "WEB" ||
    destination === "VISION" ||
    destination === "AGENT";


  /*
   * ----------------------------------------------------------
   * REASON
   * ----------------------------------------------------------
   */

  const reason =
    getRoutingReason(
      destination,
      speedDecision
    );


  return {
    original,
    normalized,

    destination,

    speedRoute:
      speedDecision.route,

    priority:
      speedDecision.priority,

    requiresAI,

    requiresTool,

    reason,

    speedDecision,
  };
}


/*
 * ============================================================
 * ROUTE LABEL
 * ============================================================
 */

export function getRouteLabel(
  result: RequestRouterResult
): string {

  switch (
    result.destination
  ) {

    case "LOCAL":
      return "LOCAL";


    case "AI":
      return "AI";


    case "HEAVY_AI":
      return "HEAVY AI";


    case "WEB":
      return "WEB";


    case "VISION":
      return "VISION";


    case "AGENT":
      return "AGENT";


    case "TOOLS":
      return "TOOLS";


    default:
      return "AI";
  }
}


/*
 * ============================================================
 * ROUTE DESCRIPTION
 * ============================================================
 */

export function getRouteDescription(
  result: RequestRouterResult
): string {

  return (
    `${getRouteLabel(result)} ROUTE • ` +
    `${result.priority} PRIORITY • ` +
    `${result.reason}`
  );
}


/*
 * ============================================================
 * ROUTER STATUS
 * ============================================================
 */

export function getRequestRouterStatus() {

  return {
    engine:
      "EON Request Router",

    version:
      "2.0",

    status:
      "online",

    destinations: [
      "LOCAL",
      "AI",
      "HEAVY_AI",
      "WEB",
      "VISION",
      "AGENT",
      "TOOLS",
    ],

    capabilities: {
      localRouting: true,
      aiRouting: true,
      heavyTaskRouting: true,
      webRouting: true,
      visionRouting: true,
      agentRouting: true,
      toolRouting: true,
    },

    execution:
      "connected_execution",

    note:
      "Web grounding, deterministic tools, specialist agents and backend vision execution are connected. Image upload is exposed by the Vision workspace.",
  };
}


/*
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default routeUserRequest;
