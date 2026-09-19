"use client";

import { useEffect, useRef } from "react";

export type EnergyCoreState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "no-limits"
  | "alert";

type EnergyCoreProps = {
  state?: EnergyCoreState;
};

type DigitalFaceMode =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "no-limits";

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

    const resize = () => {
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const getMode = (): DigitalFaceMode => {
      if (state === "no-limits" || state === "alert") {
        return "no-limits";
      }

      if (state === "listening") {
        return "listening";
      }

      if (state === "thinking") {
        return "thinking";
      }

      if (state === "speaking") {
        return "speaking";
      }

      return "idle";
    };

    const roundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      const radius = Math.min(r, w / 2, h / 2);

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const glowLine = (
      points: Array<[number, number]>,
      color: string,
      glow: string,
      lineWidth = 1.5
    ) => {
      ctx.save();

      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowBlur = 10;
      ctx.shadowColor = glow;
      ctx.stroke();

      ctx.restore();
    };

    const draw = (time: number) => {
      if (width <= 0 || height <= 0) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }

      const mode = getMode();

      const isRed = mode === "no-limits";

      const primary = isRed
        ? "rgba(255, 105, 105, 1)"
        : "rgba(255, 222, 105, 1)";

      const bright = isRed
        ? "rgba(255, 225, 225, 1)"
        : "rgba(255, 250, 205, 1)";

      const soft = isRed
        ? "rgba(255, 70, 70, 0.22)"
        : "rgba(255, 215, 80, 0.20)";

      const faint = isRed
        ? "rgba(255, 80, 80, 0.10)"
        : "rgba(255, 220, 100, 0.08)";

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 18;

      const scale = Math.min(width, height) / 420;

      const float =
        Math.sin(time * 0.0018) * 3;

      const faceW = 174 * scale;
      const faceH = 202 * scale;

      const faceX = cx - faceW / 2;
      const faceY = cy - faceH / 2 + float;

      /*
       * ---------------------------------------------------------
       * DIGITAL AMBIENCE
       * ---------------------------------------------------------
       * No energy orbits. Only small UI particles around EON.
       */

      for (let i = 0; i < 34; i++) {
        const angle =
          i * 2.399 + time * 0.00008;

        const distance =
          (135 + (i % 7) * 22) * scale;

        const px =
          cx +
          Math.cos(angle) * distance;

        const py =
          cy +
          Math.sin(angle) *
            distance *
            0.78;

        const alpha =
          0.18 +
          0.18 *
            Math.sin(
              time * 0.002 + i
            );

        ctx.beginPath();
        ctx.arc(
          px,
          py,
          (i % 3 === 0 ? 1.8 : 1) * scale,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = isRed
          ? "rgba(255, 90, 90, " + alpha + ")"
          : "rgba(255, 220, 100, " + alpha + ")";

        ctx.shadowBlur = 8;
        ctx.shadowColor = primary;
        ctx.fill();
      }

      /*
       * ---------------------------------------------------------
       * DIGITAL HEAD SHADOW
       * ---------------------------------------------------------
       */

      const headGlow =
        ctx.createRadialGradient(
          cx,
          cy + float,
          faceW * 0.1,
          cx,
          cy + float,
          faceW * 1.1
        );

      headGlow.addColorStop(
        0,
        soft
      );

      headGlow.addColorStop(
        0.55,
        faint
      );

      headGlow.addColorStop(
        1,
        "rgba(0,0,0,0)"
      );

      ctx.fillStyle = headGlow;
      ctx.beginPath();

      ctx.ellipse(
        cx,
        cy + float,
        faceW * 1.02,
        faceH * 0.82,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
       * ---------------------------------------------------------
       * NECK
       * ---------------------------------------------------------
       */

      ctx.fillStyle =
        "rgba(8, 11, 19, 0.98)";

      roundRect(
        cx - 34 * scale,
        faceY + faceH - 8 * scale,
        68 * scale,
        42 * scale,
        18 * scale
      );

      ctx.fill();

      ctx.strokeStyle =
        isRed
          ? "rgba(255, 100, 100, 0.48)"
          : "rgba(255, 220, 110, 0.48)";

      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      /*
       * ---------------------------------------------------------
       * FACE
       * ---------------------------------------------------------
       */

      const faceGradient =
        ctx.createLinearGradient(
          faceX,
          faceY,
          faceX + faceW,
          faceY + faceH
        );

      faceGradient.addColorStop(
        0,
        "rgba(34, 38, 50, 0.98)"
      );

      faceGradient.addColorStop(
        0.55,
        "rgba(13, 17, 26, 0.99)"
      );

      faceGradient.addColorStop(
        1,
        "rgba(5, 8, 14, 1)"
      );

      ctx.fillStyle = faceGradient;

      ctx.beginPath();

      ctx.moveTo(
        cx,
        faceY
      );

      ctx.bezierCurveTo(
        faceX + faceW * 0.78,
        faceY,
        faceX + faceW,
        faceY + faceH * 0.22,
        faceX + faceW * 0.92,
        faceY + faceH * 0.63
      );

      ctx.bezierCurveTo(
        faceX + faceW * 0.84,
        faceY + faceH * 0.88,
        cx + faceW * 0.25,
        faceY + faceH,
        cx,
        faceY + faceH * 0.97
      );

      ctx.bezierCurveTo(
        cx - faceW * 0.25,
        faceY + faceH,
        faceX + faceW * 0.16,
        faceY + faceH * 0.88,
        faceX + faceW * 0.08,
        faceY + faceH * 0.63
      );

      ctx.bezierCurveTo(
        faceX,
        faceY + faceH * 0.22,
        faceX + faceW * 0.22,
        faceY,
        cx,
        faceY
      );

      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle =
        isRed
          ? "rgba(255, 110, 110, 0.70)"
          : "rgba(255, 225, 120, 0.68)";

      ctx.lineWidth =
        1.25 * scale;

      ctx.shadowBlur = 14;
      ctx.shadowColor = primary;
      ctx.stroke();

      /*
       * ---------------------------------------------------------
       * DIGITAL FACE GRID
       * ---------------------------------------------------------
       */

      ctx.save();

      ctx.globalAlpha = 0.12;

      ctx.strokeStyle = primary;
      ctx.lineWidth = 0.45 * scale;

      for (
        let x = faceX;
        x <= faceX + faceW;
        x += 14 * scale
      ) {
        ctx.beginPath();
        ctx.moveTo(x, faceY + 8 * scale);
        ctx.lineTo(
          x,
          faceY + faceH - 8 * scale
        );
        ctx.stroke();
      }

      for (
        let y = faceY;
        y <= faceY + faceH;
        y += 14 * scale
      ) {
        ctx.beginPath();
        ctx.moveTo(faceX + 8 * scale, y);
        ctx.lineTo(
          faceX + faceW - 8 * scale,
          y
        );
        ctx.stroke();
      }

      ctx.restore();

      /*
       * ---------------------------------------------------------
       * HAIR
       * ---------------------------------------------------------
       */

      const hairColor =
        "rgba(4, 7, 14, 0.99)";

      ctx.fillStyle = hairColor;

      ctx.beginPath();

      ctx.moveTo(
        faceX + 9 * scale,
        faceY + 62 * scale
      );

      ctx.bezierCurveTo(
        faceX + 2 * scale,
        faceY + 20 * scale,
        faceX + 34 * scale,
        faceY - 18 * scale,
        cx - 42 * scale,
        faceY + 2 * scale
      );

      ctx.lineTo(
        cx - 25 * scale,
        faceY - 22 * scale
      );

      ctx.lineTo(
        cx - 6 * scale,
        faceY + 1 * scale
      );

      ctx.lineTo(
        cx + 10 * scale,
        faceY - 29 * scale
      );

      ctx.lineTo(
        cx + 24 * scale,
        faceY - 1 * scale
      );

      ctx.lineTo(
        cx + 53 * scale,
        faceY - 20 * scale
      );

      ctx.lineTo(
        cx + 45 * scale,
        faceY + 13 * scale
      );

      ctx.bezierCurveTo(
        faceX + faceW - 16 * scale,
        faceY + 6 * scale,
        faceX + faceW + 2 * scale,
        faceY + 38 * scale,
        faceX + faceW - 10 * scale,
        faceY + 72 * scale
      );

      ctx.bezierCurveTo(
        faceX + faceW - 40 * scale,
        faceY + 52 * scale,
        faceX + 27 * scale,
        faceY + 55 * scale,
        faceX + 9 * scale,
        faceY + 62 * scale
      );

      ctx.closePath();
      ctx.fill();

      /*
       * Hair digital highlights
       */

      glowLine(
        [
          [
            cx - 70 * scale,
            faceY + 36 * scale,
          ],
          [
            cx - 48 * scale,
            faceY + 4 * scale,
          ],
          [
            cx - 25 * scale,
            faceY - 4 * scale,
          ],
        ],
        primary.replace("1)", "0.42)"),
        primary.replace("1)", "0.25)"),
        1.2 * scale
      );

      glowLine(
        [
          [
            cx - 4 * scale,
            faceY + 2 * scale,
          ],
          [
            cx + 9 * scale,
            faceY - 18 * scale,
          ],
          [
            cx + 23 * scale,
            faceY + 4 * scale,
          ],
        ],
        primary.replace("1)", "0.52)"),
        primary.replace("1)", "0.25)"),
        1.2 * scale
      );

      glowLine(
        [
          [
            cx + 30 * scale,
            faceY + 5 * scale,
          ],
          [
            cx + 53 * scale,
            faceY - 8 * scale,
          ],
          [
            cx + 62 * scale,
            faceY + 31 * scale,
          ],
        ],
        primary.replace("1)", "0.40)"),
        primary.replace("1)", "0.25)"),
        1.2 * scale
      );

      /*
       * ---------------------------------------------------------
       * EYEBROWS
       * ---------------------------------------------------------
       */

      glowLine(
        [
          [
            cx - 58 * scale,
            cy - 13 * scale + float,
          ],
          [
            cx - 32 * scale,
            cy - 20 * scale + float,
          ],
          [
            cx - 13 * scale,
            cy - 16 * scale + float,
          ],
        ],
        primary,
        primary,
        2 * scale
      );

      glowLine(
        [
          [
            cx + 13 * scale,
            cy - 16 * scale + float,
          ],
          [
            cx + 32 * scale,
            cy - 20 * scale + float,
          ],
          [
            cx + 58 * scale,
            cy - 13 * scale + float,
          ],
        ],
        primary,
        primary,
        2 * scale
      );

      /*
       * ---------------------------------------------------------
       * EYES
       * ---------------------------------------------------------
       */

      const eyeY =
        cy + 16 * scale + float;

      const eyeDistance =
        39 * scale;

      const eyeW =
        46 * scale;

      const eyeH =
        31 * scale;

      const blink =
        mode === "speaking"
          ? 1
          : Math.sin(
              time * 0.00075
            ) > 0.985
          ? 0.12
          : 1;

      const drawEye = (
        eyeX: number,
        flip = false
      ) => {
        ctx.save();

        ctx.translate(
          eyeX,
          eyeY
        );

        ctx.scale(
          1,
          blink
        );

        /*
         * Outer digital eye.
         */

        ctx.beginPath();

        ctx.moveTo(
          -eyeW / 2,
          0
        );

        ctx.quadraticCurveTo(
          -eyeW * 0.18,
          -eyeH / 2,
          0,
          -eyeH * 0.42
        );

        ctx.quadraticCurveTo(
          eyeW * 0.18,
          -eyeH / 2,
          eyeW / 2,
          0
        );

        ctx.quadraticCurveTo(
          eyeW * 0.18,
          eyeH / 2,
          0,
          eyeH * 0.42
        );

        ctx.quadraticCurveTo(
          -eyeW * 0.18,
          eyeH / 2,
          -eyeW / 2,
          0
        );

        ctx.closePath();

        ctx.fillStyle =
          "rgba(2, 5, 10, 0.92)";

        ctx.fill();

        ctx.strokeStyle =
          primary;

        ctx.lineWidth =
          1.35 * scale;

        ctx.shadowBlur = 12;
        ctx.shadowColor = primary;
        ctx.stroke();

        /*
         * Iris.
         */

        const irisSize =
          10 * scale;

        const irisGradient =
          ctx.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            irisSize * 1.8
          );

        irisGradient.addColorStop(
          0,
          bright
        );

        irisGradient.addColorStop(
          0.35,
          primary
        );

        irisGradient.addColorStop(
          1,
          "rgba(0,0,0,0)"
        );

        ctx.fillStyle =
          irisGradient;

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          irisSize * 1.8,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          irisSize,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(7, 10, 17, 1)";

        ctx.fill();

        ctx.strokeStyle =
          primary;

        ctx.lineWidth =
          1 * scale;

        ctx.stroke();

        /*
         * Pupil.
         */

        const pupilPulse =
          1 +
          Math.sin(
            time * 0.003
          ) *
            0.08;

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          3.5 * scale * pupilPulse,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          bright;

        ctx.shadowBlur = 12;
        ctx.shadowColor = primary;
        ctx.fill();

        /*
         * Digital eye reflection.
         */

        ctx.beginPath();

        ctx.arc(
          -3 * scale,
          -3 * scale,
          1.4 * scale,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(255,255,255,0.8)";

        ctx.shadowBlur = 0;
        ctx.fill();

        /*
         * Tiny scan ticks.
         */

        ctx.strokeStyle =
          primary.replace(
            "1)",
            "0.45)"
          );

        ctx.lineWidth =
          0.7 * scale;

        for (
          let i = -1;
          i <= 1;
          i++
        ) {
          ctx.beginPath();

          ctx.moveTo(
            flip
              ? eyeW * 0.34
              : -eyeW * 0.34,
            i * 7 * scale
          );

          ctx.lineTo(
            flip
              ? eyeW * 0.43
              : -eyeW * 0.43,
            i * 7 * scale
          );

          ctx.stroke();
        }

        ctx.restore();
      };

      drawEye(
        cx - eyeDistance,
        false
      );

      drawEye(
        cx + eyeDistance,
        true
      );

      /*
       * ---------------------------------------------------------
       * NOSE
       * ---------------------------------------------------------
       */

      glowLine(
        [
          [
            cx,
            cy + 27 * scale + float,
          ],
          [
            cx - 3 * scale,
            cy + 51 * scale + float,
          ],
          [
            cx + 5 * scale,
            cy + 57 * scale + float,
          ],
        ],
        primary.replace("1)", "0.45)"),
        primary.replace("1)", "0.18)"),
        1 * scale
      );

      /*
       * ---------------------------------------------------------
       * MOUTH
       * ---------------------------------------------------------
       */

      const mouthY =
        cy + 76 * scale + float;

      const speakingWave =
        mode === "speaking"
          ? Math.abs(
              Math.sin(
                time * 0.014
              )
            ) *
            7 *
            scale
          : 0;

      ctx.save();

      ctx.beginPath();

      ctx.moveTo(
        cx - 25 * scale,
        mouthY
      );

      ctx.quadraticCurveTo(
        cx,
        mouthY +
          11 * scale +
          speakingWave,
        cx + 25 * scale,
        mouthY
      );

      ctx.strokeStyle =
        bright;

      ctx.lineWidth =
        1.7 * scale;

      ctx.lineCap = "round";

      ctx.shadowBlur = 10;
      ctx.shadowColor = primary;
      ctx.stroke();

      ctx.restore();

      /*
       * ---------------------------------------------------------
       * CHEEK DIGITAL MARKERS
       * ---------------------------------------------------------
       */

      const drawCheek = (
        x: number,
        y: number,
        direction: number
      ) => {
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle =
            primary.replace(
              "1)",
              String(
                0.28 -
                  i * 0.06
              ) + ")"
            );

          ctx.fillRect(
            x +
              direction *
                i *
                5 *
                scale,
            y +
              i *
                4 *
                scale,
            2.5 * scale,
            2.5 * scale
          );
        }
      };

      drawCheek(
        cx - 66 * scale,
        cy + 52 * scale + float,
        -1
      );

      drawCheek(
        cx + 66 * scale,
        cy + 52 * scale + float,
        1
      );

      /*
       * ---------------------------------------------------------
       * FACE SCAN LINE
       * ---------------------------------------------------------
       */

      const scanTravel =
        ((time * 0.08) %
          (faceH + 30 * scale)) -
        15 * scale;

      ctx.save();

      ctx.beginPath();

      ctx.rect(
        faceX,
        faceY,
        faceW,
        faceH
      );

      ctx.clip();

      ctx.strokeStyle =
        primary.replace(
          "1)",
          "0.13)"
        );

      ctx.lineWidth =
        1 * scale;

      ctx.beginPath();

      ctx.moveTo(
        faceX,
        faceY + scanTravel
      );

      ctx.lineTo(
        faceX + faceW,
        faceY + scanTravel
      );

      ctx.stroke();

      ctx.restore();

      /*
       * ---------------------------------------------------------
       * SMALL DIGITAL CORNER MARKERS
       * ---------------------------------------------------------
       */

      const marker =
        16 * scale;

      const offset =
        9 * scale;

      const drawMarker = (
        x: number,
        y: number,
        sx: number,
        sy: number
      ) => {
        glowLine(
          [
            [x, y],
            [x + sx * marker, y],
            [x + sx * marker, y + sy * marker],
          ],
          primary.replace(
            "1)",
            "0.42)"
          ),
          primary.replace(
            "1)",
            "0.18)"
          ),
          0.8 * scale
        );
      };

      drawMarker(
        faceX - offset,
        faceY + marker,
        1,
        -1
      );

      drawMarker(
        faceX + faceW + offset,
        faceY + marker,
        -1,
        -1
      );

      drawMarker(
        faceX - offset,
        faceY + faceH - marker,
        1,
        1
      );

      drawMarker(
        faceX + faceW + offset,
        faceY + faceH - marker,
        -1,
        1
      );

      /*
       * ---------------------------------------------------------
       * STATUS LABEL
       * ---------------------------------------------------------
       */

      const status =
        mode === "no-limits"
          ? "NO LIMITS"
          : mode === "listening"
          ? "LISTENING"
          : mode === "thinking"
          ? "THINKING"
          : mode === "speaking"
          ? "SPEAKING"
          : "ONLINE";

      const statusY =
        faceY + faceH + 45 * scale;

      ctx.save();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font =
        "600 " +
        Math.max(
          8,
          9 * scale
        ) +
        "px Arial, sans-serif";

      ctx.fillStyle =
        primary.replace(
          "1)",
          "0.78)"
        );

      ctx.shadowBlur = 8;
      ctx.shadowColor = primary;

      ctx.fillText(
        status,
        cx,
        statusY
      );

      ctx.restore();

      /*
       * ---------------------------------------------------------
       * ACTIVITY INDICATOR
       * ---------------------------------------------------------
       */

      if (
        mode === "thinking" ||
        mode === "listening" ||
        mode === "speaking"
      ) {
        const bars =
          mode === "thinking"
            ? 5
            : 4;

        const barWidth =
          3 * scale;

        const gap =
          5 * scale;

        const totalWidth =
          bars * barWidth +
          (bars - 1) * gap;

        const startX =
          cx -
          totalWidth / 2;

        for (let i = 0; i < bars; i++) {
          const level =
            5 +
            Math.abs(
              Math.sin(
                time * 0.008 +
                  i * 0.9
              )
            ) *
              12;

          roundRect(
            startX +
              i *
                (barWidth + gap),
            statusY +
              13 * scale -
              level / 2,
            barWidth,
            level,
            2 * scale
          );

          ctx.fillStyle =
            primary.replace(
              "1)",
              "0.72)"
            );

          ctx.fill();
        }
      }

      animationFrame =
        requestAnimationFrame(draw);
    };

    animationFrame =
      requestAnimationFrame(draw);

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
        aria-label="EON digital AI face"
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
