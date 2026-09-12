"use client";

import { useEffect, useRef } from "react";

type EnergyCoreProps = {
  state?: "idle" | "listening" | "thinking" | "speaking" | "alert";
};

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  offset: number;
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

    let animationFrame = 0;
    let frame = 0;

    const particles: Particle[] = Array.from(
      { length: 180 },
      (_, i) => ({
        angle: (i / 180) * Math.PI * 2,
        radius: 0.48 + Math.random() * 0.16,
        speed:
          (Math.random() * 0.0009 + 0.00035) *
          (i % 2 === 0 ? 1 : -1),
        size: Math.random() * 1.7 + 0.4,
        offset: Math.random() * Math.PI * 2,
      })
    );

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

      const maxRadius = Math.min(width, height) * 0.46;

      const alert = state === "alert";
      const listening = state === "listening";
      const thinking = state === "thinking";
      const speaking = state === "speaking";

      const primary = alert
        ? "255,48,79"
        : "255,216,74";

      ctx.clearRect(0, 0, width, height);

      /* =====================================================
         AMBIENT CORE GLOW
         ===================================================== */

      const breathing =
        Math.sin(frame * 0.035) * 0.5 + 0.5;

      const ambientRadius =
        maxRadius *
        (0.72 + breathing * 0.06);

      const ambient = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        ambientRadius
      );

      ambient.addColorStop(
        0,
        `rgba(${primary},${alert ? 0.13 : 0.10})`
      );

      ambient.addColorStop(
        0.22,
        `rgba(${primary},0.055)`
      );

      ambient.addColorStop(
        0.52,
        `rgba(${primary},0.018)`
      );

      ambient.addColorStop(
        1,
        "rgba(0,0,0,0)"
      );

      ctx.fillStyle = ambient;

      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        ambientRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      /* =====================================================
         OUTER ENERGY RINGS
         ===================================================== */

      const ringCount = 10;

      for (let i = 0; i < ringCount; i++) {
        const base =
          maxRadius *
          (0.47 + i * 0.033);

        const movement =
          Math.sin(
            frame * 0.025 +
              i * 1.25
          );

        const stateBoost = listening
          ? 10
          : speaking
            ? 7
            : thinking
              ? 5
              : alert
                ? 9
                : 2;

        const radius =
          base +
          movement * stateBoost;

        const direction =
          i % 2 === 0 ? 1 : -1;

        const rotation =
          frame *
          0.0018 *
          direction;

        const arcLength =
          Math.PI *
          (0.75 + (i % 4) * 0.17);

        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          radius,
          rotation,
          rotation + arcLength
        );

        ctx.strokeStyle =
          `rgba(${primary},${
            0.10 + i * 0.018
          })`;

        ctx.lineWidth =
          i === 3 || i === 7
            ? 2
            : 0.8;

        ctx.shadowBlur =
          i === 3 || i === 7
            ? 16
            : 8;

        ctx.shadowColor =
          `rgba(${primary},0.7)`;

        ctx.stroke();
      }

      /* =====================================================
         FAST ORBITAL ARCS
         ===================================================== */

      const orbitSpeed = thinking
        ? 0.010
        : speaking
          ? 0.007
          : alert
            ? 0.012
            : 0.004;

      for (let i = 0; i < 6; i++) {
        const radius =
          maxRadius *
          (0.54 + i * 0.035);

        const rotation =
          frame *
          orbitSpeed *
          (i % 2 === 0 ? 1 : -1);

        const length =
          Math.PI *
          (0.18 + (i % 3) * 0.08);

        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          radius,
          rotation,
          rotation + length
        );

        ctx.strokeStyle =
          `rgba(${primary},${
            alert ? 0.75 : 0.48
          })`;

        ctx.lineWidth =
          i === 2 ? 2 : 1;

        ctx.shadowBlur = 18;
        ctx.shadowColor =
          `rgba(${primary},0.9)`;

        ctx.stroke();
      }

      /* =====================================================
         PARTICLE FIELD
         ===================================================== */

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        const stateSpeed = thinking
          ? 3.2
          : speaking
            ? 2.2
            : listening
              ? 1.7
              : alert
                ? 4
                : 1;

        particle.angle +=
          particle.speed * stateSpeed;

        const wave =
          Math.sin(
            frame * 0.025 +
              particle.offset
          ) * 0.018;

        const radius =
          maxRadius *
          (particle.radius + wave);

        const x =
          cx +
          Math.cos(particle.angle) *
            radius;

        const y =
          cy +
          Math.sin(particle.angle) *
            radius;

        const pulse =
          Math.sin(
            frame * 0.045 +
              particle.offset
          );

        const size =
          particle.size *
          (0.65 + (pulse + 1) * 0.3);

        const alpha =
          0.2 +
          (pulse + 1) * 0.32;

        ctx.beginPath();

        ctx.arc(
          x,
          y,
          size,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(${primary},${alpha})`;

        ctx.shadowBlur = 10;
        ctx.shadowColor =
          `rgba(${primary},0.9)`;

        ctx.fill();
      }

      /* =====================================================
         LISTENING WAVE SYSTEM
         ===================================================== */

      if (listening) {
        for (let i = 0; i < 5; i++) {
          const progress =
            ((frame * 0.012 + i * 0.2) % 1);

          const radius =
            maxRadius *
            (0.18 + progress * 0.42);

          const alpha =
            (1 - progress) * 0.25;

          ctx.beginPath();

          ctx.arc(
            cx,
            cy,
            radius,
            0,
            Math.PI * 2
          );

          ctx.strokeStyle =
            `rgba(${primary},${alpha})`;

          ctx.lineWidth = 1;

          ctx.shadowBlur = 12;
          ctx.shadowColor =
            `rgba(${primary},0.7)`;

          ctx.stroke();
        }
      }

      /* =====================================================
         THINKING ENERGY
         ===================================================== */

      if (thinking) {
        for (let i = 0; i < 3; i++) {
          const radius =
            maxRadius *
            (0.31 + i * 0.07);

          const rotation =
            frame *
            0.015 *
            (i % 2 === 0 ? 1 : -1);

          ctx.beginPath();

          ctx.arc(
            cx,
            cy,
            radius,
            rotation,
            rotation + Math.PI * 0.55
          );

          ctx.strokeStyle =
            `rgba(${primary},${
              0.22 + i * 0.08
            })`;

          ctx.lineWidth = 1.5;

          ctx.shadowBlur = 20;
          ctx.shadowColor =
            `rgba(${primary},0.8)`;

          ctx.stroke();
        }
      }

      /* =====================================================
         SPEAKING PULSE
         ===================================================== */

      if (speaking) {
        const pulse =
          Math.sin(frame * 0.11);

        const radius =
          maxRadius *
          (0.20 + pulse * 0.025);

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
            0.20 + (pulse + 1) * 0.10
          })`;

        ctx.lineWidth = 1.5;

        ctx.shadowBlur = 22;
        ctx.shadowColor =
          `rgba(${primary},1)`;

        ctx.stroke();
      }

      /* =====================================================
         INNER HALO
         ===================================================== */

      const innerPulse =
        Math.sin(frame * 0.045);

      const haloRadius =
        maxRadius *
        (0.22 +
          innerPulse * 0.012 +
          (listening ? 0.025 : 0));

      const halo =
        ctx.createRadialGradient(
          cx,
          cy,
          0,
          cx,
          cy,
          haloRadius
        );

      halo.addColorStop(
        0,
        `rgba(${primary},0.14)`
      );

      halo.addColorStop(
        0.45,
        `rgba(${primary},0.045)`
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

      /* =====================================================
         BLACK CORE
         ===================================================== */

      const corePulse =
        Math.sin(frame * 0.04);

      const coreRadius =
        maxRadius *
        (0.165 +
          corePulse * 0.004 +
          (listening ? 0.018 : 0) +
          (speaking ? 0.012 : 0));

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
        alert ? 55 : 38;

      ctx.shadowColor =
        `rgba(${primary},0.9)`;

      ctx.fill();

      /* =====================================================
         CORE EDGE
         ===================================================== */

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        coreRadius,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        `rgba(${primary},0.95)`;

      ctx.lineWidth =
        alert ? 2.5 : 1.8;

      ctx.shadowBlur =
        alert ? 30 : 20;

      ctx.shadowColor =
        `rgba(${primary},1)`;

      ctx.stroke();

      /* =====================================================
         HIGH ALERT CORE RIPPLES
         ===================================================== */

      if (alert) {
        for (let i = 0; i < 4; i++) {
          const progress =
            ((frame * 0.018 + i * 0.25) % 1);

          const radius =
            coreRadius +
            15 +
            progress * maxRadius * 0.38;

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
              (1 - progress) * 0.32
            })`;

          ctx.lineWidth = 1;

          ctx.shadowBlur = 16;
          ctx.shadowColor =
            `rgba(${primary},1)`;

          ctx.stroke();
        }
      }

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
    <div
      className={`energyCore state-${state}`}
    >
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
