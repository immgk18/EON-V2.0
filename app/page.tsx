"use client";

import { useEffect, useRef, useState } from "react";

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

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"NORMAL" | "ALERT">("NORMAL");
  const [command, setCommand] = useState("");
  const [response, setResponse] = useState("");

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
            Math.floor((window.innerWidth * window.innerHeight) / 4500)
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
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      for (const star of stars) {
        const alpha =
          0.25 +
          0.55 *
            ((Math.sin(star.phase + time * 0.001 * star.speed) + 1) / 2);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${190 + Math.floor(Math.random() * 50)}, 70, ${alpha})`;
        ctx.fill();

        star.y += star.speed * 0.025;

        if (star.y > h + 2) {
          star.y = -2;
          star.x = Math.random() * w;
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const toggleMode = () => {
    setMode((current) => (current === "NORMAL" ? "ALERT" : "NORMAL"));
  };

  const submitCommand = () => {
    if (!command.trim()) return;

    setResponse(`COMMAND RECEIVED: ${command.trim()}`);
    setCommand("");
  };

  return (
    <main className={`eon ${mode === "ALERT" ? "alert" : ""}`}>
      <canvas ref={canvasRef} className="stars" />

      <div className="spaceGlow" />

      {/* TOP BAR */}
      <header className="topBar">
        <div className="statusPanel">
          <span className="onlineDot" />
          <span>ONLINE</span>
          <span className="separator">|</span>
          <span>{mode === "NORMAL" ? "NORMAL MODE" : "HIGH ALERT"}</span>
        </div>

        <div className="brandPanel">
          <div className="brandTitle">
            ENHANCED OPERATIONS NETWORK
          </div>

          <div className="brandLine" />

          <div className="brandSub">
            INTELLIGENCE&nbsp;&nbsp; | &nbsp;&nbsp;EXECUTION&nbsp;&nbsp; | &nbsp;&nbsp;
            AUTONOMY&nbsp;&nbsp; | &nbsp;&nbsp;BEYOND LIMITS
          </div>
        </div>
      </header>

      {/* LEFT TOOLS */}
      <aside className="toolColumn leftTools">
        {tools.map((tool) => (
          <button className="toolButton" key={tool.label}>
            <span className="toolIcon">{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </aside>

      {/* RIGHT TOOLS */}
      <aside className="toolColumn rightTools">
        {toolsRight.map((tool) => (
          <button
            className="toolButton"
            key={tool.label}
            onClick={tool.label === "VOICE" ? () => setResponse("LISTENING...") : undefined}
          >
            <span className="toolIcon">{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </aside>

      {/* EON ENERGY CORE */}
      <section className="coreArea">
        <div className="outerEnergy energyOne" />
        <div className="outerEnergy energyTwo" />
        <div className="outerEnergy energyThree" />

        <div className="energyRing ringOne" />
        <div className="energyRing ringTwo" />
        <div className="energyRing ringThree" />
        <div className="energyRing ringFour" />

        <div className="energyParticles">
          {Array.from({ length: 32 }).map((_, index) => (
            <span
              key={index}
              className="particle"
              style={
                {
                  "--i": index,
                  "--angle": `${index * 11.25}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="coreHole" />

        {response && <div className="response">{response}</div>}
      </section>

      {/* COMMAND BAR */}
      <section className="bottomArea">
        <form
          className="commandBar"
          onSubmit={(event) => {
            event.preventDefault();
            submitCommand();
          }}
        >
          <span className="commandWave">▮▮▮</span>

          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Type or speak a command..."
          />

          <button type="submit" className="sendButton">
            ➤
          </button>
        </form>

        <div className="bottomControls">
          <button className="controlButton" onClick={toggleMode}>
            ⚡ &nbsp;
            {mode === "NORMAL" ? "NO LIMITS" : "EON HAS LIMITS"}
          </button>

          <button
            className="controlButton"
            onClick={() => {
              setResponse("");
              setCommand("");
              setMode("NORMAL");
            }}
          >
            ↻ &nbsp; RESET
          </button>
        </div>

        <div className="footer">
          INTELLIGENCE&nbsp;&nbsp; | &nbsp;&nbsp;EXECUTION&nbsp;&nbsp; | &nbsp;&nbsp;
          AUTONOMY&nbsp;&nbsp; | &nbsp;&nbsp;BEYOND LIMITS
        </div>
      </section>
    </main>
  );
}
