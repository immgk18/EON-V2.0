"use client";

/*
 * ============================================================
 * EON 2.0 — REQUEST ROUTER
 * Enhanced Operations Network
 * ============================================================
 *
 * Architecture:
 *
 * User Request
 *      ↓
 * Command Engine
 *      ↓
 * Speed Engine
 *      ↓
 * Request Router
 *      ↓
 * ┌────────────┬────────────┬──────────────┐
 * │            │            │              │
 * LOCAL      FAST AI     HEAVY TASK      FUTURE
 * │            │            │              │
 * Instant     Gemini      Agents         Web
 * response    response    workflows      Vision
 *                                         Tools
 *
 * The Request Router is the central traffic controller
 * for EON's future intelligence architecture.
 *
 * IMPORTANT:
 * This module only decides where a request should go.
 * It does not pretend that future tools are already connected.
 * ============================================================
 */

import {
  routeRequest,
  type ProcessingRoute,
  type RequestPriority,
  type SpeedDecision,
} from "@/lib/speedEngine";


/* ============================================================
   ROUTE TYPES
   ============================================================ */

export type RequestDestination =
  | "LOCAL"
  | "AI"
  | "HEAVY_AI"
  | "WEB"
  | "VISION"
  | "AGENT"
  | "TOOLS";


export type RequestRouterResult = {
  original: string;
  normalized: string;

  destination: RequestDestination;

  speedRoute: ProcessingRoute;
  priority: RequestPriority;

  requiresAI: boolean;
  requiresTool: boolean;

  reason: string;
};


/* ============================================================
   NORMALIZATION
   ============================================================ */

function normalizeRequest(
  input: string
): string {

  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}


/* ============================================================
   KEYWORD DETECTION
   ============================================================ */

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
   WEB DETECTION
   ============================================================ */

const WEB_KEYWORDS = [
  "search the web",
  "search online",
  "search internet",
  "browse the web",
  "browse online",
  "look online",
  "look it up",
  "find online",
  "latest news",
  "latest information",
  "current news",
  "current information",
  "what is happening",
  "what happened today",
  "today's news",
  "recent news",
  "recent information",
  "website",
  "web search",
  "internet search",
];


/* ============================================================
   VISION DETECTION
   ============================================================ */

const VISION_KEYWORDS = [
  "analyze this image",
  "analyse this image",
  "analyze the image",
  "analyse the image",
  "look at this image",
  "look at the image",
  "inspect this image",
  "inspect the image",
  "image analysis",
  "photo analysis",
  "analyze this photo",
  "analyse this photo",
  "read this image",
  "read the image",
  "what is in this image",
  "what's in this image",
  "identify this image",
  "identify the object",
];


/* ============================================================
   AGENT DETECTION
   ============================================================ */

const AGENT_KEYWORDS = [
  "create an agent",
  "build an agent",
  "run an agent",
  "use an agent",
  "autonomous agent",
  "agent workflow",
  "agent task",
  "multi agent",
  "multi-agent",
  "autonomous workflow",
  "execute workflow",
  "run workflow",
];


/* ============================================================
   TOOL DETECTION
   ============================================================ */

const TOOL_KEYWORDS = [
  "open a file",
  "read a file",
  "create a file",
  "edit a file",
  "analyze a file",
  "generate a document",
  "create a document",
  "create a report",
  "generate a report",
  "calculate",
  "run calculation",
  "run code",
  "execute code",
  "process data",
  "analyze data",
  "analyse data",
];


/* ============================================================
   HEAVY TASK DETECTION
   ============================================================ */

const HEAVY_TASK_KEYWORDS = [
  "design a system",
  "design a circuit",
  "design an aircraft",
  "design a spacecraft",
  "design a satellite",
  "engineering analysis",
  "structural analysis",
  "thermal analysis",
  "fluid analysis",
  "simulation",
  "simulate",
  "optimization",
  "optimisation",
  "large dataset",
  "deep analysis",
  "detailed analysis",
  "complex calculation",
  "solve this engineering",
  "engineering problem",
  "scientific computation",
  "machine learning model",
  "train a model",
  "build a complete application",
  "build a complete system",
  "full application",
  "full system",
];


/* ============================================================
   PRIORITY HELPERS
   ============================================================ */

function getPriority(
  speedDecision: SpeedDecision
): RequestPriority {

  return speedDecision.priority;
}


/* ============================================================
   REQUEST ROUTER
   ============================================================ */

