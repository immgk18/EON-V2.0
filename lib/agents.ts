"use client";

export type EONAgentId =
  | "CORE"
  | "WEB"
  | "VISION"
  | "MEMORY"
  | "TOOLS"
  | "RESEARCH"
  | "ENGINEERING"
  | "HARDWARE"
  | "DESIGN";

export type EONAgent = {
  id: EONAgentId;
  name: string;
  description: string;
  destination: "AI" | "WEB" | "VISION" | "TOOLS" | "AGENT";
  status: "ONLINE";
};

export const EON_AGENTS: EONAgent[] = [
  { id: "CORE", name: "CORE AGENT", description: "General reasoning and conversation.", destination: "AI", status: "ONLINE" },
  { id: "WEB", name: "WEB AGENT", description: "Current web-grounded information.", destination: "WEB", status: "ONLINE" },
  { id: "VISION", name: "VISION AGENT", description: "Image and visual understanding.", destination: "VISION", status: "ONLINE" },
  { id: "MEMORY", name: "MEMORY AGENT", description: "Conversation memory and context.", destination: "TOOLS", status: "ONLINE" },
  { id: "TOOLS", name: "TOOLS AGENT", description: "Tool and file-operation orchestration.", destination: "TOOLS", status: "ONLINE" },
  { id: "RESEARCH", name: "RESEARCH AGENT", description: "Structured multi-step research workflows.", destination: "AGENT", status: "ONLINE" },
  { id: "ENGINEERING", name: "ENGINEERING AGENT", description: "Technical design, debugging and engineering reasoning.", destination: "AGENT", status: "ONLINE" },
  { id: "HARDWARE", name: "HARDWARE AGENT", description: "Hardware, sensors, robotics and integration planning.", destination: "AGENT", status: "ONLINE" },
  { id: "DESIGN", name: "DESIGN AGENT", description: "CAD, EDA, 3D and BIM design orchestration.", destination: "AGENT", status: "ONLINE" },
];

export function getAgent(agentId: EONAgentId): EONAgent {
  return EON_AGENTS.find((agent) => agent.id === agentId) ?? EON_AGENTS[0];
}

export function getAgentsStatus() {
  return {
    status: "ONLINE",
    count: EON_AGENTS.length,
    agents: EON_AGENTS.map(({ id, name, destination, status }) => ({
      id,
      name,
      destination,
      status,
    })),
  };
}

export function buildAgentPrompt(agent: EONAgentId, task: string): string {
  const selected = getAgent(agent);
  return `[EON ${selected.name}] ${task.trim()}`;
}
