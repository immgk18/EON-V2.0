"use client";

/*
 * ============================================================
 * EON 2.0 — AI BACKEND CONNECTOR
 * Enhanced Operations Network
 * ============================================================
 *
 * Connects the EON frontend to the deployed
 * FastAPI + Gemini AI backend.
 *
 * Frontend
 *    ↓
 * Render FastAPI
 *    ↓
 * Gemini AI
 *    ↓
 * Response
 *    ↓
 * EON
 * ============================================================
 */

const EON_API_URL =
  "https://eon-v2-0.onrender.com";


export type EONApiResponse = {
  response: string;
  status: string;
  model: string;
};


export async function askEON(
  message: string
): Promise<EONApiResponse> {

  const cleanedMessage =
    message.trim();

  if (!cleanedMessage) {
    return {
      response: "No command received.",
      status: "empty",
      model: "eon-ai",
    };
  }

  const response = await fetch(
    `${EON_API_URL}/api/chat`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        message: cleanedMessage,
      }),
    }
  );


  if (!response.ok) {

    let errorMessage =
      "EON AI backend request failed.";

    try {
      const errorData =
        await response.json();

      if (errorData?.detail) {
        errorMessage =
          errorData.detail;
      }
    } catch {
      // Keep default error message.
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
