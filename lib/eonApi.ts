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
 * Memory Context
 *    ↓
 * Render FastAPI
 *    ↓
 * Gemini AI
 *    ↓
 * Response
 *    ↓
 * EON
 *
 * Memory Integration v1
 * ------------------------------------------------------------
 * The frontend keeps EON's local memory in the browser.
 * Relevant memory is collected before an AI request and
 * forwarded to the backend as memory_context.
 *
 * Message persistence itself is intentionally handled
 * separately so that page-level command handling does not
 * create duplicate memory entries.
 * ============================================================
 */

import { buildMemoryContext } from "./memory";


/*
 * ============================================================
 * API CONFIGURATION
 * ============================================================
 */

const EON_API_URL =
  "https://eon-v2-0.onrender.com";


/*
 * ============================================================
 * API RESPONSE TYPE
 * ============================================================
 */

export type EONApiResponse = {
  response: string;
  status: string;
  model: string;
  mode?: string;
};


/*
 * ============================================================
 * API REQUEST TYPE
 * ============================================================
 */

export type EONApiRequest = {
  message: string;
  mode?: string;
  memory_context?: string;
};


/*
 * ============================================================
 * ASK EON
 * ============================================================
 *
 * Sends a user request to the EON backend.
 *
 * Memory context is automatically collected from the
 * browser's local EON memory engine.
 * ============================================================
 */

export async function askEON(
  message: string,
  mode: string = "NORMAL"
): Promise<EONApiResponse> {

  const cleanedMessage =
    message.trim();


  /*
   * ----------------------------------------------------------
   * EMPTY REQUEST
   * ----------------------------------------------------------
   */

  if (!cleanedMessage) {
    return {
      response: "No command received.",
      status: "empty",
      model: "eon-ai",
      mode,
    };
  }


  /*
   * ----------------------------------------------------------
   * LOAD MEMORY CONTEXT
   * ----------------------------------------------------------
   *
   * buildMemoryContext() safely reads EON's local memory.
   * If there is no stored memory, it returns an empty or
   * minimal context instead of blocking the request.
   * ----------------------------------------------------------
   */

  let memoryContext = "";

  try {
    memoryContext =
      buildMemoryContext();
  } catch {
    /*
     * Memory must never prevent EON from answering.
     * If local memory cannot be read, continue without it.
     */
    memoryContext = "";
  }


  /*
   * ----------------------------------------------------------
   * BUILD REQUEST
   * ----------------------------------------------------------
   */

  const requestBody: EONApiRequest = {
    message: cleanedMessage,
    mode,
    memory_context: memoryContext,
  };


  /*
   * ----------------------------------------------------------
   * SEND REQUEST TO EON BACKEND
   * ----------------------------------------------------------
   */

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


  /*
   * ----------------------------------------------------------
   * HANDLE BACKEND ERROR
   * ----------------------------------------------------------
   */

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
      /*
       * Keep the default error message
       * when the backend does not return
       * readable JSON.
       */
    }


    throw new Error(
      errorMessage
    );
  }


  /*
   * ----------------------------------------------------------
   * PARSE RESPONSE
   * ----------------------------------------------------------
   */

  const data =
    (await response.json()) as EONApiResponse;


  /*
   * ----------------------------------------------------------
   * RETURN RESPONSE
   * ----------------------------------------------------------
   */

  return data;
}


/*
 * ============================================================
 * DEFAULT EXPORT
 * ============================================================
 */

export default askEON;
