"use client";

import { askEON, type EONApiResponse } from "./eonApi";

export type EONModelProvider =
  | "GEMINI"
  | "LOCAL"
  | "EON";

export type ModelGatewayRequest = {
  message: string;
  mode?: string;
  destination?: string;
};

export type ModelGatewayResponse =
  EONApiResponse & {
    provider: EONModelProvider;
    gateway: string;
  };

const DEFAULT_PROVIDER: EONModelProvider = "GEMINI";

export async function askThroughGateway(
  request: ModelGatewayRequest
): Promise<ModelGatewayResponse> {
  const message = request.message.trim();

  if (!message) {
    return {
      response: "No request received.",
      status: "empty",
      model: "eon-ai",
      mode: request.mode || "NORMAL",
      provider: DEFAULT_PROVIDER,
      gateway: "EON Model Gateway",
    };
  }

  /*
   * EON Model Gateway v1
   *
   * Gemini is currently the active intelligence provider.
   *
   * LOCAL and EON providers are intentionally reserved
   * for future EON-owned/local intelligence.
   */

  const provider = DEFAULT_PROVIDER;

  if (provider === "GEMINI") {
    const result = await askEON(
      message,
      request.mode || "NORMAL",
      request.destination || "AI"
    );

    return {
      ...result,
      provider: "GEMINI",
      gateway: "EON Model Gateway v1",
    };
  }

  throw new Error(
    `EON provider "${provider}" is not connected yet.`
  );
}

export function getModelGatewayStatus() {
  return {
    engine: "EON Model Gateway",
    version: "1.0",
    status: "online",

    activeProvider: DEFAULT_PROVIDER,

    providers: {
      GEMINI: {
        status: "connected",
        role: "primary",
      },

      LOCAL: {
        status: "planned",
        role: "future local intelligence",
      },

      EON: {
        status: "planned",
        role: "future EON-owned intelligence",
      },
    },

    architecture:
      "EON UI → Request Router → Model Gateway → Intelligence Provider",

    note:
      "Gemini is the current provider. Local and EON-owned models will be connected in future phases.",
  };
}

export default askThroughGateway;
