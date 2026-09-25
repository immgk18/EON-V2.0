"use client";

type SystemStatusPanelProps = {
  mode: "NORMAL" | "NO_LIMITS";
  coreState: string;
  isProcessing: boolean;
  voiceActive: boolean;
  visionBusy: boolean;
  selectedAgent: string;
};

const statusTone = (status: string) => {
  if (status === "ACTIVE" || status === "PROCESSING" || status === "LISTENING") return "active";
  if (status === "STANDBY") return "standby";
  return "ready";
};

export default function SystemStatusPanel({
  mode,
  coreState,
  isProcessing,
  voiceActive,
  visionBusy,
  selectedAgent,
}: SystemStatusPanelProps) {
  const rows = [
    ["CORE", coreState.toUpperCase()],
    ["AI ENGINE", isProcessing ? "PROCESSING" : "READY"],
    ["VOICE", voiceActive ? "LISTENING" : "STANDBY"],
    ["VISION", visionBusy ? "PROCESSING" : "READY"],
    ["MEMORY", "READY"],
    ["AGENTS", selectedAgent === "CORE" ? "READY" : selectedAgent],
  ];

  return (
    <div className="drawerStack systemStatusPanel">
      <div className="systemStatusHero">
        <div>
          <span className="systemEyebrow">EON CORE</span>
          <strong>{mode === "NORMAL" ? "SYSTEM ONLINE" : "OPERATOR ONLINE"}</strong>
          <small>{mode === "NORMAL" ? "NORMAL MODE" : "NO LIMITS MODE"}</small>
        </div>
        <span className="systemPulse" />
      </div>

      <div className="systemStatusGrid">
        {rows.map(([name, status]) => (
          <div className="systemStatusCard" key={name}>
            <span>{name}</span>
            <b className={statusTone(status)}>{status}</b>
          </div>
        ))}
      </div>

      <div className="systemStatusFooter">
        <span>CORE STATE</span>
        <b>{coreState.replace("-", " ").toUpperCase()}</b>
      </div>
    </div>
  );
}
