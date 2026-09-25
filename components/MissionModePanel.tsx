type MissionStep = "CORE" | "AI" | "VOICE" | "VISION" | "MEMORY" | "AGENTS" | "READY";

type Props = {
  activeStep: MissionStep;
  running: boolean;
  onStart: () => void;
};

const steps: MissionStep[] = ["CORE", "AI", "VOICE", "VISION", "MEMORY", "AGENTS", "READY"];

export default function MissionModePanel({ activeStep, running, onStart }: Props) {
  const activeIndex = steps.indexOf(activeStep);

  return (
    <div className="missionPanel">
      <div className="missionHero">
        <div>
          <span className="missionEyebrow">EON AUTONOMOUS CHECK</span>
          <strong>{running ? "MISSION MODE" : "SYSTEM MISSION"}</strong>
          <small>{running ? "CHECKING " + activeStep + " MODULE" : "RUN A FULL EON READINESS SEQUENCE"}</small>
        </div>
        <span className={running ? "missionCore missionCoreActive" : "missionCore"} />
      </div>

      <div className="missionTimeline">
        {steps.map((step, index) => {
          const state = !running && activeStep === "READY"
            ? "complete"
            : index < activeIndex
              ? "complete"
              : index === activeIndex && running
                ? "active"
                : "pending";

          return (
            <div className={"missionStep " + state} key={step}>
              <span className="missionStepDot">{state === "complete" ? "✓" : index + 1}</span>
              <div>
                <b>{step}</b>
                <small>{state === "complete" ? "VERIFIED" : state === "active" ? "CHECKING" : "STANDBY"}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="missionProgress">
        <span style={{ width: Math.max(0, Math.min(100, (activeIndex / (steps.length - 1)) * 100)) + "%" }} />
      </div>

      <button type="button" className="missionLaunch" onClick={onStart} disabled={running}>
        {running ? "MISSION IN PROGRESS..." : activeStep === "READY" ? "RUN MISSION AGAIN" : "START MISSION CHECK"}
      </button>

      {!running && activeStep === "READY" && (
        <div className="missionReady">✓ EON SYSTEM CHECK COMPLETE • ALL MODULES OPERATIONAL</div>
      )}
    </div>
  );
}
