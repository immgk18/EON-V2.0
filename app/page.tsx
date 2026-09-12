"use client";

import { useEffect, useRef, useState } from "react";
import EnergyCore from "@/components/EnergyCore";

const tools = [
  { label: "CHAT", icon: "◈" },
  { label: "VISION", icon: "◉" },
  { label: "MEMORY", icon: "◇" },
  { label: "COMMANDS", icon: "⌁" },
];

const toolsRight = [
  { label: "VOICE", icon: "◌" },
  { label: "SETTINGS", icon: "⚙" },
  { label: "BROWSE", icon: "◎" },
  { label: "AGENTS", icon: "▦" },
];

type CoreState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "alert";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<"NORMAL" | "ALERT">("NORMAL");

  const [coreState, setCoreState] =
    useState<CoreState>("idle");

  const [command, setCommand] = useState("");
  const [response, setResponse] = useState("");

  /*
   * =====================================================
   * STARFIELD
   * =====================================================
   */

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let animationFrame = 0;

    let stars: {
      x: number;
      y: number;
      r: number;
      speed: number;
      phase: number;
    }[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from(
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
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 1.35 + 0.15,
          speed: Math.random() * 0.25 + 0.03,
          phase: Math.random() * Math.PI * 2,
        })
      );
    };

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    const draw = (time: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      for (const star of stars) {
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

        ctx.fillStyle = `rgba(255, ${
          190 +
          Math.floor(Math.random() * 50)
        }, 70, ${alpha})`;

        ctx.fill();

        star.y +=
          star.speed * 0.025;

        if (star.y > h + 2) {
          star.y = -2;
          star.x =
            Math.random() * w;
        }
      }

      animationFrame =
        requestAnimationFrame(draw);
    };

    animationFrame =
      requestAnimationFrame(draw);

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
   * =====================================================
   * MODE CONTROL
   * =====================================================
   */

  const toggleMode = () => {
    setMode((current) => {
      const next =
        current === "NORMAL"
          ? "ALERT"
          : "NORMAL";

      setCoreState(
        next === "ALERT"
          ? "alert"
          : "idle"
      );

      return next;
    });
  };

  /*
   * =====================================================
   * COMMAND SYSTEM
   * =====================================================
   */

  const submitCommand = () => {
    if (!command.trim()) return;

    const currentCommand =
      command.trim();

    setCoreState("thinking");

    setResponse(
      `COMMAND RECEIVED: ${currentCommand}`
    );

    setCommand("");

    setTimeout(() => {
      setCoreState("speaking");
    }, 900);

    setTimeout(() => {
      setCoreState("idle");
    }, 2200);
  };

  /*
   * =====================================================
   * RESET
   * =====================================================
   */

  const resetEON = () => {
    setResponse("");
    setCommand("");
    setMode("NORMAL");
    setCoreState("idle");
  };

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <main
      className={`eon ${
        mode === "ALERT"
          ? "alert"
          : ""
      }`}
    >
      {/* STARFIELD */}

      <canvas
        ref={canvasRef}
        className="stars"
      />

      {/* ATMOSPHERIC SPACE GLOW */}

      <div className="spaceGlow" />

      {/* =================================================
          TOP BAR
          ================================================= */}

      <header className="topBar">
        <div className="statusPanel">
          <span className="onlineDot" />

          <span>ONLINE</span>

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

      {/* =================================================
          LEFT TOOLS
          ================================================= */}

      <aside
        className="toolColumn leftTools"
      >
        {tools.map((tool) => (
          <button
            className="toolButton"
            key={tool.label}
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
        ))}
      </aside>

      {/* =================================================
          RIGHT TOOLS
          ================================================= */}

      <aside
        className="toolColumn rightTools"
      >
        {toolsRight.map((tool) => (
          <button
            className="toolButton"
            key={tool.label}
            type="button"
            onClick={() => {
              if (
                tool.label ===
                "VOICE"
              ) {
                setCoreState(
                  "listening"
                );

                setResponse(
                  "LISTENING..."
                );

                setTimeout(() => {
                  setCoreState(
                    "idle"
                  );
                }, 3000);

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
        ))}
      </aside>

      {/* =================================================
          LIVING EON CORE
          ================================================= */}

      <section className="coreArea">
        <EnergyCore
          state={coreState}
        />

        {response && (
          <div className="response">
            {response}
          </div>
        )}
      </section>

      {/* =================================================
          COMMAND AREA
          ================================================= */}

      <section className="bottomArea">
        <form
          className="commandBar"
          onSubmit={(event) => {
            event.preventDefault();

            submitCommand();
          }}
        >
          <span className="commandWave">
            ▮▮▮
          </span>

          <input
            value={command}
            onChange={(event) =>
              setCommand(
                event.target.value
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

        {/* =================================================
            BOTTOM CONTROLS
            ================================================= */}

        <div className="bottomControls">
          <button
            className="controlButton"
            type="button"
            onClick={toggleMode}
          >
            ⚡ &nbsp;

            {mode === "NORMAL"
              ? "NO LIMITS"
              : "EON HAS LIMITS"}
          </button>

          <button
            className="controlButton"
            type="button"
            onClick={resetEON}
          >
            ↻ &nbsp; RESET
          </button>
        </div>

        {/* =================================================
            FOOTER
            ================================================= */}

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
