"use client";

/*
 * ============================================================
 * EON 2.0 — MEMORY ENGINE
 * Enhanced Operations Network
 * ============================================================
 *
 * Phase 6 — Memory Foundation
 *
 * Responsibilities:
 *
 * - Store recent conversation messages
 * - Store important user facts
 * - Store EON session information
 * - Retrieve relevant memory
 * - Remove temporary session memory
 * - Prepare the architecture for future database memory
 *
 * Current storage:
 *     Browser localStorage
 *
 * Future storage:
 *     PostgreSQL
 *     pgvector
 *     Semantic memory
 *     Long-term memory
 * ============================================================
 */


/* ============================================================
   TYPES
   ============================================================ */

export type MemoryRole =
  | "user"
  | "assistant"
  | "system";


export type MemoryMessage = {
  id: string;
  role: MemoryRole;
  content: string;
  timestamp: number;
};


export type MemoryFact = {
  id: string;
  key: string;
  value: string;
  timestamp: number;
};


export type EONMemoryState = {
  messages: MemoryMessage[];
  facts: MemoryFact[];
};


/* ============================================================
   STORAGE
   ============================================================ */

const MEMORY_STORAGE_KEY =
  "eon_memory_v1";


/* ============================================================
   LIMITS
   ============================================================ */

const MAX_MESSAGES = 30;

const MAX_FACTS = 50;


/* ============================================================
   MEMORY AVAILABILITY
   ============================================================ */

function isStorageAvailable(): boolean {

  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }


  try {

    const testKey =
      "__eon_memory_test__";


    window.localStorage.setItem(
      testKey,
      "1"
    );


    window.localStorage.removeItem(
      testKey
    );


    return true;

  } catch {

    return false;
  }
}


/* ============================================================
   EMPTY MEMORY
   ============================================================ */

function createEmptyMemory(): EONMemoryState {

  return {
    messages: [],
    facts: [],
  };
}


/* ============================================================
   LOAD MEMORY
   ============================================================ */

export function loadMemory(): EONMemoryState {

  if (
    !isStorageAvailable()
  ) {
    return createEmptyMemory();
  }


  try {

    const stored =
      window.localStorage.getItem(
        MEMORY_STORAGE_KEY
      );


    if (!stored) {
      return createEmptyMemory();
    }


    const parsed =
      JSON.parse(
        stored
      ) as Partial<EONMemoryState>;


    return {

      messages:
        Array.isArray(
          parsed.messages
        )
          ? parsed.messages
          : [],

      facts:
        Array.isArray(
          parsed.facts
        )
          ? parsed.facts
          : [],
    };

  } catch {

    return createEmptyMemory();
  }
}


/* ============================================================
   SAVE MEMORY
   ============================================================ */

export function saveMemory(
  memory: EONMemoryState
): void {

  if (
    !isStorageAvailable()
  ) {
    return;
  }


  try {

    const safeMemory:
      EONMemoryState = {

      messages:
        memory.messages
          .slice(-MAX_MESSAGES),

      facts:
        memory.facts
          .slice(-MAX_FACTS),
    };


    window.localStorage.setItem(
      MEMORY_STORAGE_KEY,
      JSON.stringify(
        safeMemory
      )
    );

  } catch {

    console.warn(
      "EON memory could not be saved."
    );
  }
}


/* ============================================================
   CREATE MEMORY ID
   ============================================================ */

function createMemoryId(
  prefix: string
): string {

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}


/* ============================================================
   ADD MESSAGE
   ============================================================ */

export function addMemoryMessage(
  role: MemoryRole,
  content: string
): MemoryMessage {

  const cleanedContent =
    content.trim();


  const message:
    MemoryMessage = {

    id:
      createMemoryId(
        "msg"
      ),

    role,

    content:
      cleanedContent,

    timestamp:
      Date.now(),
  };


  const memory =
    loadMemory();


  memory.messages.push(
    message
  );


  memory.messages =
    memory.messages.slice(
      -MAX_MESSAGES
    );


  saveMemory(
    memory
  );


  return message;
}


/* ============================================================
   ADD USER MESSAGE
   ============================================================ */

export function addUserMessage(
  content: string
): MemoryMessage {

  return addMemoryMessage(
    "user",
    content
  );
}


/* ============================================================
   ADD ASSISTANT MESSAGE
   ============================================================ */

export function addAssistantMessage(
  content: string
): MemoryMessage {

  return addMemoryMessage(
    "assistant",
    content
  );
}


/* ============================================================
   GET RECENT MESSAGES
   ============================================================ */

export function getRecentMessages(
  limit: number = 12
): MemoryMessage[] {

  const memory =
    loadMemory();


  return memory.messages
    .slice(
      -Math.max(
        1,
        limit
      )
    );
}


/* ============================================================
   ADD FACT
   ============================================================ */

export function addMemoryFact(
  key: string,
  value: string
): MemoryFact {

  const cleanKey =
    key.trim();

  const cleanValue =
    value.trim();


  const memory =
    loadMemory();


  const existingIndex =
    memory.facts.findIndex(
      (fact) =>
        fact.key.toLowerCase() ===
        cleanKey.toLowerCase()
    );


  const fact:
    MemoryFact = {

    id:
      existingIndex >= 0
        ? memory.facts[
            existingIndex
          ].id
        : createMemoryId(
            "fact"
          ),

    key:
      cleanKey,

    value:
      cleanValue,

    timestamp:
      Date.now(),
  };


  if (
    existingIndex >= 0
  ) {

    memory.facts[
      existingIndex
    ] = fact;

  } else {

    memory.facts.push(
      fact
    );
  }


  memory.facts =
    memory.facts.slice(
      -MAX_FACTS
    );


  saveMemory(
    memory
  );


  return fact;
}


