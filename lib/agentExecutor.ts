"use client";

import askThroughGateway from "./modelGateway";
import {
  getAgent,
  type EONAgentId,
  type EONAgent,
} from "./agents";
import type { RequestDestination } from "./requestRouter";

export type AgentExecutionStatus =
  | "PLANNING"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED";

export type AgentExecutionResult = {
  agent: EONAgent;
  task: string;
  status: AgentExecutionStatus;
  steps: string[];
  response: string;
};

const MAX_STEPS = 5;

function buildExecutionPrompt(
  agent: EONAgent,
  task: string,
  mode: string
): string {
  return [
    "You are the EON Agent Execution Engine.",
    "",
    `ACTIVE AGENT: ${agent.name}`,
    `AGENT ROLE: ${agent.description}`,
    `EON MODE: ${mode}`,
    "",
    "EXECUTION RULES:",
    "1. Understand the user's goal before answering.",
    "2. Break the task into a small number of concrete steps internally.",
    "3. Execute the reasoning for those steps in order.",
    "4. Do not claim to have used a tool, website, file, camera, API, or hardware device unless it was actually connected and used.",
    "5. If a required capability is not connected, clearly say so and continue with everything that can be completed using the available AI capability.",
    "6. Return a useful final result, not a description of what you could do.",
    "7. Keep the final response concise unless the user asks for detail.",
    "",
    `USER TASK: ${task}`,
  ].join("\n");
}

function extractSteps(response: string): string[] {
  const lines = response
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const numbered = lines
    .filter((line) => /^\d+[.)]\s+/.test(line))
    .slice(0, MAX_STEPS)
    .map((line) => line.replace(/^\d+[.)]\s+/, ""));

  return numbered.length > 0
    ? numbered
    : ["Agent reasoning and task execution completed."];
}

export async function executeAgentTask(
  agentId: EONAgentId,
  task: string,
  mode: string,
  destination?: RequestDestination
): Promise<AgentExecutionResult> {
  const agent = getAgent(agentId);
  const cleanTask = task.trim();

  if (!cleanTask) {
    throw new Error("Agent task is empty.");
  }

  const executionDestination =
    destination || agent.destination;

  const result = await askThroughGateway({
    message: buildExecutionPrompt(
      agent,
      cleanTask,
      mode
    ),
    mode,
    destination: executionDestination,
  });

  return {
    agent,
    task: cleanTask,
    status: "COMPLETED",
    steps: extractSteps(result.response),
    response: result.response,
  };
}

export function getAgentExecutionStatus() {
  return {
    engine: "EON Agent Execution Engine",
    version: "1.0.0",
    status: "ONLINE",
    maxSteps: MAX_STEPS,
    execution: "CONNECTED_TO_MODEL_GATEWAY",
    capabilities: [
      "Agent-specific task context",
      "Goal-oriented reasoning",
      "Step-aware execution",
      "Capability boundary reporting",
      "Final result generation",
    ],
  };
}

export default executeAgentTask;
