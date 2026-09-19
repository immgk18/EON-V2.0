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
};

type Point = {
  x: number;
  y: number;
};

type FaceReaction = {
  blink: number;
  mouth: number;
  lookX: number;
  lookY: number;
  smile: number;
};

type FaceMeshInstance = {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: any) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close?: () => void;
};

type HandsInstance = {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: any) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close?: () => void;
};

declare global {
  interface Window {
    FaceMesh?: new (options: {
      locateFile: (file: string) => string;
    }) => FaceMeshInstance;

    Hands?: new (options: {
      locateFile: (file: string) => string;
    }) => HandsInstance;
  }
}

/*
 * EON CORE
 *
 * Deliberately simple:
 *   • two digital eyes
 *   • one digital mouth
 *
 * Interaction:
 *   • mouse movement -> eyes follow
 *   • touch movement -> eyes follow
 *   • tap/click -> eyes react
 *   • optional camera -> EON mirrors blinking + mouth opening
 *   • optional hand tracking -> eyes can follow the user's hand
 *
 * Camera is OFF until the user explicitly presses CAMERA.
 */

export default function EnergyCore({
  state = "idle",
}: EnergyCoreProps) {
  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const faceMeshRef =
    useRef<FaceMeshInstance | null>(null);

  const handsRef =
    useRef<HandsInstance | null>(null);

  const trackingFrameRef =
    useRef<number | null>(null);

  const cameraStartingRef =
    useRef(false);

  const lastHandSeenRef =
    useRef(0);

  const reactionRef =
    useRef<FaceReaction>({
      blink: 0,
      mouth: 0,
      lookX: 0,
      lookY: 0,
      smile: 0,
    });

  const pointerRef =
    useRef<Point>({
      x: 0,
      y: 0,
    });

  const pointerActiveRef =
    useRef(false);

  const tapPulseRef =
    useRef(0);

  const handTargetRef =
    useRef<Point | null>(null);

  const [cameraOn, setCameraOn] =
    useState(false);

  const [cameraError, setCameraError] =
    useState("");

  /*
   * ------------------------------------------------------------
   * LOAD MEDIAPIPE LIBRARIES
   * ------------------------------------------------------------
   */

  const loadScript = (
    id: string,
    src: string
  ) =>
    new Promise<void>(
      (resolve, reject) => {
        const existing =
          document.querySelector(
            'script[data-eon-lib="' +
              id +
              '"]'
          );

        if (existing) {
          if (
            id === "face-mesh" &&
            window.FaceMesh
          ) {
            resolve();
            return;
          }

          if (
            id === "hands" &&
            window.Hands
          ) {
            resolve();
            return;
          }

          existing.addEventListener(
            "load",
            () => resolve(),
            { once: true }
          );

          existing.addEventListener(
            "error",
            () =>
              reject(
                new Error(
                  id +
                    " failed to load."
                )
              ),
            { once: true }
          );

          return;
        }

        const script =
          document.createElement(
            "script"
          );

        script.dataset.eonLib = id;
        script.src = src;
        script.async = true;

        script.onload = () =>
          resolve();

        script.onerror = () =>
          reject(
            new Error(
              id +
                " failed to load."
            )
          );

        document.head.appendChild(
          script
        );
      }
    );

  /*
   * ------------------------------------------------------------
   * CAMERA / FACE / HAND TRACKING
   * ------------------------------------------------------------
   */

  const stopCamera = () => {
    if (
      trackingFrameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        trackingFrameRef.current
      );

      trackingFrameRef.current =
        null;
    }

    faceMeshRef.current?.close?.();
    handsRef.current?.close?.();

    faceMeshRef.current = null;
    handsRef.current = null;

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    handTargetRef.current =
      null;

    reactionRef.current = {
      blink: 0,
      mouth: 0,
      lookX: 0,
      lookY: 0,
      smile: 0,
    };

    setCameraOn(false);
  };

  const landmarkDistance = (
    a: any,
    b: any
  ) => {
    if (!a || !b) {
      return 0;
    }

    return Math.hypot(
      a.x - b.x,
      a.y - b.y
    );
  };

  const eyeAspectRatio = (
    points: any[],
    ids: number[]
  ) => {
    const p1 = points[ids[0]];
    const p2 = points[ids[1]];
    const p3 = points[ids[2]];
    const p4 = points[ids[3]];
    const p5 = points[ids[4]];
    const p6 = points[ids[5]];

    if (
      !p1 ||
      !p2 ||
      !p3 ||
      !p4 ||
      !p5 ||
      !p6
    ) {
      return 1;
    }

    const verticalA =
      landmarkDistance(p2, p6);

    const verticalB =
      landmarkDistance(p3, p5);

    const horizontal =
      landmarkDistance(p1, p4);

    if (horizontal <= 0.0001) {
      return 1;
    }

    return (
      (verticalA + verticalB) /
      (2 * horizontal)
    );
  };

  const startTracking =
    async (
      video: HTMLVideoElement
    ) => {
      await Promise.all([
        loadScript(
          "face-mesh",
          "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
        ),
        loadScript(
          "hands",
          "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
        ),
      ]);

      if (
        !window.FaceMesh ||
        !window.Hands
      ) {
        throw new Error(
          "Vision libraries are unavailable."
        );
      }

      /*
       * FACE
       */

      const face =
        new window.FaceMesh({
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

      face.onResults(
        (results) => {
          const points =
            results?.multiFaceLandmarks?.[0];

          if (!points) {
            reactionRef.current.blink *=
              0.82;

            reactionRef.current.mouth *=
              0.84;

            reactionRef.current.smile *=
              0.9;

            return;
          }

          /*
           * Eye landmarks.
           */

          const leftEAR =
            eyeAspectRatio(
              points,
              [
                33,
                160,
                158,
                133,
                153,
                144,
              ]
            );

          const rightEAR =
            eyeAspectRatio(
              points,
              [
                362,
                385,
                387,
                263,
                373,
                380,
              ]
            );

          const averageEAR =
            (leftEAR + rightEAR) /
            2;

          const blinkTarget =
            averageEAR < 0.205
              ? 1
              : 0;

          /*
           * Mouth opening.
           */

          const mouthTop =
            points[13];

          const mouthBottom =
            points[14];

          const mouthLeft =
            points[61];

          const mouthRight =
            points[291];

          const mouthHeight =
            landmarkDistance(
              mouthTop,
              mouthBottom
            );

          const mouthWidth =
            landmarkDistance(
              mouthLeft,
              mouthRight
            );

          const mouthRatio =
            mouthWidth > 0
              ? mouthHeight /
                mouthWidth
              : 0;

          const mouthTarget =
            Math.max(
              0,
              Math.min(
                1,
                (mouthRatio - 0.08) /
                  0.30
              )
            );

          const smileTarget =
            Math.max(
              0,
              Math.min(
                1,
                (mouthRatio - 0.13) /
                  0.14
              )
            );

          /*
           * Face direction.
           */

          const nose =
            points[1];

          const centerX =
            nose?.x ?? 0.5;

          const centerY =
            nose?.y ?? 0.5;

          const faceLookX =
            Math.max(
              -1,
              Math.min(
                1,
                (0.5 -
                  centerX) *
                  2.8
              )
            );

          const faceLookY =
            Math.max(
              -1,
              Math.min(
                1,
                (centerY -
                  0.5) *
                  2.2
              )
            );

          const reaction =
            reactionRef.current;

          reaction.blink +=
            (blinkTarget -
              reaction.blink) *
            0.48;

          reaction.mouth +=
            (mouthTarget -
              reaction.mouth) *
            0.35;

          reaction.smile +=
            (smileTarget -
              reaction.smile) *
            0.25;

          /*
           * Only use face direction when a hand
           * hasn't been seen recently.
           */

          if (
            Date.now() -
              lastHandSeenRef.current >
            900
          ) {
            reaction.lookX +=
              (faceLookX -
                reaction.lookX) *
              0.12;

            reaction.lookY +=
              (faceLookY -
                reaction.lookY) *
              0.12;
          }
        }
      );

      /*
       * HANDS
       */

      const hands =
        new window.Hands({
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

      hands.onResults(
        (results) => {
          const allHands =
            results?.multiHandLandmarks;

          if (
            !allHands ||
            allHands.length === 0
          ) {
            return;
          }

          /*
           * Use the average palm position.
           * EON's eyes follow the hand.
           */

          let sumX = 0;
          let sumY = 0;
          let count = 0;

          for (
            const hand of allHands
          ) {
            if (!hand) {
              continue;
            }

            const palm =
              hand[9] ||
              hand[0];

            if (!palm) {
              continue;
            }

            sumX += palm.x;
            sumY += palm.y;
            count++;
          }

          if (count === 0) {
            return;
          }

          const handX =
            sumX / count;

          const handY =
            sumY / count;

          handTargetRef.current = {
            x: handX,
            y: handY,
          };

          lastHandSeenRef.current =
            Date.now();

          const targetX =
            Math.max(
              -1,
              Math.min(
                1,
                (0.5 -
                  handX) *
                  3.4
              )
            );

          const targetY =
            Math.max(
              -1,
              Math.min(
                1,
                (handY -
                  0.5) *
                  2.7
              )
            );

          reactionRef.current.lookX +=
            (targetX -
              reactionRef.current.lookX) *
            0.22;

          reactionRef.current.lookY +=
            (targetY -
              reactionRef.current.lookY) *
            0.22;
        }
      );

      faceMeshRef.current =
        face;

      handsRef.current =
        hands;

      /*
       * PROCESS VIDEO
       */

      const processFrame =
        async () => {
          if (
            !videoRef.current ||
            videoRef.current.readyState <
              2
          ) {
            trackingFrameRef.current =
              requestAnimationFrame(
                processFrame
              );

            return;
          }

          try {
            /*
             * Send alternating frames to the two
             * models. This keeps the browser lighter.
             */
            await face.send({
              image: videoRef.current,
            });

            await hands.send({
              image: videoRef.current,
            });
          } catch {
            // A dropped frame should not stop tracking.
          }

          trackingFrameRef.current =
            requestAnimationFrame(
              processFrame
            );
        };

      processFrame();
    };

  const toggleCamera =
    async () => {
      if (cameraStartingRef.current) {
        return;
      }

      if (cameraOn) {
        stopCamera();
        return;
      }

      cameraStartingRef.current =
        true;

      setCameraError("");

      try {
        if (
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error(
            "Camera is not supported by this browser."
          );
        }

        /*
         * Permission is requested only after the user
         * explicitly presses the camera control.
         */

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode: "user",
                width: {
                  ideal: 640,
                },
                height: {
                  ideal: 480,
                },
              },
              audio: false,
            }
          );

        streamRef.current =
          stream;

        if (!videoRef.current) {
          throw new Error(
            "Camera element unavailable."
          );
        }

        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();

        await startTracking(
          videoRef.current
        );

        setCameraOn(true);
      } catch (error) {
        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) =>
              track.stop()
            );
        }

        streamRef.current = null;

        setCameraError(
          error instanceof Error
            ? error.message
            : "Camera could not be started."
        );
      } finally {
        cameraStartingRef.current =
          false;
      }
    };

  /*
   * ------------------------------------------------------------
   * SIMPLE CANVAS FACE
   * ------------------------------------------------------------
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

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;

    const resize = () => {
      const rect =
        canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = Math.max(
        1,
        Math.floor(width * dpr)
      );

      canvas.height = Math.max(
        1,
        Math.floor(height * dpr)
      );

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

    window.addEventListener(
      "resize",
      resize
    );

    const draw = (
      time: number
    ) => {
      if (
        width <= 0 ||
        height <= 0
      ) {
        animationFrame =
          requestAnimationFrame(
            draw
          );

        return;
      }

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      const isRed =
        state === "no-limits" ||
        state === "alert";

      const primary =
        isRed
          ? "255, 90, 90"
          : "255, 224, 105";

      const bright =
        isRed
          ? "255, 225, 225"
          : "255, 250, 210";

      const reaction =
        reactionRef.current;

      const idleBlink =
        Math.sin(
          time * 0.00065
        ) > 0.992
          ? 1
          : 0;

      const cameraBlink =
        cameraOn
          ? reaction.blink
          : idleBlink;

      const blinkAmount =
        Math.max(
          0,
          Math.min(
            1,
            cameraBlink
          )
        );

      /*
       * Pointer/touch controls are active even
       * when camera is OFF.
       */

      let lookX =
        reaction.lookX;

      let lookY =
        reaction.lookY;

      if (
        pointerActiveRef.current
      ) {
        lookX =
          pointerRef.current.x;

        lookY =
          pointerRef.current.y;
      }

      const centerX =
        width / 2;

      const centerY =
        height / 2 - 8;

      const scale =
        Math.min(
          width,
          height
        ) / 420;

      const eyeSpacing =
        58 * scale;

      const eyeWidth =
        48 * scale;

      const eyeHeight =
        34 * scale;

      const eyeY =
        centerY - 10 * scale;

      const eyeLookX =
        lookX * 10 * scale;

      const eyeLookY =
        lookY * 6 * scale;

      const pulse =
        1 +
        Math.sin(
          time * 0.003
        ) *
          0.035;

      /*
       * Tap/click reaction.
       */

      const tapPulse =
        tapPulseRef.current;

      tapPulseRef.current *=
        0.90;

      const glowStrength =
        8 + tapPulse * 22;

      const drawEye = (
        x: number
      ) => {
        ctx.save();

        ctx.translate(
          x,
          eyeY
        );

        const eyeOpen =
          Math.max(
            0.05,
            1 -
              blinkAmount *
                0.96
          );

        ctx.scale(
          1,
          eyeOpen
        );

        /*
         * Outer eye.
         */

        ctx.beginPath();

        ctx.ellipse(
          0,
          0,
          eyeWidth / 2,
          eyeHeight / 2,
          0,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle =
          "rgba(" +
          primary +
          ", 0.95)";

        ctx.lineWidth =
          2 * scale;

        ctx.shadowBlur =
          glowStrength;

        ctx.shadowColor =
          "rgba(" +
          primary +
          ", 0.85)";

        ctx.stroke();

        /*
         * Iris follows face/hand/touch.
         */

        const irisX =
          eyeLookX;

        const irisY =
          eyeLookY;

        const irisRadius =
          11 * scale * pulse;

        ctx.beginPath();

        ctx.arc(
          irisX,
          irisY,
          irisRadius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(5, 8, 14, 0.96)";

        ctx.fill();

        ctx.strokeStyle =
          "rgba(" +
          primary +
          ", 1)";

        ctx.lineWidth =
          1.5 * scale;

        ctx.shadowBlur =
          glowStrength;

        ctx.stroke();

        /*
         * Pupil.
         */

        ctx.beginPath();

        ctx.arc(
          irisX,
          irisY,
          4.2 * scale,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(" +
          bright +
          ", 1)";

        ctx.shadowBlur = 14;
        ctx.shadowColor =
          "rgba(" +
          primary +
          ", 1)";

        ctx.fill();

        ctx.restore();
      };

      drawEye(
        centerX - eyeSpacing
      );

      drawEye(
        centerX + eyeSpacing
      );

      /*
       * MOUTH
       *
       * Camera:
       *   user's mouth opening -> EON mouth opens
       *
       * Speaking:
       *   EON voice -> subtle mouth animation
       *
       * Touch:
       *   tap -> tiny smile response
       */

      const voiceMouth =
        state === "speaking"
          ? 0.35 +
            Math.abs(
              Math.sin(
                time * 0.014
              )
            ) *
              0.38
          : 0;

      const cameraMouth =
        cameraOn
          ? reaction.mouth
          : 0;

      const mouthOpen =
        Math.max(
          voiceMouth,
          cameraMouth
        );

      const smile =
        reaction.smile * 0.45 +
        tapPulse * 0.08;

      const mouthWidth =
        (46 +
          mouthOpen * 10) *
        scale;

      const mouthY =
        centerY +
        65 * scale;

      const mouthDepth =
        (8 +
          mouthOpen *
            25) *
        scale;

      ctx.save();

      ctx.beginPath();

      ctx.moveTo(
        centerX -
          mouthWidth / 2,
        mouthY
      );

      ctx.quadraticCurveTo(
        centerX,
        mouthY +
          mouthDepth -
          smile * 7 * scale,
        centerX +
          mouthWidth / 2,
        mouthY
      );

      ctx.strokeStyle =
        "rgba(" +
        bright +
        ", 1)";

      ctx.lineWidth =
        2.2 * scale;

      ctx.lineCap =
        "round";

      ctx.shadowBlur =
        glowStrength;

      ctx.shadowColor =
        "rgba(" +
        primary +
        ", 0.9)";

      ctx.stroke();

      /*
       * When the mouth is open, draw a subtle
       * inner digital opening.
       */

      if (mouthOpen > 0.12) {
        ctx.beginPath();

        ctx.ellipse(
          centerX,
          mouthY +
            mouthOpen *
              8 *
              scale,
          mouthWidth * 0.25,
          Math.max(
            1,
            mouthDepth * 0.32
          ),
          0,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(0, 0, 0, 0.62)";

        ctx.fill();

        ctx.strokeStyle =
          "rgba(" +
          primary +
          ", 0.55)";

        ctx.lineWidth =
          0.8 * scale;

        ctx.stroke();
      }

      ctx.restore();

      /*
       * Tiny click/touch glow.
       * Still only the eyes and mouth are visible.
       */

      if (tapPulse > 0.02) {
        const gradient =
          ctx.createRadialGradient(
            centerX,
            centerY,
            10,
            centerX,
            centerY,
            115 * scale
          );

        gradient.addColorStop(
          0,
          "rgba(" +
            primary +
            ", " +
            tapPulse * 0.09 +
            ")"
        );

        gradient.addColorStop(
          1,
          "rgba(" +
            primary +
            ", 0)"
        );

        ctx.fillStyle =
          gradient;

        ctx.fillRect(
          0,
          0,
          width,
          height
        );
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
      window.removeEventListener(
        "resize",
        resize
      );

      cancelAnimationFrame(
        animationFrame
      );
    };
  }, [state, cameraOn]);

  /*
   * ------------------------------------------------------------
   * POINTER + TOUCH
   * ------------------------------------------------------------
   */

  const updatePointer = (
    clientX: number,
    clientY: number
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    const x =
      ((clientX -
        rect.left) /
        rect.width -
        0.5) *
      2;

    const y =
      ((clientY -
        rect.top) /
        rect.height -
        0.5) *
      2;

    pointerRef.current = {
      x: Math.max(
        -1,
        Math.min(1, x)
      ),
      y: Math.max(
        -1,
        Math.min(1, y)
      ),
    };

    pointerActiveRef.current =
      true;
  };

  const handlePointerMove =
    (
      event: React.PointerEvent<HTMLCanvasElement>
    ) => {
      updatePointer(
        event.clientX,
        event.clientY
      );
    };

  const handlePointerDown =
    (
      event: React.PointerEvent<HTMLCanvasElement>
    ) => {
      updatePointer(
        event.clientX,
        event.clientY
      );

      tapPulseRef.current = 1;
    };

  const handlePointerLeave =
    () => {
      pointerActiveRef.current =
        false;
    };

  /*
   * ------------------------------------------------------------
   * CLEANUP
   * ------------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      stopCamera();
    };
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
        aria-label="Interactive EON digital face"
        onPointerMove={
          handlePointerMove
        }
        onPointerDown={
          handlePointerDown
        }
        onPointerLeave={
          handlePointerLeave
        }
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          minHeight: "420px",
          maxWidth: "620px",
          cursor: "pointer",
          touchAction: "none",
        }}
      />

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
          right: "8px",
          bottom: "8px",
          padding:
            "6px 10px",
          border:
            "1px solid rgba(255, 224, 105, 0.28)",
          borderRadius: "8px",
          background:
            cameraOn
              ? "rgba(255, 224, 105, 0.12)"
              : "rgba(5, 8, 15, 0.45)",
          color:
            cameraOn
              ? "#fff3ae"
              : "rgba(255,255,255,0.65)",
          fontSize: "9px",
          letterSpacing: "1.5px",
          fontWeight: 700,
          cursor: "pointer",
          backdropFilter:
            "blur(8px)",
          zIndex: 5,
        }}
      >
        {cameraOn
          ? "CAMERA ON"
          : "CAMERA"}
      </button>

      {cameraError && (
        <div
          style={{
            position: "absolute",
            right: "8px",
            bottom: "42px",
            maxWidth: "210px",
            padding:
              "7px 9px",
            border:
              "1px solid rgba(255, 100, 100, 0.3)",
            borderRadius: "7px",
            background:
              "rgba(20, 5, 8, 0.75)",
            color:
              "rgba(255, 190, 190, 0.9)",
            fontSize: "9px",
            lineHeight: 1.35,
            textAlign: "right",
          }}
        >
          {cameraError}
        </div>
      )}
    </div>
  );
}
