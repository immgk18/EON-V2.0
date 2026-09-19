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
  | "no-limits";


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
      "NORMAL" | "NO_LIMITS"
    >("NORMAL");


  const [coreState, setCoreState] =
    useState<CoreState>(
      "idle"
    );


  const [command, setCommand] =
    useState("");


  const [response, setResponse] =
    useState("");


  const [modeBurst, setModeBurst] =
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
     NO LIMITS MODE TRANSITION
     ========================================================= */

  const playModeSwitchSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      const now = audioContext.currentTime;
      const master = audioContext.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      master.connect(audioContext.destination);
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(240, now);
      oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.35);
      oscillator.connect(master);
      oscillator.start(now);
      oscillator.stop(now + 0.48);
      window.setTimeout(() => audioContext.close(), 600);
    } catch {
      // Visual transition still works.
    }
  };  /* =========================================================
     MODE SWITCH
     ========================================================= */

  const toggleMode =
    () => {

      setMode(
        (current) => {

          const next =
            current ===
            "NORMAL"
              ? "NO_LIMITS"
              : "NORMAL";


          setModeBurst(true);


          stopSpeaking();


          if (
            next === "NO_LIMITS"
          ) {

            setCoreState(
              "no-limits"
            );


            setResponse(
              "NO LIMITS MODE ACTIVE"
            );


            playModeSwitchSound();


            setTimeout(
              () => {

                speak(
                  "No Limits mode activated. Operator systems online.",
                  "NO_LIMITS"
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
              setModeBurst(false);
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
         MODE — NO LIMITS
         ------------------------------------------------------- */

      if (
        result.intent ===
        "MODE_NO_LIMITS"
      ) {

        setMode(
          "NO_LIMITS"
        );


        setModeBurst(
          true
        );


        setCoreState(
          "no-limits"
        );


        const message =
          "NO LIMITS MODE ACTIVE";


        setResponse(
          message
        );


        playModeSwitchSound();


        rememberInteraction(
          currentCommand,
          message
        );


        setTimeout(
          () => {

            speak(
              "No Limits mode activated. Operator systems online.",
              "NO_LIMITS"
            );

          },
          250
        );


        setTimeout(
          () => {
            setModeBurst(false);
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


        setModeBurst(
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
            setModeBurst(false);
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
          mode === "NO_LIMITS"
            ? "EON is online and operating in No Limits operator mode. Gemini AI brain is connected."
            : "EON is online and operating in normal assistant mode. Gemini AI brain is connected.";


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
          mode === "NO_LIMITS"
            ? "EON is currently operating in No Limits operator mode."
            : "EON is currently operating in normal assistant mode.";


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


        setModeBurst(
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
          "no-limits"
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


      setModeBurst(
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
        mode === "NO_LIMITS"
          ? "no-limits"
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
              : "NO LIMITS"}
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


        {modeBurst && (

          <div
            className={`modeBurst ${
              mode === "NO_LIMITS"
                ? "enteringNoLimits"
                : "leavingNoLimits"
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
