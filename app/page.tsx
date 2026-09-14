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

import askThroughGateway from "@/lib/modelGateway";

import {
  getInstantResponse,
  type ProcessingRoute,
  type RequestPriority,
} from "@/lib/speedEngine";

import {
  routeUserRequest,
  type RequestDestination,
} from "@/lib/requestRouter";

import {
  addUserMessage,
  addAssistantMessage,
} from "@/lib/memory";


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


type SpeedInfo = {
  route: ProcessingRoute;
  priority: RequestPriority;
};


export default function Home() {

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const recognitionRef =
    useRef<
      ReturnType<
        typeof createVoiceRecognition
      >
    >(null);


  const [mode, setMode] =
    useState<
      "NORMAL" | "ALERT"
    >("NORMAL");


  const [coreState, setCoreState] =
    useState<CoreState>(
      "idle"
    );


  const [command, setCommand] =
    useState("");


  const [response, setResponse] =
    useState("");


  const [alertBurst, setAlertBurst] =
    useState(false);


  const [isProcessing, setIsProcessing] =
    useState(false);


  const [speedInfo, setSpeedInfo] =
    useState<SpeedInfo | null>(null);


  /* =========================================================
     MEMORY HELPER
     ========================================================= */

  const rememberInteraction = (
    userMessage: string,
    assistantMessage: string
  ) => {

    try {

      addUserMessage(
        userMessage
      );

      if (
        assistantMessage.trim()
      ) {

        addAssistantMessage(
          assistantMessage
        );
      }

    } catch (error) {

      console.warn(
        "EON MEMORY ERROR:",
        error
      );
    }
  };


  /* =========================================================
     STARFIELD
     ========================================================= */

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
            length:
              Math.min(
                450,
                Math.floor(
                  (
                    window.innerWidth *
                    window.innerHeight
                  ) / 4500
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
            (
              (
                Math.sin(
                  star.phase +
                  time *
                    0.001 *
                    star.speed
                ) + 1
              ) / 2
            );


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
              Math.random() * 50
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


  /* =========================================================
     ALERT SOUND
     ========================================================= */

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


        low.connect(master);


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


        high.connect(master);


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
        // Visual alert still works.
      }
    };


  /* =========================================================
     MODE SWITCH
     ========================================================= */

  const toggleMode =
    () => {

      setMode(
        (current) => {

          const next =
            current ===
            "NORMAL"
              ? "ALERT"
              : "NORMAL";


          setAlertBurst(true);


          stopSpeaking();


          if (
            next === "ALERT"
          ) {

            setCoreState(
              "alert"
            );


            setResponse(
              "HIGH ALERT MODE ACTIVATED"
            );


            playAlertSound();


            setTimeout(
              () => {

                speak(
                  "Warning. High alert mode activated.",
                  "ALERT"
                );

              },
              250
            );

          } else {

            setCoreState(
              "idle"
            );


            setResponse(
              "NORMAL MODE RESTORED"
            );


            setTimeout(
              () => {

                speak(
                  "Normal mode restored. How can I assist you?",
                  "NORMAL"
                );

              },
              250
            );
          }


          setTimeout(
            () => {
              setAlertBurst(false);
            },
            1000
          );


          return next;
        }
      );
    };


  /* =========================================================
     COMMAND EXECUTION
     ========================================================= */

  const runCommand =
    async (
      input: string
    ) => {

      const currentCommand =
        input.trim();


      if (
        !currentCommand ||
        isProcessing
      ) {
        return;
      }


      stopSpeaking();


      const result:
        CommandResult =
        processCommand(
          currentCommand
        );


      setCommand("");


      /* =======================================================
         SPEED ENGINE
         ======================================================= */

      const routerResult =
        routeUserRequest(
          currentCommand
        );


      setSpeedInfo({
        route:
          routerResult.speedRoute,
        priority:
          routerResult.priority,
      });


      const destination:
        RequestDestination =
        routerResult.destination;


      /* -------------------------------------------------------
         MODE — ALERT
         ------------------------------------------------------- */

      if (
        result.intent ===
        "MODE_ALERT"
      ) {

        setMode(
          "ALERT"
        );


        setAlertBurst(
          true
        );


        setCoreState(
          "alert"
        );


        const message =
          "HIGH ALERT MODE ACTIVATED";


        setResponse(
          message
        );


        playAlertSound();


        rememberInteraction(
          currentCommand,
          message
        );


        setTimeout(
          () => {

            speak(
              "Warning. High alert mode activated.",
              "ALERT"
            );

          },
          250
        );


        setTimeout(
          () => {
            setAlertBurst(false);
          },
          1000
        );


        return;
      }


      /* -------------------------------------------------------
         MODE — NORMAL
         ------------------------------------------------------- */

      if (
        result.intent ===
        "MODE_NORMAL"
      ) {

        setMode(
          "NORMAL"
        );


        setAlertBurst(
          true
        );


        setCoreState(
          "idle"
        );


        const message =
          "NORMAL MODE RESTORED";


        setResponse(
          message
        );


        rememberInteraction(
          currentCommand,
          message
        );


        setTimeout(
          () => {

            speak(
              "Normal mode restored. How can I assist you?",
              "NORMAL"
            );

          },
          250
        );


        setTimeout(
          () => {
            setAlertBurst(false);
          },
          1000
        );


        return;
      }


      /* -------------------------------------------------------
         SYSTEM STATUS
         ------------------------------------------------------- */

      if (
        result.intent ===
        "SYSTEM_STATUS"
      ) {

        const statusText =
          mode === "ALERT"
            ? "EON is online and operating in high alert mode. Gemini AI brain is connected."
            : "EON is online and operating in normal mode. Gemini AI brain is connected.";


        setResponse(
          statusText.toUpperCase()
        );


        rememberInteraction(
          currentCommand,
          statusText
        );


        setCoreState(
          "speaking"
        );


        speak(
          statusText,
          mode
        );


        setTimeout(
          () => {
            setCoreState("idle");
          },
          4500
        );


        return;
      }


      /* -------------------------------------------------------
         CURRENT MODE
         ------------------------------------------------------- */

      if (
        result.intent ===
        "CURRENT_MODE"
      ) {

        const modeText =
          mode === "ALERT"
            ? "EON is currently operating in high alert mode."
            : "EON is currently operating in normal mode.";


        setResponse(
          modeText.toUpperCase()
        );


        rememberInteraction(
          currentCommand,
          modeText
        );


        setCoreState(
          "speaking"
        );


        speak(
          modeText,
          mode
        );


        setTimeout(
          () => {
            setCoreState("idle");
          },
          3500
        );


        return;
      }


      /* -------------------------------------------------------
         HELP
         ------------------------------------------------------- */

      if (
        result.intent ===
        "HELP"
      ) {

        const help =
          getHelpMessage();


        setResponse(
          help.toUpperCase()
        );


        rememberInteraction(
          currentCommand,
          help
        );


        setCoreState(
          "speaking"
        );


        speak(
          help,
          mode
        );


        setTimeout(
          () => {
            setCoreState("idle");
          },
          5000
        );


        return;
      }


      /* -------------------------------------------------------
         RESET
         ------------------------------------------------------- */

      if (
        result.intent ===
        "RESET"
      ) {

        stopSpeaking();


        if (
          recognitionRef.current
        ) {

          recognitionRef.current.stop();


          recognitionRef.current =
            null;
        }


        setResponse(
          "EON SYSTEM RESET"
        );


        setCommand("");


        setMode(
          "NORMAL"
        );


        setCoreState(
          "idle"
        );


        setAlertBurst(
          false
        );


        setSpeedInfo(
          null
        );


        return;
      }


      /* -------------------------------------------------------
         STOP
         ------------------------------------------------------- */

      if (
        result.intent ===
        "STOP"
      ) {

        stopSpeaking();


        setCoreState(
          "idle"
        );


        setResponse(
          "SPEECH STOPPED"
        );


        return;
      }


      /* =======================================================
         LOCAL SPEED ROUTE
         ======================================================= */

      if (
        destination ===
        "LOCAL"
      ) {

        const instantResponse =
          getInstantResponse(
            routerResult.speedDecision
          );


        if (
          instantResponse
        ) {

          setResponse(
            instantResponse
              .toUpperCase()
          );


          rememberInteraction(
            currentCommand,
            instantResponse
          );


          setCoreState(
            "speaking"
          );


          speak(
            instantResponse,
            mode
          );


          setTimeout(
            () => {
              setCoreState(
                "idle"
              );
            },
            3500
          );


          return;
        }
      }


      /* =======================================================
         FAST / HEAVY → AI BACKEND
         ======================================================= */

      setIsProcessing(
        true
      );


      setCoreState(
        "thinking"
      );


      const routeLabel =
        destination === "HEAVY_AI"
          ? "HEAVY AI"
          : destination === "WEB"
            ? "WEB → AI FALLBACK"
            : destination === "VISION"
              ? "VISION → AI FALLBACK"
              : destination === "AGENT"
                ? "AGENT → AI FALLBACK"
                : destination === "TOOLS"
                  ? "TOOLS → AI FALLBACK"
                  : routerResult.speedRoute ===
                    "FAST_AI"
                    ? "FAST AI"
                    : "AI";


      setResponse(
        `EON ${routeLabel} ROUTE: ${currentCommand.toUpperCase()}`
      );


      try {

        const aiResult =
          await askThroughGateway({
            message: currentCommand,
            mode,
            destination,
          });


        setResponse(
          aiResult.response
        );


        rememberInteraction(
          currentCommand,
          aiResult.response
        );


        setCoreState(
          "speaking"
        );


        speak(
          aiResult.response,
          mode
        );


        setTimeout(
          () => {

            setCoreState(
              "idle"
            );

          },
          7000
        );

      } catch (
        error
      ) {

        console.error(
          "EON FRONTEND AI ERROR:",
          error
        );


        const errorMessage =
          "EON AI is temporarily unavailable. Please try again.";


        setResponse(
          errorMessage.toUpperCase()
        );


        setCoreState(
          "alert"
        );


        speak(
          errorMessage,
          mode
        );


        setTimeout(
          () => {

            setCoreState(
              "idle"
            );

          },
          3500
        );

      } finally {

        setIsProcessing(
          false
        );
      }
    };


  /* =========================================================
     TEXT COMMAND
     ========================================================= */

  const submitCommand =
    async () => {

      if (
        !command.trim()
      ) {
        return;
      }


      await runCommand(
        command
      );
    };


  /* =========================================================
     VOICE
     ========================================================= */

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
              async (
                text
              ) => {

                setCommand(
                  text
                );


                setResponse(
                  `VOICE COMMAND: ${text.toUpperCase()}`
                );


                setCoreState(
                  "thinking"
                );


                await runCommand(
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


      if (
        !recognition
      ) {
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


  /* =========================================================
     RESET
     ========================================================= */

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


      setResponse("");


      setCommand("");


      setMode(
        "NORMAL"
      );


      setCoreState(
        "idle"
      );


      setAlertBurst(
        false
      );


      setIsProcessing(
        false
      );


      setSpeedInfo(
        null
      );
    };


  /* =========================================================
     UI
     ========================================================= */

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
          (tool) => (

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

          )
        )}

      </aside>


      {/* RIGHT TOOLS */}

      <aside
        className="toolColumn rightTools"
      >

        {toolsRight.map(
          (tool) => (

            <button
              className="toolButton"
              key={tool.label}
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

      <section
        className="coreArea"
      >

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

          <div
            className="response"
          >
            {response}
          </div>

        )}


        {/* SPEED ENGINE STATUS */}

        {speedInfo && (

          <div
            className="speedStatus"
            aria-label="EON speed routing status"
          >
            {speedInfo.route}
            {" • "}
            {speedInfo.priority}
          </div>

        )}

      </section>


      {/* COMMAND AREA */}

      <section
        className="bottomArea"
      >

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
            {isProcessing
              ? "◉◉◉"
              : "▮▮▮"}
          </span>


          <input
            value={command}
            onChange={(
              event
            ) =>
              setCommand(
                event.target.value
              )
            }
            placeholder={
              isProcessing
                ? "EON IS THINKING..."
                : "Type or speak a command..."
            }
            aria-label="EON command"
            disabled={
              isProcessing
            }
          />


          <button
            type="submit"
            className="sendButton"
            aria-label="Send command"
            disabled={
              isProcessing
            }
          >
            ➤
          </button>

        </form>


        <div
          className="bottomControls"
        >

          <button
            className="controlButton"
            type="button"
            onClick={
              toggleMode
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
