"use client";

import { useEffect, useRef } from "react";

export type EnergyCoreState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "alert";

type EnergyCoreProps = {
  state?: EnergyCoreState;
};

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
  orbit: number;
};

export default function EnergyCore({
  state = "idle",
}: EnergyCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    let animationFrame = 0;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const particles: Particle[] = [];

    const particleCount = 170;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 0.25 + Math.random() * 0.7,
        speed:
          (0.00025 + Math.random() * 0.0008) *
          (Math.random() > 0.5 ? 1 : -1),
        size: 0.7 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.8,
        orbit: 0.7 + Math.random() * 0.6,
      });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    };

    resize();

    window.addEventListener("resize", resize);

    const getModeValues = () => {
      if (state === "alert") {
        return {
          core: "rgba(255, 45, 45, 1)",
          bright: "rgba(255, 130, 130, 1)",
          glow: "rgba(255, 35, 35, 0.35)",
          ring: "rgba(255, 55, 55, 0.65)",
        };
      }

      if (state === "thinking") {
        return {
          core: "rgba(255, 205, 50, 1)",
          bright: "rgba(255, 245, 160, 1)",
          glow: "rgba(255, 205, 50, 0.42)",
          ring: "rgba(255, 215, 70, 0.75)",
        };
      }

      if (state === "speaking") {
        return {
          core: "rgba(255, 215, 65, 1)",
          bright: "rgba(255, 250, 190, 1)",
          glow: "rgba(255, 215, 65, 0.48)",
          ring: "rgba(255, 220, 85, 0.85)",
        };
      }

      if (state === "listening") {
        return {
          core: "rgba(255, 225, 80, 1)",
          bright: "rgba(255, 250, 180, 1)",
          glow: "rgba(255, 225, 80, 0.45)",
          ring: "rgba(255, 225, 90, 0.85)",
        };
      }

      return {
        core: "rgba(255, 215, 55, 1)",
        bright: "rgba(255, 245, 155, 1)",
        glow: "rgba(255, 210, 50, 0.32)",
        ring: "rgba(255, 215, 70, 0.65)",
      };
    };

    const drawGlow = (
      x: number,
      y: number,
      radius: number,
      color: string,
      alpha: number
    ) => {
      const gradient = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radius
      );

      gradient.addColorStop(
        0,
        color.replace("1)", `${alpha})`)
      );

      gradient.addColorStop(
        0.35,
        color.replace("1)", `${alpha * 0.35})`)
      );

      gradient.addColorStop(
        1,
        color.replace("1)", "0)")
      );

      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const draw = (time: number) => {
      if (width <= 0 || height <= 0) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }

      const colors = getModeValues();

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      const centerX = width / 2;
      const centerY = height / 2;

      const baseSize =
        Math.min(width, height) * 0.27;

      const pulse =
        1 +
        Math.sin(time * 0.002) * 0.025;

      const activePulse =
        state === "listening"
          ? 1 +
            Math.sin(time * 0.009) * 0.075
          : state === "thinking"
          ? 1 +
            Math.sin(time * 0.006) * 0.055
          : state === "speaking"
          ? 1 +
            Math.sin(time * 0.012) * 0.09
          : state === "alert"
          ? 1 +
            Math.sin(time * 0.018) * 0.11
          : pulse;

      const coreRadius =
        baseSize * activePulse;

      /* =========================================================
         CENTRAL ATMOSPHERE
         ========================================================= */

      drawGlow(
        centerX,
        centerY,
        coreRadius * 2.9,
        colors.core,
        state === "alert"
          ? 0.3
          : 0.18
      );

      drawGlow(
        centerX,
        centerY,
        coreRadius * 1.65,
        colors.core,
        state === "alert"
          ? 0.32
          : 0.22
      );

      /* =========================================================
         LARGE ORBIT RINGS
         ========================================================= */

      const ringCount = 9;

      for (let i = 0; i < ringCount; i++) {
        const radius =
          coreRadius *
          (1.18 + i * 0.23);

        const rotation =
          time *
            0.00012 *
            (i % 2 === 0 ? 1 : -1);

        ctx.save();

        ctx.translate(
          centerX,
          centerY
        );

        ctx.rotate(rotation);

        ctx.beginPath();

        ctx.ellipse(
          0,
          0,
          radius,
          radius *
            (0.72 + i * 0.018),
          0,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle =
          colors.ring.replace(
            "0.65",
            `${0.09 + i * 0.018}`
          );

        ctx.lineWidth =
          i === 0 ? 1.5 : 0.8;

        ctx.shadowBlur =
          i < 3 ? 12 : 5;

        ctx.shadowColor =
          colors.core;

        ctx.stroke();

        ctx.restore();
      }

      /* =========================================================
         FAST ORBITAL ARCS
         ========================================================= */

      for (let i = 0; i < 5; i++) {
        const radius =
          coreRadius *
          (1.42 + i * 0.26);

        const rotation =
          time *
            0.00065 *
            (i % 2 === 0 ? 1 : -1);

        ctx.save();

        ctx.translate(
          centerX,
          centerY
        );

        ctx.rotate(rotation);

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          radius,
          -0.55,
          0.72
        );

        ctx.strokeStyle =
          colors.ring.replace(
            "0.65",
            "0.38"
          );

        ctx.lineWidth =
          i === 0 ? 1.7 : 1;

        ctx.shadowBlur = 12;
        ctx.shadowColor =
          colors.core;

        ctx.stroke();

        ctx.restore();
      }

      /* =========================================================
         ORBIT PARTICLES
         ========================================================= */

      for (const particle of particles) {
        particle.angle +=
          particle.speed *
          16;

        const radius =
          coreRadius *
          (1.2 +
            particle.radius *
              2.2);

        const px =
          centerX +
          Math.cos(
            particle.angle
          ) *
            radius;

        const py =
          centerY +
          Math.sin(
            particle.angle
          ) *
            radius *
            particle.orbit;

        const twinkle =
          0.45 +
          0.55 *
            Math.sin(
              time *
                0.002 +
                particle.angle
            );

        ctx.beginPath();

        ctx.arc(
          px,
          py,
          particle.size,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          colors.bright.replace(
            "1)",
            `${particle.alpha * twinkle})`
          );

        ctx.shadowBlur = 10;
        ctx.shadowColor =
          colors.core;

        ctx.fill();
      }

      /* =========================================================
         CORE OUTER GLOW
         ========================================================= */

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        coreRadius * 1.08,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        colors.ring;

      ctx.lineWidth = 2;

      ctx.shadowBlur =
        state === "alert"
          ? 30
          : 20;

      ctx.shadowColor =
        colors.core;

      ctx.stroke();

      /* =========================================================
         CORE BODY
         ========================================================= */

      const coreGradient =
        ctx.createRadialGradient(
          centerX,
          centerY,
          coreRadius * 0.05,
          centerX,
          centerY,
          coreRadius
        );

      coreGradient.addColorStop(
        0,
        "rgba(0, 0, 0, 0.98)"
      );

      coreGradient.addColorStop(
        0.58,
        "rgba(0, 0, 0, 0.97)"
      );

      coreGradient.addColorStop(
        0.83,
        colors.glow
      );

      coreGradient.addColorStop(
        1,
        colors.core
      );

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        coreRadius,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        coreGradient;

      ctx.fill();

      /* =========================================================
         HOLLOW CORE EDGE
         ========================================================= */

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        coreRadius * 0.93,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        colors.bright;

      ctx.lineWidth = 2.5;

      ctx.shadowBlur = 24;

      ctx.shadowColor =
        colors.core;

      ctx.stroke();

      /* =========================================================
         INNER RING
         ========================================================= */

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        coreRadius * 0.78,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        colors.ring.replace(
          "0.65",
          "0.32"
        );

      ctx.lineWidth = 1;

      ctx.shadowBlur = 10;

      ctx.stroke();

      /* =========================================================
         CORE LIGHT POINT
         ========================================================= */

      const pointGlow =
        ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          coreRadius * 0.32
        );

      pointGlow.addColorStop(
        0,
        "rgba(255, 255, 220, 0.22)"
      );

      pointGlow.addColorStop(
        0.5,
        colors.glow
      );

      pointGlow.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
      );

      ctx.fillStyle =
        pointGlow;

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        coreRadius * 0.32,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /* =========================================================
         CROSS ENERGY LINES
         ========================================================= */

      const lineLength =
        coreRadius * 2.25;

      const lineAlpha =
        state === "alert"
          ? 0.65
          : 0.3;

      ctx.save();

      ctx.strokeStyle =
        colors.core.replace(
          "1)",
          `${lineAlpha})`
        );

      ctx.lineWidth = 0.7;

      ctx.shadowBlur = 8;

      ctx.shadowColor =
        colors.core;

      ctx.beginPath();

      ctx.moveTo(
        centerX -
          lineLength,
        centerY
      );

      ctx.lineTo(
        centerX +
          lineLength,
        centerY
      );

      ctx.stroke();

      ctx.beginPath();

      ctx.moveTo(
        centerX,
        centerY -
          lineLength
      );

      ctx.lineTo(
        centerX,
        centerY +
          lineLength
      );

      ctx.stroke();

      ctx.restore();

      /* =========================================================
         LISTENING WAVES
         ========================================================= */

      if (state === "listening") {
        for (let i = 0; i < 4; i++) {
          const wave =
            ((time * 0.18 +
              i * 55) %
              220);

          const radius =
            coreRadius +
            wave;

          const alpha =
            Math.max(
              0,
              0.42 -
                wave /
                  520
            );

          ctx.beginPath();

          ctx.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
          );

          ctx.strokeStyle =
            colors.core.replace(
              "1)",
              `${alpha})`
            );

          ctx.lineWidth = 1.2;

          ctx.stroke();
        }
      }

      /* =========================================================
         THINKING ENERGY
         ========================================================= */

      if (state === "thinking") {
        for (let i = 0; i < 6; i++) {
          const rotation =
            time *
              0.001 +
            i;

          const radius =
            coreRadius *
            (1.35 +
              i * 0.12);

          const x =
            centerX +
            Math.cos(
              rotation
            ) *
              radius;

          const y =
            centerY +
            Math.sin(
              rotation
            ) *
              radius;

          ctx.beginPath();

          ctx.arc(
            x,
            y,
            2.2,
            0,
            Math.PI * 2
          );

          ctx.fillStyle =
            colors.bright;

          ctx.shadowBlur = 18;

          ctx.shadowColor =
            colors.core;

          ctx.fill();
        }
      }

      /* =========================================================
         SPEAKING PULSE
         ========================================================= */

      if (state === "speaking") {
        const pulseRadius =
          coreRadius *
          (1.2 +
            Math.sin(
              time * 0.012
            ) *
              0.15);

        ctx.beginPath();

        ctx.arc(
          centerX,
          centerY,
          pulseRadius,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle =
          colors.core.replace(
            "1)",
            "0.35)"
          );

        ctx.lineWidth = 2;

        ctx.shadowBlur = 18;

        ctx.shadowColor =
          colors.core;

        ctx.stroke();
      }

      /* =========================================================
         ALERT RIPPLE
         ========================================================= */

      if (state === "alert") {
        for (let i = 0; i < 3; i++) {
          const ripple =
            ((time * 0.25 +
              i * 90) %
              300);

          const radius =
            coreRadius +
            ripple;

          const alpha =
            Math.max(
              0,
              0.55 -
                ripple /
                  550
            );

          ctx.beginPath();

          ctx.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
          );

          ctx.strokeStyle =
            `rgba(255, 40, 40, ${alpha})`;

          ctx.lineWidth = 1.5;

          ctx.shadowBlur = 15;

          ctx.shadowColor =
            "rgba(255, 40, 40, 0.8)";

          ctx.stroke();
        }
      }

      /* =========================================================
         EON TEXT
         ========================================================= */

      const textY =
        centerY +
        coreRadius *
          1.55;

      ctx.save();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font =
        "700 26px Arial, sans-serif";

      ctx.letterSpacing = "8px";

      ctx.fillStyle =
        colors.bright;

      ctx.shadowBlur = 18;

      ctx.shadowColor =
        colors.core;

      ctx.fillText(
        "EON",
        centerX,
        textY
      );

      ctx.font =
        "600 9px Arial, sans-serif";

      ctx.shadowBlur = 10;

      ctx.fillStyle =
        colors.core.replace(
          "1)",
          "0.78)"
        );

      const stateText =
        state === "listening"
          ? "LISTENING..."
          : state === "thinking"
          ? "THINKING..."
          : state === "speaking"
          ? "SPEAKING..."
          : state === "alert"
          ? "HIGH ALERT"
          : "ONLINE";

      ctx.fillText(
        stateText,
        centerX,
        textY + 26
      );

      ctx.restore();

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
      window.removeEventListener(
        "resize",
        resize
      );

      cancelAnimationFrame(
        animationFrame
      );
    };
  }, [state]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "420px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label="EON Energy Core"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          minHeight: "420px",
        }}
      />
    </div>
  );
}
