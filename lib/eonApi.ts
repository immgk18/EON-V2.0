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

export type EONVisionResponse = {
  response: string;
  status: string;
  model: string;
};

export type EONOrchestrationResponse = {
  response: string;
  status: string;
  model: string;
  agents: string[];
};

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json();

    if (data && typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // Keep fallback.
  }

  return fallback;
}

export async function askEON(
  message: string,
  mode: string = "NORMAL",
  destination: string = "AI"
): Promise<EONApiResponse> {
  const cleanedMessage = message.trim();

  if (!cleanedMessage) {
    return {
      response: "No command received.",
      status: "empty",
      model: "eon-ai",
      mode,
    };
  }

  if (destination.toUpperCase() === "TOOLS") {
    const response = await fetch(
      `${EON_API_URL}/api/tool`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanedMessage,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        await readError(
          response,
          "EON tool execution failed."
        )
      );
    }

    const data = (await response.json()) as {
      tool: string;
      result: string;
    };

    return {
      response: data.result,
      status: "tool_executed",
      model: `eon-tool:${data.tool}`,
      mode,
    };
  }

  let memoryContext = "";

  try {
    memoryContext = buildMemoryContext();
  } catch {
    memoryContext = "";
  }

  const requestBody: EONApiRequest = {
    message: cleanedMessage,
    mode,
    memory_context: memoryContext,
    destination,
  };

  let response: Response;

  try {
    response = await fetch(
      `${EON_API_URL}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );
  } catch {
    throw new Error(
      "Unable to connect to the EON AI backend."
    );
  }

  if (!response.ok) {
    throw new Error(
      await readError(
        response,
        "EON AI backend request failed."
      )
    );
  }

  return (await response.json()) as EONApiResponse;
}

export async function analyzeEONImage(
  imageBase64: string,
  mimeType: string,
  prompt: string = "Analyze this image and describe the important visual information."
): Promise<EONVisionResponse> {
  const response = await fetch(
    `${EON_API_URL}/api/vision`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        mime_type: mimeType,
        prompt,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readError(
        response,
        "EON Vision request failed."
      )
    );
  }

  return (await response.json()) as EONVisionResponse;
}

export async function orchestrateEON(
  task: string,
  mode: string = "NORMAL",
  agents: string[] = []
): Promise<EONOrchestrationResponse> {
  let memoryContext = "";

  try {
    memoryContext = buildMemoryContext();
  } catch {
    memoryContext = "";
  }

  const response = await fetch(
    `${EON_API_URL}/api/orchestrate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task: task.trim(),
        mode,
        memory_context: memoryContext,
        agents,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readError(
        response,
        "EON orchestration request failed."
      )
    );
  }

  return (await response.json()) as EONOrchestrationResponse;
}

export async function checkEONHealth(): Promise<boolean> {
  try {
    const response = await fetch(
      `${EON_API_URL}/health`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

export default askEON;
