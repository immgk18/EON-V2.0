"use client";

import { useEffect, useRef } from "react";

type EnergyCoreProps = {
  state?: "idle" | "listening" | "thinking" | "speaking" | "alert";
};

export default function EnergyCore({
  state = "idle",
}: EnergyCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      const cx = width / 2;
      const cy = height / 2;

      const maxRadius = Math.min(width, height) * 0.45;

      ctx.clearRect(0, 0, width, height);

      const isAlert = state === "alert";
      const isListening = state === "listening";
      const isThinking = state === "thinking";
      const isSpeaking = state === "speaking";

      const primary = isAlert
        ? "255,48,79"
        : "255,216,74";

      /*
       * ATMOSPHERIC GLOW
       */

      const glow = ctx.createRadialGradient(
        cx,
        cy,
        maxRadius * 0.08,
        cx,
        cy,
        maxRadius
      );

      glow.addColorStop(0, `rgba(${primary},0.18)`);
      glow.addColorStop(0.25, `rgba(${primary},0.08)`);
      glow.addColorStop(0.55, `rgba(${primary},0.025)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      /*
       * ENERGY RINGS
       */

      const ringCount = 7;

      for (let i = 0; i < ringCount; i++) {
        const baseRadius =
          maxRadius * (0.48 + i * 0.055);

        const wave =
          Math.sin(frame * 0.025 + i * 1.7) *
          (isListening ? 8 : isSpeaking ? 6 : 3);

        const radius = baseRadius + wave;

        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          radius,
          frame * 0.002 * (i % 2 === 0 ? 1 : -1),
          frame * 0.002 * (i % 2 === 0 ? 1 : -1) +
            Math.PI * (1.15 + i * 0.15)
        );

        ctx.strokeStyle = `rgba(${primary},${
          0.16 + i * 0.025
        })`;

        ctx.lineWidth = i === 2 ? 2 : 1;

        ctx.shadowBlur = 12;
        ctx.shadowColor = `rgba(${primary},0.6)`;

        ctx.stroke();
      }

      /*
       * ROTATING ENERGY ARCS
       */

      for (let i = 0; i < 4; i++) {
        const radius =
          maxRadius * (0.6 + i * 0.045);

        const rotation =
          frame * 0.006 * (i % 2 === 0 ? 1 : -1);

        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          radius,
          rotation,
          rotation + Math.PI * 0.35
        );

        ctx.strokeStyle = `rgba(${primary},0.65)`;
        ctx.lineWidth = 1.5;

        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgba(${primary},0.8)`;

        ctx.stroke();
      }

      /*
       * ENERGY PARTICLES
       */

      const particleCount = isThinking ? 100 : 75;

      for (let i = 0; i < particleCount; i++) {
        const angle =
          (i / particleCount) * Math.PI * 2 +
          frame * 0.0015;

        const wave =
          Math.sin(frame * 0.018 + i * 2.4) * 10;

        const radius =
          maxRadius * 0.53 +
          wave;

        const x =
          cx + Math.cos(angle) * radius;

        const y =
          cy + Math.sin(angle) * radius;

        const size =
          0.7 +
          ((Math.sin(frame * 0.03 + i) + 1) / 2) *
            1.8;

        ctx.beginPath();

        ctx.arc(x, y, size, 0, Math.PI * 2);

        ctx.fillStyle = `rgba(${primary},${
          0.25 +
          ((Math.sin(frame * 0.03 + i) + 1) / 2) *
            0.65
        })`;

        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${primary},0.9)`;

        ctx.fill();
      }

      /*
       * CENTRAL ENERGY HALO
       */

      const haloRadius =
        maxRadius *
        (isListening
          ? 0.25
          : isSpeaking
            ? 0.23
            : 0.21);

      const halo = ctx.createRadialGradient(
        cx,
        cy,
        haloRadius * 0.1,
        cx,
        cy,
        haloRadius
      );

      halo.addColorStop(
        0,
        `rgba(${primary},0.16)`
      );

      halo.addColorStop(
        0.6,
        `rgba(${primary},0.055)`
      );

      halo.addColorStop(
        1,
        "rgba(0,0,0,0)"
      );

      ctx.fillStyle = halo;

      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        haloRadius,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
       * HOLLOW CORE
       */

      const coreRadius =
        maxRadius *
        (isListening
          ? 0.185
          : isSpeaking
            ? 0.175
            : 0.17);

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        coreRadius,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = "#010203";

      ctx.shadowBlur =
        isAlert ? 45 : 32;

      ctx.shadowColor =
        `rgba(${primary},0.8)`;

      ctx.fill();

      /*
       * CORE EDGE
       */

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        coreRadius,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        `rgba(${primary},0.9)`;

      ctx.lineWidth = 2;

      ctx.shadowBlur = 18;
      ctx.shadowColor =
        `rgba(${primary},1)`;

      ctx.stroke();

      /*
       * STATE PULSE
       */

      if (
        isListening ||
        isSpeaking ||
        isAlert
      ) {
        const pulse =
          coreRadius +
          Math.sin(frame * 0.08) * 9;

        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          pulse,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle =
          `rgba(${primary},0.22)`;

        ctx.lineWidth = 1;

        ctx.stroke();
      }

      /*
       * LISTENING WAVES
       */

      if (isListening) {
        for (let i = 0; i < 3; i++) {
          const radius =
            coreRadius +
            15 +
            i * 14 +
            ((frame * 0.9 + i * 20) % 40);

          ctx.beginPath();

          ctx.arc(
            cx,
            cy,
            radius,
            0,
            Math.PI * 2
          );

          ctx.strokeStyle =
            `rgba(${primary},${
              0.18 - i * 0.04
            })`;

          ctx.lineWidth = 1;

          ctx.stroke();
        }
      }

      /*
       * RESET SHADOW
       */

      ctx.shadowBlur = 0;

      frame++;

      animationFrame =
        requestAnimationFrame(draw);
    };

    animationFrame =
      requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener(
        "resize",
        resize
      );
    };
  }, [state]);

  return (
    <div className={`energyCore state-${state}`}>
      <canvas
        ref={canvasRef}
        className="energyCanvas"
      />

      <div className="coreCenter" />

      <div className="coreState">
        {state === "idle" && "EON"}
        {state === "listening" && "LISTENING"}
        {state === "thinking" && "PROCESSING"}
        {state === "speaking" && "RESPONDING"}
        {state === "alert" && "HIGH ALERT"}
      </div>
    </div>
  );
}
