"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import EnergyCore from "@/components/EnergyCore";

import {
  createVoiceRecognition,
  speak,
  stopSpeaking,
} from "@/lib/voice";

import {
  processCommand,
  getHelpMessage,
  type CommandResult,
} from "@/lib/commandEngine";

const tools = [
  {
    label: "CHAT",
    icon: "◈",
  },
  {
    label: "VISION",
    icon: "◉",
  },
  {
    label: "MEMORY",
    icon: "◇",
  },
  {
    label: "COMMANDS",
    icon: "⌁",
  },
];

const toolsRight = [
  {
    label: "VOICE",
    icon: "◌",
  },
  {
    label: "SETTINGS",
    icon: "⚙",
  },
  {
    label: "BROWSE",
    icon: "◎",
  },
  {
    label: "AGENTS",
    icon: "▦",
  },
];

type CoreState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "alert";

type Mode = "NORMAL" | "ALERT";

export default function Home() {
  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const recognitionRef =
    useRef<
      ReturnType<
        typeof createVoiceRecognition
      >
    >(null);

  const responseTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const idleTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const [mode, setMode] =
    useState<Mode>("NORMAL");

  const [coreState, setCoreState] =
    useState<CoreState>("idle");

  const [command, setCommand] =
    useState("");

  const [response, setResponse] =
    useState("");

  const [alertBurst, setAlertBurst] =
    useState(false);

  /*
   * =========================================================
   * STARFIELD
   * =========================================================
   */

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    let animationFrame = 0;

    let stars: {
      x: number;
      y: number;
      r: number;
      speed: number;
      phase: number;
    }[] = [];

    const resize = () => {
      const dpr =
        window.devicePixelRatio || 1;

      canvas.width =
        window.innerWidth * dpr;

      canvas.height =
        window.innerHeight * dpr;

      canvas.style.width =
        `${window.innerWidth}px`;

      canvas.style.height =
        `${window.innerHeight}px`;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      stars =
        Array.from(
          {
            length: Math.min(
              450,
              Math.floor(
                (window.innerWidth *
                  window.innerHeight) /
                  4500
              )
            ),
          },
          () => ({
            x:
              Math.random() *
              window.innerWidth,

            y:
              Math.random() *
              window.innerHeight,

            r:
              Math.random() *
                1.35 +
              0.15,

            speed:
              Math.random() *
                0.25 +
              0.03,

            phase:
              Math.random() *
              Math.PI *
              2,
          })
        );
    };

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    const draw = (
      time: number
    ) => {
      const w =
        window.innerWidth;

      const h =
        window.innerHeight;

      ctx.clearRect(
        0,
        0,
        w,
        h
      );

      for (
        const star of stars
      ) {
        const alpha =
          0.25 +
          0.55 *
            ((Math.sin(
              star.phase +
                time *
                  0.001 *
                  star.speed
            ) +
              1) /
              2);

        ctx.beginPath();

        ctx.arc(
          star.x,
          star.y,
          star.r,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(255, ${
            190 +
            Math.floor(
              Math.random() *
                50
            )
          }, 70, ${alpha})`;

        ctx.fill();

        star.y +=
          star.speed *
          0.025;

        if (
          star.y >
          h + 2
        ) {
          star.y = -2;

          star.x =
            Math.random() *
            w;
        }
      }

      animationFrame =
        requestAnimationFrame(
          draw
        );
    };

    animationFrame =
      requestAnimationFrame(
        draw
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        resize
      );
    };
  }, []);

  /*
   * =========================================================
   * CLEANUP
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (
        responseTimerRef.current
      ) {
        clearTimeout(
          responseTimerRef.current
        );
      }

      if (
        idleTimerRef.current
      ) {
        clearTimeout(
          idleTimerRef.current
        );
      }

      if (
        recognitionRef.current
      ) {
        recognitionRef.current.stop();
      }

      stopSpeaking();
    };
  }, []);

  /*
   * =========================================================
   * ALERT SOUND
   * =========================================================
   */

  const playAlertSound =
    () => {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?:
                typeof AudioContext;
            }
          ).webkitAudioContext;

        if (
          !AudioContextClass
        ) {
          return;
        }

        const audioContext =
          new AudioContextClass();

        const now =
          audioContext.currentTime;

        const master =
          audioContext.createGain();

        master.gain.setValueAtTime(
          0.0001,
          now
        );

        master.gain.exponentialRampToValueAtTime(
          0.18,
          now + 0.03
        );

        master.gain.exponentialRampToValueAtTime(
          0.0001,
          now + 0.9
        );

        master.connect(
          audioContext.destination
        );

        const low =
          audioContext.createOscillator();

        low.type =
          "sawtooth";

        low.frequency.setValueAtTime(
          80,
          now
        );

        low.frequency.exponentialRampToValueAtTime(
          180,
          now + 0.45
        );

        low.connect(
          master
        );

        low.start(now);

        low.stop(
          now + 0.85
        );

        const high =
          audioContext.createOscillator();

        high.type =
          "triangle";

        high.frequency.setValueAtTime(
          420,
          now + 0.08
        );

        high.frequency.exponentialRampToValueAtTime(
          760,
          now + 0.5
        );

        high.connect(
          master
        );

        high.start(
          now + 0.08
        );

        high.stop(
          now + 0.68
        );

        const pulse =
          audioContext.createOscillator();

        pulse.type =
          "square";

        pulse.frequency.setValueAtTime(
          110,
          now + 0.55
        );

        pulse.frequency.exponentialRampToValueAtTime(
          55,
          now + 0.88
        );

        const pulseGain =
          audioContext.createGain();

        pulseGain.gain.value =
          0.18;

        pulse.connect(
          pulseGain
        );

        pulseGain.connect(
          master
        );

        pulse.start(
          now + 0.55
        );

        pulse.stop(
          now + 0.88
        );

        setTimeout(() => {
          audioContext.close();
        }, 1000);
      } catch {
        // Visual alert still works if audio is unavailable.
      }
    };

  /*
   * =========================================================
   * MODE CONTROL
   * =========================================================
   */

  const activateAlertMode =
    () => {
      stopSpeaking();

      setMode("ALERT");

      setAlertBurst(true);

      setCoreState("alert");

      setResponse(
        "HIGH ALERT MODE ACTIVATED"
      );

      playAlertSound();

      setTimeout(() => {
        speak(
          "Warning. High alert mode activated.",
          "ALERT"
        );
      }, 250);

      setTimeout(() => {
        setAlertBurst(false);
      }, 1000);
    };

  const activateNormalMode =
    () => {
      stopSpeaking();

      setMode("NORMAL");

      setAlertBurst(true);

      setCoreState("idle");

      setResponse(
        "NORMAL MODE RESTORED"
      );

      setTimeout(() => {
        speak(
          "Normal mode restored. How can I assist you?",
          "NORMAL"
        );
      }, 250);

      setTimeout(() => {
        setAlertBurst(false);
      }, 1000);
    };

  /*
   * =========================================================
   * RESET
   * =========================================================
   */

  const resetEON =
    () => {
      if (
        recognitionRef.current
      ) {
        recognitionRef.current.stop();

        recognitionRef.current =
          null;
      }

      stopSpeaking();

      if (
        responseTimerRef.current
      ) {
        clearTimeout(
          responseTimerRef.current
        );
      }

      if (
        idleTimerRef.current
      ) {
        clearTimeout(
          idleTimerRef.current
        );
      }

      setResponse("");

      setCommand("");

      setMode("NORMAL");

      setCoreState("idle");

      setAlertBurst(false);
    };

  /*
   * =========================================================
   * COMMAND RESPONSE
   * =========================================================
   */

  const executeCommand =
    (
      result: CommandResult
    ) => {
      switch (
        result.intent
      ) {
        case "MODE_ALERT":
          activateAlertMode();
          return;

        case "MODE_NORMAL":
          activateNormalMode();
          return;

        case "SYSTEM_STATUS": {
          const status =
            mode === "ALERT"
              ? "System online. High alert mode active. Voice systems operational. Command engine operational."
              : "System online. Normal mode active. Voice systems operational. Command engine operational.";

          setCoreState(
            "speaking"
          );

          setResponse(
            status.toUpperCase()
          );

          speak(
            status,
            mode
          );

          if (
            idleTimerRef.current
          ) {
            clearTimeout(
              idleTimerRef.current
            );
          }

          idleTimerRef.current =
            setTimeout(() => {
              setCoreState(
                "idle"
              );
            }, 4200);

          return;
        }

        case "CURRENT_MODE": {
          const currentModeText =
            mode === "ALERT"
              ? "I am currently operating in high alert mode."
              : "I am currently operating in normal mode.";

          setCoreState(
            "speaking"
          );

          setResponse(
            currentModeText.toUpperCase()
          );

          speak(
            currentModeText,
            mode
          );

          if (
            idleTimerRef.current
          ) {
            clearTimeout(
              idleTimerRef.current
            );
          }

          idleTimerRef.current =
            setTimeout(() => {
              setCoreState(
                "idle"
              );
            }, 4200);

          return;
        }

        case "RESET":
          resetEON();

          setResponse(
            "EON SYSTEM RESET COMPLETE"
          );

          speak(
            "EON system reset complete.",
            "NORMAL"
          );

          return;

        case "HELP": {
          const help =
            getHelpMessage();

          setCoreState(
            "speaking"
          );

          setResponse(
            help.toUpperCase()
          );

          speak(
            help,
            mode
          );

          if (
            idleTimerRef.current
          ) {
            clearTimeout(
              idleTimerRef.current
            );
          }

          idleTimerRef.current =
            setTimeout(() => {
              setCoreState(
                "idle"
              );
            }, 6500);

          return;
        }

        case "STOP":
          stopSpeaking();

          setCoreState(
            "idle"
          );

          setResponse(
            "SPEECH OUTPUT STOPPED"
          );

          return;

        case "GENERAL": {
          /*
           * ==================================================
           * FUTURE AI BRAIN
           * ==================================================
           *
           * This is the gateway for the future LLM backend.
           */

          const responseText =
            mode === "ALERT"
              ? `Command received. ${result.original}. AI reasoning module is ready for connection.`
              : `Command received. ${result.original}. AI reasoning module is ready for connection.`;

          setCoreState(
            "speaking"
          );

          setResponse(
            responseText.toUpperCase()
          );

          speak(
            responseText,
            mode
          );

          if (
            idleTimerRef.current
          ) {
            clearTimeout(
              idleTimerRef.current
            );
          }

          idleTimerRef.current =
            setTimeout(() => {
              setCoreState(
                "idle"
              );
            }, 5000);

          return;
        }
      }
    };

  /*
   * =========================================================
   * COMMAND PIPELINE
   * =========================================================
   */

  const runCommand =
    (
      input: string
    ) => {
      const trimmed =
        input.trim();

      if (!trimmed) {
        return;
      }

      stopSpeaking();

      if (
        responseTimerRef.current
      ) {
        clearTimeout(
          responseTimerRef.current
        );
      }

      setCoreState(
        "thinking"
      );

      const result =
        processCommand(
          trimmed
        );

      setResponse(
        `ANALYZING COMMAND: ${trimmed.toUpperCase()}`
      );

      setCommand("");

      responseTimerRef.current =
        setTimeout(() => {
          executeCommand(
            result
          );
        }, 700);
    };

  /*
   * =========================================================
   * VOICE
   * =========================================================
   */

  const startVoice =
    () => {
      if (
        recognitionRef.current
      ) {
        recognitionRef.current.stop();

        recognitionRef.current =
          null;

        setCoreState(
          "idle"
        );

        setResponse(
          "VOICE LISTENING STOPPED"
        );

        return;
      }

      stopSpeaking();

      const recognition =
        createVoiceRecognition(
          {
            onStart:
              () => {
                setCoreState(
                  "listening"
                );

                setResponse(
                  "LISTENING..."
                );
              },

            onResult:
              (
                text
              ) => {
                setCommand(
                  text
                );

                setResponse(
                  `VOICE COMMAND: ${text.toUpperCase()}`
                );

                runCommand(
                  text
                );
              },

            onEnd:
              () => {
                recognitionRef.current =
                  null;
              },

            onError:
              (
                message
              ) => {
                setCoreState(
                  "idle"
                );

                setResponse(
                  `VOICE ERROR: ${message.toUpperCase()}`
                );

                recognitionRef.current =
                  null;
              },
          }
        );

      if (!recognition) {
        return;
      }

      recognitionRef.current =
        recognition;

      try {
        recognition.start();
      } catch {
        recognitionRef.current =
          null;

        setCoreState(
          "idle"
        );

        setResponse(
          "VOICE SYSTEM COULD NOT START"
        );
      }
    };

  /*
   * =========================================================
   * TEXT COMMAND
   * =========================================================
   */

  const submitCommand =
    () => {
      runCommand(
        command
      );
    };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <main
      className={`eon ${
        mode === "ALERT"
          ? "alert"
          : ""
      }`}
    >
      <canvas
        ref={canvasRef}
        className="stars"
      />

      <div className="spaceGlow" />

      {/* HEADER */}

      <header className="topBar">
        <div className="statusPanel">
          <span className="onlineDot" />

          <span>
            ONLINE
          </span>

          <span className="separator">
            |
          </span>

          <span>
            {mode === "NORMAL"
              ? "NORMAL MODE"
              : "HIGH ALERT"}
          </span>
        </div>

        <div className="brandPanel">
          <div className="brandTitle">
            ENHANCED OPERATIONS NETWORK
          </div>

          <div className="brandLine" />

          <div className="brandSub">
            INTELLIGENCE&nbsp;&nbsp; | &nbsp;&nbsp;
            EXECUTION&nbsp;&nbsp; | &nbsp;&nbsp;
            AUTONOMY&nbsp;&nbsp; | &nbsp;&nbsp;
            BEYOND LIMITS
          </div>
        </div>
      </header>

      {/* LEFT TOOLS */}

      <aside
        className="toolColumn leftTools"
      >
        {tools.map(
          (
            tool
          ) => (
            <button
              className="toolButton"
              key={
                tool.label
              }
              type="button"
              onClick={() => {
                setResponse(
                  `${tool.label} MODULE SELECTED`
                );
              }}
            >
              <span className="toolIcon">
                {tool.icon}
              </span>

              <span>
                {tool.label}
              </span>
            </button>
          )
        )}
      </aside>

      {/* RIGHT TOOLS */}

      <aside
        className="toolColumn rightTools"
      >
        {toolsRight.map(
          (
            tool
          ) => (
            <button
              className="toolButton"
              key={
                tool.label
              }
              type="button"
              onClick={() => {
                if (
                  tool.label ===
                  "VOICE"
                ) {
                  startVoice();
                  return;
                }

                setResponse(
                  `${tool.label} MODULE SELECTED`
                );
              }}
            >
              <span className="toolIcon">
                {tool.icon}
              </span>

              <span>
                {tool.label}
              </span>
            </button>
          )
        )}
      </aside>

      {/* ENERGY CORE */}

      <section className="coreArea">
        <EnergyCore
          state={
            coreState
          }
        />

        {alertBurst && (
          <div
            className={`alertBurst ${
              mode === "ALERT"
                ? "enteringAlert"
                : "leavingAlert"
            }`}
          />
        )}

        {response && (
          <div className="response">
            {response}
          </div>
        )}
      </section>

      {/* COMMAND AREA */}

      <section className="bottomArea">
        <form
          className="commandBar"
          onSubmit={(
            event
          ) => {
            event.preventDefault();

            submitCommand();
          }}
        >
          <span className="commandWave">
            ▮▮▮
          </span>

          <input
            value={
              command
            }
            onChange={(
              event
            ) =>
              setCommand(
                event.target
                  .value
              )
            }
            placeholder="Type or speak a command..."
            aria-label="EON command"
          />

          <button
            type="submit"
            className="sendButton"
            aria-label="Send command"
          >
            ➤
          </button>
        </form>

        <div className="bottomControls">
          <button
            className="controlButton"
            type="button"
            onClick={
              mode === "NORMAL"
                ? activateAlertMode
                : activateNormalMode
            }
          >
            ⚡ &nbsp;

            {mode === "NORMAL"
              ? "NO LIMITS"
              : "EON HAS LIMITS"}
          </button>

          <button
            className="controlButton"
            type="button"
            onClick={
              resetEON
            }
          >
            ↻ &nbsp; RESET
          </button>
        </div>

        <div className="footer">
          INTELLIGENCE&nbsp;&nbsp; | &nbsp;&nbsp;
          EXECUTION&nbsp;&nbsp; | &nbsp;&nbsp;
          AUTONOMY&nbsp;&nbsp; | &nbsp;&nbsp;
          BEYOND LIMITS
        </div>
      </section>
    </main>
  );
}