export function routeUserRequest(
  input: string
): RequestRouterResult {

  const original =
    input.trim();

  const normalized =
    normalizeRequest(input);


  /* ----------------------------------------------------------
     EMPTY REQUEST
     ---------------------------------------------------------- */

  if (!normalized) {

    return {
      original,
      normalized,

      destination: "LOCAL",

      speedRoute: "LOCAL",
      priority: "INSTANT",

      requiresAI: false,
      requiresTool: false,

      reason:
        "No request received.",
    };
  }


  /* ----------------------------------------------------------
     SPEED ENGINE
     ---------------------------------------------------------- */

  const speedDecision =
    routeRequest(
      original
    );


  const priority =
    getPriority(
      speedDecision
    );


  /* ----------------------------------------------------------
     VISION
     ---------------------------------------------------------- */

  if (
    containsKeyword(
      normalized,
      VISION_KEYWORDS
    )
  ) {

    return {
      original,
      normalized,

      destination: "VISION",

      speedRoute:
        speedDecision.route,

      priority,

      requiresAI: true,
      requiresTool: true,

      reason:
        "Request appears to require computer vision or image understanding.",
    };
  }


  /* ----------------------------------------------------------
     WEB
     ---------------------------------------------------------- */

  if (
    containsKeyword(
      normalized,
      WEB_KEYWORDS
    )
  ) {

    return {
      original,
      normalized,

      destination: "WEB",

      speedRoute:
        speedDecision.route,

      priority,

      requiresAI: true,
      requiresTool: true,

      reason:
        "Request appears to require current web or internet information.",
    };
  }


  /* ----------------------------------------------------------
     AGENT
     ---------------------------------------------------------- */

  if (
    containsKeyword(
      normalized,
      AGENT_KEYWORDS
    )
  ) {

    return {
      original,
      normalized,

      destination: "AGENT",

      speedRoute:
        speedDecision.route,

      priority,

      requiresAI: true,
      requiresTool: true,

      reason:
        "Request appears to require an autonomous or multi-step agent workflow.",
    };
  }


  /* ----------------------------------------------------------
     TOOLS
     ---------------------------------------------------------- */

  if (
    containsKeyword(
      normalized,
      TOOL_KEYWORDS
    )
  ) {

    return {
      original,
      normalized,

      destination: "TOOLS",

      speedRoute:
        speedDecision.route,

      priority,

      requiresAI: true,
      requiresTool: true,

      reason:
        "Request appears to require an external tool or computation capability.",
    };
  }


  /* ----------------------------------------------------------
     HEAVY AI
     ---------------------------------------------------------- */

  if (
    speedDecision.route ===
      "HEAVY_TASK" ||
    containsKeyword(
      normalized,
      HEAVY_TASK_KEYWORDS
    )
  ) {

    return {
      original,
      normalized,

      destination: "HEAVY_AI",

      speedRoute:
        "HEAVY_TASK",

      priority,

      requiresAI: true,
      requiresTool: false,

      reason:
        "Request appears complex and should use the heavy reasoning pipeline.",
    };
  }


  /* ----------------------------------------------------------
     LOCAL
     ---------------------------------------------------------- */

  if (
    speedDecision.route ===
    "LOCAL"
  ) {

    return {
      original,
      normalized,

      destination: "LOCAL",

      speedRoute:
        "LOCAL",

      priority,

      requiresAI: false,
      requiresTool: false,

      reason:
        "Request can be handled locally without an AI backend call.",
    };
  }


  /* ----------------------------------------------------------
     FAST AI
     ---------------------------------------------------------- */

  if (
    speedDecision.route ===
    "FAST_AI"
  ) {

    return {
      original,
      normalized,

      destination: "AI",

      speedRoute:
        "FAST_AI",

      priority,

      requiresAI: true,
      requiresTool: false,

      reason:
        "Request can be handled through the fast AI pipeline.",
    };
  }


  /* ----------------------------------------------------------
     DEFAULT AI
     ---------------------------------------------------------- */

  return {
    original,
    normalized,

    destination: "AI",

    speedRoute:
      speedDecision.route,

    priority,

    requiresAI: true,
    requiresTool: false,

    reason:
      "Request will be handled by the general EON AI pipeline.",
  };
}


/* ============================================================
   ROUTE DISPLAY
   ============================================================ */

export function getRouteLabel(
  destination: RequestDestination
): string {

  switch (
    destination
  ) {

    case "LOCAL":
      return "LOCAL";

    case "AI":
      return "FAST AI";

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


/* ============================================================
   ROUTE DESCRIPTION
   ============================================================ */

export function getRouteDescription(
  destination: RequestDestination
): string {

  switch (
    destination
  ) {

    case "LOCAL":
      return "Handled locally for instant response.";

    case "AI":
      return "Routed through the fast AI intelligence pipeline.";

    case "HEAVY_AI":
      return "Routed through the heavy reasoning pipeline.";

    case "WEB":
      return "Requires web intelligence and current information.";

    case "VISION":
      return "Requires visual or image understanding.";

    case "AGENT":
      return "Requires autonomous multi-step execution.";

    case "TOOLS":
      return "Requires an external tool or computation module.";

    default:
      return "Routed through EON intelligence.";
  }
}


/* ============================================================
   ROUTER STATUS
   ============================================================ */

export function getRequestRouterStatus() {

  return {

    status: "ONLINE",

    router:
      "EON Request Router",

    version:
      "1.0.0",

    architecture:
      "Command Engine → Speed Engine → Request Router",

    destinations: [
      "LOCAL",
      "AI",
      "HEAVY_AI",
      "WEB",
      "VISION",
      "AGENT",
      "TOOLS",
    ],

    principle:
      "Route every request to the most appropriate execution layer.",
  };
}


/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

export default routeUserRequest;
