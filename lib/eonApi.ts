"use client";

import { buildMemoryContext } from "./memory";

const EON_API_URL =
  "https://eon-v2-0.onrender.com";

export type EONApiResponse = {
  response: string;
  status: string;
  model: string;
  mode?: string;
};

export type EONApiRequest = {
  message: string;
  mode?: string;
  memory_context?: string;
  destination?: string;
};

export async function askEON(
  message: string,
  mode: string = "NORMAL",
  destination: string = "AI"
): Promise<EONApiResponse> {
  const cleanedMessage =
    message.trim();

  if (!cleanedMessage) {
    return {
      response:
        "No command received.",
      status: "empty",
      model: "eon-ai",
      mode,
    };
  }

  let memoryContext = "";

  try {
    memoryContext =
      buildMemoryContext();
  } catch {
    memoryContext = "";
  }

  const requestBody: EONApiRequest = {
    message: cleanedMessage,
    mode,
    memory_context:
      memoryContext,
    destination,
  };

  let response: Response;

  try {
    response = await fetch(
      `${EON_API_URL}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          requestBody
        ),
      }
    );
  } catch {
    throw new Error(
      "Unable to connect to the EON AI backend."
    );
  }

  if (!response.ok) {
    let errorMessage =
      "EON AI backend request failed.";

    try {
      const errorData =
        await response.json();

      if (
        errorData &&
        typeof errorData.detail ===
          "string"
      ) {
        errorMessage =
          errorData.detail;
      }
    } catch {
      // Keep default error.
    }

    throw new Error(
      errorMessage
    );
  }

  const data =
    (await response.json()) as EONApiResponse;

  return data;
}

export default askEON;
