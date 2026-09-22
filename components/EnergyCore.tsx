"use client";

import { useEffect, useRef, useState } from "react";

export type EnergyCoreState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "no-limits"
  | "alert";

type EnergyCoreProps = {
  state?: EnergyCoreState;
  playfulCommand?: string;
  immersive?: boolean;
};

type Reaction = {
  blink: number;
  mouth: number;
  lookX: number;
  lookY: number;
};

type Tracker = {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: any) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close?: () => void;
};

declare global {
  interface Window {
    FaceMesh?: new (options: {
      locateFile: (file: string) => string;
    }) => Tracker;
    Hands?: new (options: {
      locateFile: (file: string) => string;
    }) => Tracker;
  }
}

export default function EnergyCore({
  state = "idle",
  playfulCommand = "",
  immersive = false,
}: EnergyCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const faceRef = useRef<Tracker | null>(null);
  const handsRef = useRef<Tracker | null>(null);
  const frameRef = useRef<number | null>(null);
  const startingCameraRef = useRef(false);

  const reactionRef = useRef<Reaction>({
    blink: 0,
    mouth: 0,
    lookX: 0,
    lookY: 0,
  });

  const pointerRef = useRef({
    x: 0,
    y: 0,
    active: false,
  });

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const loadLibrary = (
    id: string,
    src: string
  ) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        'script[data-eon-vision="' + id + '"]'
      );

      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.dataset.eonVision = id;
      script.src = src;
      script.async = true;

      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error(id + " failed to load."));

      document.head.appendChild(script);
    });

  const dist = (a: any, b: any) =>
    a && b
      ? Math.hypot(a.x - b.x, a.y - b.y)
      : 0;

  const eyeRatio = (
    points: any[],
    ids: number[]
  ) => {
    const p1 = points[ids[0]];
    const p2 = points[ids[1]];
    const p3 = points[ids[2]];
    const p4 = points[ids[3]];
    const p5 = points[ids[4]];
    const p6 = points[ids[5]];

    if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) {
      return 1;
    }

    const horizontal = dist(p1, p4);

    if (!horizontal) return 1;

    return (
      (dist(p2, p6) + dist(p3, p5)) /
      (2 * horizontal)
    );
  };

  const stopCamera = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    faceRef.current?.close?.();
    handsRef.current?.close?.();

    faceRef.current = null;
    handsRef.current = null;

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    reactionRef.current = {
      blink: 0,
      mouth: 0,
      lookX: 0,
      lookY: 0,
    };

    setCameraOn(false);
  };

  const startTracking = async (
    video: HTMLVideoElement
  ) => {
    await Promise.all([
      loadLibrary(
        "face-mesh",
        "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
      ),
      loadLibrary(
        "hands",
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
      ),
    ]);

    if (!window.FaceMesh || !window.Hands) {
      throw new Error("Vision libraries unavailable.");
    }

    const face = new window.FaceMesh({
      locateFile: (file) =>
        "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/" +
        file,
    });

    face.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });

    face.onResults((results) => {
      const points =
        results?.multiFaceLandmarks?.[0];

      if (!points) return;

      const leftEye = eyeRatio(points, [
        33, 160, 158, 133, 153, 144,
      ]);

      const rightEye = eyeRatio(points, [
        362, 385, 387, 263, 373, 380,
      ]);

      const blink =
        (leftEye + rightEye) / 2 < 0.205
          ? 1
          : 0;

      const mouthHeight = dist(
        points[13],
        points[14]
      );

      const mouthWidth = dist(
        points[61],
        points[291]
      );

      const mouthRatio =
        mouthWidth > 0
          ? mouthHeight / mouthWidth
          : 0;

      const mouth = Math.max(
        0,
        Math.min(
          1,
          (mouthRatio - 0.08) / 0.30
        )
      );

      const nose = points[1];

      const lookX = Math.max(
        -1,
        Math.min(
          1,
          (0.5 - (nose?.x ?? 0.5)) * 2.8
        )
      );

      const lookY = Math.max(
        -1,
        Math.min(
          1,
          ((nose?.y ?? 0.5) - 0.5) * 2.2
        )
      );

      const r = reactionRef.current;

      r.blink += (blink - r.blink) * 0.55;
      r.mouth += (mouth - r.mouth) * 0.35;

      /*
       * Face direction is used when no pointer/touch
       * is actively controlling the eyes.
       */
      if (!pointerRef.current.active) {
        r.lookX += (lookX - r.lookX) * 0.12;
        r.lookY += (lookY - r.lookY) * 0.12;
      }
    });

    const hands = new window.Hands({
      locateFile: (file) =>
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
        file,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      const detected =
        results?.multiHandLandmarks;

      if (!detected?.length) return;

      let x = 0;
      let y = 0;
      let count = 0;

      for (const hand of detected) {
        const palm = hand?.[9] ?? hand?.[0];

        if (!palm) continue;

        x += palm.x;
        y += palm.y;
        count++;
      }

      if (!count) return;

      x /= count;
      y /= count;

      const targetX = Math.max(
        -1,
        Math.min(1, (0.5 - x) * 3.2)
      );

      const targetY = Math.max(
        -1,
        Math.min(1, (y - 0.5) * 2.6)
      );

      const r = reactionRef.current;

      r.lookX += (targetX - r.lookX) * 0.22;
      r.lookY += (targetY - r.lookY) * 0.22;

      pointerRef.current.active = false;
    });

    faceRef.current = face;
    handsRef.current = hands;

    const process = async () => {
      if (
        !videoRef.current ||
        videoRef.current.readyState < 2
      ) {
        frameRef.current =
          requestAnimationFrame(process);
        return;
      }

      try {
        await face.send({
          image: videoRef.current,
        });

        await hands.send({
          image: videoRef.current,
        });
      } catch {
        // Keep tracking after an occasional dropped frame.
      }

      frameRef.current =
        requestAnimationFrame(process);
    };

    process();
  };

  const toggleCamera = async () => {
    if (startingCameraRef.current) return;

    if (cameraOn) {
      stopCamera();
      return;
    }

    startingCameraRef.current = true;
    setCameraError("");

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Camera element unavailable.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      await startTracking(videoRef.current);

      setCameraOn(true);
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;

      setCameraError(
        error instanceof Error
          ? error.message
          : "Camera could not be started."
      );
    } finally {
      startingCameraRef.current = false;
    }
  };

  /*
   * ------------------------------------------------------------
   * FACE RENDER
   * ------------------------------------------------------------
   * Just:
   *   ● pupil
   *   ● pupil
   *   ─ mouth
   *
   * Nothing else.
   */

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animation = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, width * dpr);
      canvas.height = Math.max(1, height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const red =
        state === "no-limits" ||
        state === "alert";

      const primary = red
        ? "255, 90, 90"
        : "255, 224, 105";

      const bright = red
        ? "255, 225, 225"
        : "255, 250, 210";

      const r = reactionRef.current;

      const serious = red;
      const playful = !serious;

      /*
       * Automatic tiny idle blink when camera is off.
       */
      const automaticBlink =
        Math.sin(time * 0.00065) > 0.993
          ? 1
          : 0;

      const blink = cameraOn
        ? r.blink
        : automaticBlink;

      /*
       * Pointer/touch takes priority.
       */
      const baseLookX =
        pointerRef.current.active
          ? pointerRef.current.x
          : r.lookX;

      const baseLookY =
        pointerRef.current.active
          ? pointerRef.current.y
          : r.lookY;

      const playfulDriftX = Math.sin(time * 0.0018) * 0.035;
      const playfulDriftY = Math.sin(time * 0.0024) * 0.028;

      const lookX = serious
        ? baseLookX
        : Math.max(
            -1,
            Math.min(1, baseLookX + playfulDriftX)
          );

      const lookY = serious
        ? baseLookY
        : Math.max(
            -1,
            Math.min(1, baseLookY + playfulDriftY)
          );

      /*
       * PLAYFUL BEHAVIOR LOOP
       * EON occasionally behaves like a tiny digital creature
       * while idle. The loop is deterministic, so it never
       * changes behavior every frame or causes React rerenders.
       *
       *  0-7s   curious idle / look around
       *  7-11s  dizzy eye-spin
       * 11-15s  big yawn
       * 15-21s  plays with tiny digital hands
       * 21-28s  butterfly appears + EON admires it
       * 28-32s  sleepy blink / head bob
       */
      const playfulLoop = time % 32000;

      let playfulAction =
        "curious";

      /*
       * Explicit chat commands can temporarily override the
       * automatic personality loop. The parent sends a small
       * action name; no AI/tool call is required.
       */
      if (playful && playfulCommand) {
        playfulAction = playfulCommand;
      }

      if (
        playful &&
        !playfulCommand &&
        state === "idle"
      ) {
        if (playfulLoop >= 7000 && playfulLoop < 11000) {
          playfulAction = "dizzy";
        } else if (
          playfulLoop >= 11000 &&
          playfulLoop < 15000
        ) {
          playfulAction = "yawn";
        } else if (
          playfulLoop >= 15000 &&
          playfulLoop < 21000
        ) {
          playfulAction = "hands";
        } else if (
          playfulLoop >= 21000 &&
          playfulLoop < 28000
        ) {
          playfulAction = "butterfly";
        } else if (playfulLoop >= 28000) {
          playfulAction = "sleepy";
        }
      }

      const scale =
        Math.min(width, height) /
        (immersive ? 285 : 420);

      const cx = width / 2;
      const cy =
        height / 2 -
        15 +
        (playful ? Math.sin(time * 0.002) * 2.5 * scale : 0);

      /*
       * TWO SIMPLE DIGITAL EYES
       */

      const eyeGap = 58 * scale;
      const pupilRange = 10 * scale;
      const pupilSize = 10 * scale;

      const dizzyProgress =
        Math.max(
          0,
          Math.min(1, (playfulLoop - 7000) / 4000)
        );

      const dizzyAngle =
        dizzyProgress * Math.PI * 2 * 4;

      const dizzyX =
        Math.cos(dizzyAngle) * pupilRange * 0.82;

      const dizzyY =
        Math.sin(dizzyAngle) * pupilRange * 0.52;

      const pupilX =
        playfulAction === "dizzy"
          ? dizzyX
          : lookX * pupilRange;

      const pupilY =
        playfulAction === "dizzy"
          ? dizzyY
          : lookY * pupilRange * 0.65;

      const eyeY = cy - 10 * scale;

      const drawEye = (x: number) => {
        ctx.save();

        ctx.translate(x, eyeY);

        /*
         * Eye closes when user blinks.
         */
        const open =
          Math.max(0.04, 1 - blink * 0.96);

        ctx.scale(1, open);

        /*
         * Very simple digital eye:
         * a soft glowing dot with a faint dark field.
         */
        ctx.beginPath();

        ctx.arc(
          0,
          0,
          18 * scale,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(" + primary + ", 0.055)";

        ctx.fill();

        /*
         * Pupil.
         */
        const localPupilX =
          playfulAction === "dizzy"
            ? pupilX
            : pupilX;

        const localPupilY =
          playfulAction === "dizzy"
            ? pupilY
            : pupilY;

        ctx.beginPath();

        ctx.arc(
          localPupilX,
          localPupilY,
          pupilSize,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(" + bright + ", 1)";

        ctx.shadowBlur = 18 * scale;
        ctx.shadowColor =
          "rgba(" + primary + ", 0.95)";

        ctx.fill();

        ctx.restore();
      };

      drawEye(cx - eyeGap);
      drawEye(cx + eyeGap);

      /*
       * --------------------------------------------------------
       * PLAYFUL DIGITAL ANIMATIONS
       * --------------------------------------------------------
       */

      const actionT =
        playfulLoop >= 7000
          ? playfulLoop
          : playfulLoop;

      /*
       * DIZZY:
       * Tiny orbital rings make the eyes look like they have
       * spun themselves silly.
       */
      if (
        playfulAction === "dizzy" ||
        playfulAction === "spin"
      ) {
        const dizzyPulse =
          0.55 +
          Math.sin(actionT * 0.018) * 0.18;

        ctx.save();
        ctx.strokeStyle =
          "rgba(" + bright + ", " + dizzyPulse + ")";

        ctx.lineWidth = 1.6 * scale;
        ctx.shadowBlur = 9 * scale;
        ctx.shadowColor =
          "rgba(" + primary + ", 0.7)";

        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(
            cx + side * eyeGap,
            eyeY,
            25 * scale,
            0,
            Math.PI * 1.45
          );
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(
            cx + side * eyeGap + 17 * scale,
            eyeY - 17 * scale
          );
          ctx.lineTo(
            cx + side * eyeGap + 22 * scale,
            eyeY - 11 * scale
          );
          ctx.stroke();
        }

        ctx.font =
          Math.max(10, 11 * scale) + "px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle =
          "rgba(" + bright + ", 0.72)";
        ctx.fillText(
          "woah...",
          cx,
          cy - 92 * scale
        );

        ctx.restore();
      }

      /*
       * DIGITAL HANDS:
       * Two tiny line-art hands wave and play near EON's face.
       */
      if (
        playfulAction === "hands" ||
        playfulAction === "wave" ||
        playfulAction === "dance"
      ) {
        const handT =
          Math.max(0, (playfulLoop - 15000) / 6000);
        const wave =
          Math.sin(handT * Math.PI * 5);

        ctx.save();
        ctx.strokeStyle =
          "rgba(" + bright + ", 0.9)";
        ctx.lineWidth = 2 * scale;
        ctx.lineCap = "round";
        ctx.shadowBlur = 10 * scale;
        ctx.shadowColor =
          "rgba(" + primary + ", 0.75)";

        const drawHand = (
          handX: number,
          direction: number
        ) => {
          const wristY =
            cy + 22 * scale +
            wave * 4 * scale;

          ctx.beginPath();
          ctx.moveTo(
            handX,
            wristY + 30 * scale
          );
          ctx.lineTo(
            handX + direction * 8 * scale,
            wristY + 5 * scale
          );

          for (let finger = -2; finger <= 2; finger++) {
            const fx =
              handX +
              direction *
                (8 + Math.abs(finger) * 2) *
                scale;
            const fy =
              wristY -
              (15 + (2 - Math.abs(finger)) * 4) *
                scale +
              Math.sin(
                handT * 12 +
                finger
              ) *
                4 *
                scale;

            ctx.moveTo(
              fx,
              fy + 12 * scale
            );
            ctx.lineTo(
              fx + direction * 5 * scale,
              fy
            );
          }

          ctx.stroke();
        };

        drawHand(
          cx - 92 * scale,
          -1
        );
        drawHand(
          cx + 92 * scale,
          1
        );

        ctx.font =
          Math.max(9, 10 * scale) + "px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle =
          "rgba(" + bright + ", 0.68)";
        ctx.fillText(
          "fidget mode",
          cx,
          cy + 112 * scale
        );

        ctx.restore();
      }

      /*
       * BUTTERFLY:
       * A tiny glowing digital butterfly floats in.
       * EON follows it with its eyes and then admires it.
       */
      if (
        playfulAction === "butterfly" ||
        playfulAction === "admire"
      ) {
        const butterflyT =
          Math.max(
            0,
            Math.min(
              1,
              (playfulLoop - 21000) / 7000
            )
          );

        const butterflyX =
          cx +
          Math.sin(butterflyT * Math.PI * 2) *
            105 *
            scale;

        const butterflyY =
          cy -
          55 * scale -
          butterflyT * 12 * scale +
          Math.sin(butterflyT * Math.PI * 4) *
            18 *
            scale;

        const wingBeat =
          0.72 +
          Math.sin(time * 0.025) * 0.28;

        /*
         * During the butterfly scene the eyes gently
         * follow the visitor instead of the pointer.
         */
        if (!pointerRef.current.active) {
          const followX =
            Math.max(
              -1,
              Math.min(
                1,
                (butterflyX - cx) /
                  (120 * scale)
              )
            );

          const followY =
            Math.max(
              -1,
              Math.min(
                1,
                (butterflyY - eyeY) /
                  (100 * scale)
              )
            );

          r.lookX +=
            (followX - r.lookX) * 0.045;
          r.lookY +=
            (followY - r.lookY) * 0.045;
        }

        ctx.save();
        ctx.translate(
          butterflyX,
          butterflyY
        );
        ctx.scale(
          0.85 + wingBeat * 0.18,
          0.85
        );

        ctx.strokeStyle =
          "rgba(" + bright + ", 0.95)";
        ctx.fillStyle =
          "rgba(" + primary + ", 0.16)";
        ctx.lineWidth = 1.7 * scale;
        ctx.shadowBlur = 14 * scale;
        ctx.shadowColor =
          "rgba(" + primary + ", 0.9)";

        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(
            side * 10 * scale,
            -6 * scale,
            13 * scale,
            18 * scale,
            side * 0.35,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(
          0,
          -12 * scale
        );
        ctx.lineTo(
          0,
          14 * scale
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(
          0,
          -11 * scale
        );
        ctx.quadraticCurveTo(
          -7 * scale,
          -20 * scale,
          -10 * scale,
          -19 * scale
        );
        ctx.moveTo(
          0,
          -11 * scale
        );
        ctx.quadraticCurveTo(
          7 * scale,
          -20 * scale,
          10 * scale,
          -19 * scale
        );
        ctx.stroke();

        ctx.restore();

        /*
         * Tiny admiration sparkles.
         */
        for (let i = 0; i < 4; i++) {
          const a =
            time * 0.0012 +
            i * (Math.PI / 2);

          const sx =
            butterflyX +
            Math.cos(a) * 25 * scale;
          const sy =
            butterflyY +
            Math.sin(a) * 20 * scale;

          ctx.save();
          ctx.strokeStyle =
            "rgba(" + bright + ", 0.72)";
          ctx.lineWidth = 1.2 * scale;
          ctx.beginPath();
          ctx.moveTo(
            sx - 3 * scale,
            sy
          );
          ctx.lineTo(
            sx + 3 * scale,
            sy
          );
          ctx.moveTo(
            sx,
            sy - 3 * scale
          );
          ctx.lineTo(
            sx,
            sy + 3 * scale
          );
          ctx.stroke();
          ctx.restore();
        }
      }

      /*
       * SLEEPY:
       * EON slowly droops, blinks, then wakes for the next loop.
       */
      if (
        playfulAction === "sleepy" ||
        playfulAction === "yawn"
      ) {
        const sleepyT =
          (playfulLoop - 28000) / 4000;

        const sleepyBlink =
          Math.sin(
            Math.max(0, sleepyT) * Math.PI
          );

        ctx.save();
        ctx.strokeStyle =
          "rgba(" + bright + ", 0.72)";
        ctx.lineWidth = 1.4 * scale;
        ctx.setLineDash([
          3 * scale,
          4 * scale,
        ]);

        ctx.beginPath();
        ctx.arc(
          cx,
          cy - 92 * scale,
          28 * scale,
          Math.PI * 1.05,
          Math.PI * 1.85
        );
        ctx.stroke();

        ctx.setLineDash([]);

        ctx.font =
          Math.max(9, 10 * scale) + "px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle =
          "rgba(" +
          bright +
          ", " +
          (0.35 + sleepyBlink * 0.45) +
          ")";

        ctx.fillText(
          "zzz",
          cx + 48 * scale,
          cy - 112 * scale
        );

        ctx.restore();
      }

      /*
       * LAUGH / SURPRISE reactions from chat commands.
       */
      if (
        playfulAction === "laugh" ||
        playfulAction === "surprised"
      ) {
        ctx.save();

        const reactionPulse =
          0.55 +
          Math.abs(Math.sin(time * 0.012)) * 0.45;

        ctx.strokeStyle =
          "rgba(" + bright + ", " +
          reactionPulse + ")";

        ctx.lineWidth = 1.7 * scale;
        ctx.shadowBlur = 12 * scale;
        ctx.shadowColor =
          "rgba(" + primary + ", 0.8)";

        for (let i = 0; i < 6; i++) {
          const angle =
            i * (Math.PI / 3) +
            time * 0.0007;

          const inner = 88 * scale;
          const outer =
            (playfulAction === "surprised"
              ? 112
              : 102) * scale;

          ctx.beginPath();
          ctx.moveTo(
            cx + Math.cos(angle) * inner,
            cy + Math.sin(angle) * inner
          );
          ctx.lineTo(
            cx + Math.cos(angle) * outer,
            cy + Math.sin(angle) * outer
          );
          ctx.stroke();
        }

        ctx.font =
          Math.max(10, 11 * scale) +
          "px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle =
          "rgba(" + bright + ", 0.78)";
        ctx.fillText(
          playfulAction === "laugh"
            ? "hehe"
            : "WHOA!",
          cx,
          cy - 94 * scale
        );

        ctx.restore();
      }

      /*
       * SIMPLE MOUTH
       */

      const speaking =
        state === "speaking"
          ? 0.30 +
            Math.abs(
              Math.sin(time * 0.014)
            ) * 0.55
          : 0;

      const playfulSmile =
        playful && state !== "thinking" && state !== "listening"
          ? 0.10 + Math.max(0, Math.sin(time * 0.0017)) * 0.05
          : 0;

      const yawnProgress =
        Math.max(
          0,
          Math.min(
            1,
            (playfulLoop - 11000) / 4000
          )
        );

      const yawnAmount =
        playfulAction === "yawn"
          ? Math.sin(yawnProgress * Math.PI)
          : 0;

      const laughAmount =
        playfulAction === "laugh"
          ? 0.45 +
            Math.abs(Math.sin(time * 0.018)) * 0.45
          : 0;

      const surpriseAmount =
        playfulAction === "surprised"
          ? 0.72
          : 0;

      const mouthOpen = Math.max(
        cameraOn ? r.mouth : 0,
        speaking,
        yawnAmount * 0.95,
        laughAmount,
        surpriseAmount
      );

      const mouthWidth =
        46 * scale;

      const mouthHeight =
        (2 + mouthOpen * 22) * scale;

      const mouthY =
        cy +
        62 * scale +
        (playfulAction === "yawn"
          ? Math.sin(yawnProgress * Math.PI) *
            4 *
            scale
          : 0);

      ctx.save();

      ctx.beginPath();

      if (mouthOpen < 0.08) {
        /*
         * Normal mode gets a tiny friendly smile.
         * No Limits stays precise and straight.
         */
        if (playfulSmile > 0) {
          ctx.moveTo(
            cx - mouthWidth / 2,
            mouthY - 2 * scale
          );
          ctx.quadraticCurveTo(
            cx,
            mouthY + playfulSmile * 18 * scale,
            cx + mouthWidth / 2,
            mouthY - 2 * scale
          );
        } else {
          ctx.moveTo(
            cx - mouthWidth / 2,
            mouthY
          );
          ctx.lineTo(
            cx + mouthWidth / 2,
            mouthY
          );
        }
      } else {
        /*
         * Open mouth = small digital capsule.
         */
        ctx.ellipse(
          cx,
          mouthY,
          mouthWidth * 0.48,
          mouthHeight,
          0,
          0,
          Math.PI * 2
        );
      }

      ctx.strokeStyle =
        "rgba(" + bright + ", 1)";

      ctx.lineWidth =
        2.2 * scale;

      ctx.lineCap = "round";

      ctx.shadowBlur = 14 * scale;
      ctx.shadowColor =
        "rgba(" + primary + ", 0.9)";

      ctx.stroke();

      if (mouthOpen > 0.08) {
        ctx.fillStyle =
          "rgba(0, 0, 0, 0.55)";

        ctx.fill();
      }

      ctx.restore();

      animation =
        requestAnimationFrame(draw);
    };

    animation =
      requestAnimationFrame(draw);

    return () => {
      window.removeEventListener(
        "resize",
        resize
      );

      cancelAnimationFrame(animation);
    };
  }, [state, cameraOn]);

  /*
   * ------------------------------------------------------------
   * MOUSE / TOUCH
   * ------------------------------------------------------------
   */

  const updatePointer = (
    clientX: number,
    clientY: number
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    pointerRef.current = {
      x: Math.max(
        -1,
        Math.min(
          1,
          ((clientX - rect.left) /
            rect.width -
            0.5) *
            2
        )
      ),
      y: Math.max(
        -1,
        Math.min(
          1,
          ((clientY - rect.top) /
            rect.height -
            0.5) *
            2
        )
      ),
      active: true,
    };
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    updatePointer(
      event.clientX,
      event.clientY
    );
  };

  const handlePointerLeave = () => {
    pointerRef.current.active = false;
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

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
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      <canvas
        ref={canvasRef}
        aria-label="EON interactive digital eyes"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          minHeight: "420px",
          maxWidth: immersive ? "none" : "620px",
          cursor: "crosshair",
          touchAction: "none",
        }}
      />

      {/*
       * CAMERA CONTROL
       * Moved to the TOP-RIGHT of the EON core so it is
       * immediately visible.
       */}
      <button
        type="button"
        onClick={toggleCamera}
        aria-label={
          cameraOn
            ? "Turn camera tracking off"
            : "Turn camera tracking on"
        }
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          padding: "7px 11px",
          border:
            "1px solid rgba(255, 224, 105, 0.35)",
          borderRadius: "7px",
          background: cameraOn
            ? "rgba(255, 224, 105, 0.14)"
            : "rgba(4, 7, 14, 0.72)",
          color: cameraOn
            ? "#fff3ae"
            : "rgba(255,255,255,0.72)",
          fontSize: "9px",
          letterSpacing: "1.4px",
          fontWeight: 700,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        {cameraOn ? "● CAMERA ON" : "◉ CAMERA"}
      </button>

      {cameraError && (
        <div
          style={{
            position: "absolute",
            top: "45px",
            right: "12px",
            maxWidth: "220px",
            padding: "7px 9px",
            border:
              "1px solid rgba(255, 100, 100, 0.32)",
            borderRadius: "7px",
            background:
              "rgba(20, 5, 8, 0.82)",
            color:
              "rgba(255, 190, 190, 0.92)",
            fontSize: "9px",
            lineHeight: 1.35,
            textAlign: "right",
            zIndex: 10,
          }}
        >
          {cameraError}
        </div>
      )}
    </div>
  );
}