/* ============================================================
   GET FACT
   ============================================================ */

export function getMemoryFact(
  key: string
): MemoryFact | null {

  const memory =
    loadMemory();


  const fact =
    memory.facts.find(
      (item) =>
        item.key.toLowerCase() ===
        key.trim().toLowerCase()
    );


  return fact || null;
}


/* ============================================================
   GET ALL FACTS
   ============================================================ */

export function getMemoryFacts(): MemoryFact[] {

  return loadMemory()
    .facts;
}


/* ============================================================
   SEARCH MEMORY
   ============================================================ */

export function searchMemory(
  query: string
): MemoryMessage[] {

  const normalizedQuery =
    query
      .trim()
      .toLowerCase();


  if (
    !normalizedQuery
  ) {
    return [];
  }


  const memory =
    loadMemory();


  const queryWords =
    normalizedQuery
      .split(/\s+/)
      .filter(
        Boolean
      );


  return memory.messages
    .filter(
      (message) => {

        const content =
          message.content
            .toLowerCase();


        return queryWords.some(
          (word) =>
            content.includes(
              word
            )
        );
      }
    )
    .slice(
      -10
    );
}


/* ============================================================
   BUILD MEMORY CONTEXT
   ============================================================ */

export function buildMemoryContext(
  limit: number = 12
): string {

  const memory =
    loadMemory();


  const messages =
    memory.messages
      .slice(
        -Math.max(
          1,
          limit
        )
      );


  const facts =
    memory.facts;


  const sections:
    string[] = [];


  sections.push(
    "EON MEMORY CONTEXT"
  );


  /* ----------------------------------------------------------
     IMPORTANT FACTS
     ---------------------------------------------------------- */

  if (
    facts.length > 0
  ) {

    sections.push(
      "",
      "KNOWN FACTS:"
    );


    for (
      const fact of facts
    ) {

      sections.push(
        `- ${fact.key}: ${fact.value}`
      );
    }

  } else {

    sections.push(
      "",
      "KNOWN FACTS:",
      "No stored facts."
    );
  }


  /* ----------------------------------------------------------
     RECENT CONVERSATION
     ---------------------------------------------------------- */

  sections.push(
    "",
    "RECENT CONVERSATION:"
  );


  if (
    messages.length === 0
  ) {

    sections.push(
      "No previous messages."
    );

  } else {

    for (
      const message of messages
    ) {

      sections.push(
        `${message.role.toUpperCase()}: ${message.content}`
      );
    }
  }


  return sections.join(
    "\n"
  );
}


/* ============================================================
   MEMORY SUMMARY
   ============================================================ */

export function getMemorySummary() {

  const memory =
    loadMemory();


  return {

    status:
      "ONLINE",

    storage:
      "LOCAL_STORAGE",

    messageCount:
      memory.messages.length,

    factCount:
      memory.facts.length,

    maxMessages:
      MAX_MESSAGES,

    maxFacts:
      MAX_FACTS,

    engine:
      "EON Memory Engine",

    version:
      "1.0.0",
  };
}


/* ============================================================
   CLEAR CONVERSATION
   ============================================================ */

export function clearConversationMemory(): void {

  const memory =
    loadMemory();


  memory.messages =
    [];


  saveMemory(
    memory
  );
}


/* ============================================================
   CLEAR ALL MEMORY
   ============================================================ */

export function clearAllMemory(): void {

  if (
    !isStorageAvailable()
  ) {
    return;
  }


  try {

    window.localStorage.removeItem(
      MEMORY_STORAGE_KEY
    );

  } catch {

    console.warn(
      "EON memory could not be cleared."
    );
  }
}


/* ============================================================
   EXPORT MEMORY
   ============================================================ */

export function exportMemory(): string {

  const memory =
    loadMemory();


  return JSON.stringify(
    memory,
    null,
    2
  );
}


/* ============================================================
   IMPORT MEMORY
   ============================================================ */

export function importMemory(
  data: string
): boolean {

  try {

    const parsed =
      JSON.parse(
        data
      ) as EONMemoryState;


    if (
      !parsed ||
      !Array.isArray(
        parsed.messages
      ) ||
      !Array.isArray(
        parsed.facts
      )
    ) {

      return false;
    }


    const safeMemory:
      EONMemoryState = {

      messages:
        parsed.messages
          .slice(
            -MAX_MESSAGES
          ),

      facts:
        parsed.facts
          .slice(
            -MAX_FACTS
          ),
    };


    saveMemory(
      safeMemory
    );


    return true;

  } catch {

    return false;
  }
}


/* ============================================================
   MEMORY ENGINE STATUS
   ============================================================ */

export function getMemoryEngineStatus() {

  return {

    status:
      "ONLINE",

    engine:
      "EON Memory Engine",

    version:
      "1.0.0",

    storage:
      "Browser Local Storage",

    capabilities: [
      "Short-term conversation memory",
      "Persistent local messages",
      "Persistent facts",
      "Memory search",
      "Memory context generation",
      "Memory export",
      "Memory import",
      "Conversation reset",
      "Full memory reset",
    ],

    futureStorage: [
      "PostgreSQL",
      "pgvector",
      "Semantic search",
      "Long-term memory",
      "Cross-device synchronization",
    ],
  };
}


/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

export default {
  loadMemory,
  saveMemory,
  addMemoryMessage,
  addUserMessage,
  addAssistantMessage,
  getRecentMessages,
  addMemoryFact,
  getMemoryFact,
  getMemoryFacts,
  searchMemory,
  buildMemoryContext,
  getMemorySummary,
  clearConversationMemory,
  clearAllMemory,
  exportMemory,
  importMemory,
  getMemoryEngineStatus,
};
