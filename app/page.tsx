"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import EnergyCore from "@/components/EnergyCore";
import DesignWorkspace from "@/components/DesignWorkspace";

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
import { analyzeEONImage } from "@/lib/eonApi";

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
  getMemorySummary,
} from "@/lib/memory";

import {
  EON_AGENTS,
  type EONAgentId,
} from "@/lib/agents";

import executeAgentTask from "@/lib/agentExecutor";

import {
  loadChatSessions,
  ensureActiveChatSession,
  createChatSession,
  addChatTurn,
  setActiveChat,
  deleteChatSession,
  type ChatSession,
} from "@/lib/chatHistory";


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

  const [visionBusy, setVisionBusy] =
    useState(false);

  const [playfulCommand, setPlayfulCommand] =
    useState("");

  const triggerPlayfulReaction = (
    text: string
  ) => {
    const value = text.toLowerCase().trim();

    const action =
      /(dance|dancing|party)/.test(value)
        ? "dance"
        : /(wave|hello|hi eon|say hi)/.test(value)
          ? "wave"
          : /(butterfly|admire|beautiful)/.test(value)
            ? "butterfly"
            : /(yawn|sleepy|tired)/.test(value)
              ? "yawn"
              : /(laugh|funny|joke|hehe)/.test(value)
                ? "laugh"
                : /(surprise|surprised|whoa|wow)/.test(value)
                  ? "surprised"
                  : /(spin|dizzy|head spin)/.test(value)
                    ? "spin"
                    : /(hands|hand dance|fidget)/.test(value)
                      ? "hands"
                      : /(look at me|admire this)/.test(value)
                        ? "admire"
                        : "";

    if (!action) return;

    setPlayfulCommand(action);

    window.setTimeout(() => {
      setPlayfulCommand("");
    }, action === "butterfly" || action === "admire" ? 7000 : 4500);
  };


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

        const session =
          currentChatId
            ? addChatTurn(
                currentChatId,
                userMessage,
                assistantMessage
              )
            : null;

        if (session) {
          setChatSessions((sessions) => [
            session,
            ...sessions.filter(
              (chat) => chat.id !== session.id
            ),
          ]);
        }
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


      let destination:
        RequestDestination =
        routerResult.destination;

      const activeAgent =
        EON_AGENTS.find((agent) => agent.id === selectedAgent);

      if (activeAgent && selectedAgent !== "CORE") {
        destination = activeAgent.destination === "AI"
          ? "AI"
          : activeAgent.destination;
      }


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

        let finalResponse = "";

        if (
          destination === "AGENT" ||
          (activeAgent && selectedAgent !== "CORE")
        ) {
          const agentId =
            selectedAgent !== "CORE"
              ? selectedAgent
              : destination === "AGENT"
                ? "RESEARCH"
                : "CORE";

          const execution = await executeAgentTask(
            agentId,
            currentCommand,
            mode,
            destination
          );

          finalResponse = execution.response;

          // Chat panel shows ONLY the final answer.
          setResponse(finalResponse);

          setTerminalLines((lines) => [
            ...lines.slice(-5),
            `AGENT ${execution.agent.id} • EXECUTION COMPLETE`,
            ...execution.steps.map(
              (step, index) =>
                `STEP ${index + 1} • ${step}`
            ),
          ]);
        } else {
          const aiResult =
            await askThroughGateway({
              message: currentCommand,
              mode,
              destination,
            });

          finalResponse = aiResult.response;

          setResponse(
            finalResponse
          );
        }

        rememberInteraction(
          currentCommand,
          finalResponse
        );

        setCoreState(
          "speaking"
        );

        speak(
          finalResponse,
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

      triggerPlayfulReaction(command);

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


  const [activePanel, setActivePanel] = useState<
    "SYSTEM" | "CHAT" | "HISTORY" | "CONTEXT" | "MEMORY" | "VISION" | "WEB" | "AGENTS" | "TOOLS" | "COMMANDS" | "VOICE" | "SETTINGS" | "DESIGN"
  >("SYSTEM");

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<EONAgentId>("CORE");

  useEffect(() => {
    const activeChat = ensureActiveChatSession();
    setCurrentChatId(activeChat.id);
    setChatSessions(loadChatSessions());
  }, []);

  const [terminalLines, setTerminalLines] = useState<string[]>([
    "EON CORE INITIALIZED",
    "AI        READY",
    "WEB       READY",
    "VISION    READY",
    "MEMORY    READY",
    "AGENTS    READY",
    "WORKSPACE READY",
  ]);

  const selectPanel = (
    panel: "SYSTEM" | "CHAT" | "HISTORY" | "CONTEXT" | "MEMORY" | "VISION" | "WEB" | "AGENTS" | "TOOLS" | "COMMANDS" | "VOICE" | "SETTINGS" | "DESIGN"
  ) => {
    setActivePanel(panel);

    const panelMessages: Record<typeof panel, string> = {
      SYSTEM: "SYSTEM STATUS PANEL OPEN",
      CONTEXT: "CONTEXT ENGINE PANEL OPEN",
      MEMORY: "MEMORY ENGINE PANEL OPEN",
      VISION: "VISION MODULE READY",
      WEB: "WEB INTELLIGENCE PANEL OPEN",
      AGENTS: "AGENT ORCHESTRATION PANEL OPEN",
      TOOLS: "TOOLS CONTROL PANEL OPEN",
      CHAT: "CHAT WORKSPACE OPEN",
      HISTORY: "CHAT HISTORY OPEN",
      COMMANDS: "COMMAND CENTER OPEN",
      VOICE: "VOICE CONTROL PANEL OPEN",
      SETTINGS: "SETTINGS PANEL OPEN",
      DESIGN: "DESIGN WORKSPACE OPEN",
    };

    if (panel !== "CHAT") {
      setResponse(panelMessages[panel]);
    }
    setTerminalLines((lines) => [
      ...lines.slice(-5),
      `eon@core:~$ open ${panel.toLowerCase()}`,
      panelMessages[panel],
    ]);
  };

  const openHistoryChat = (chatId: string) => {
    const chat = setActiveChat(chatId);
    if (!chat) return;

    setCurrentChatId(chat.id);
    setResponse(
      chat.messages.length > 0
        ? chat.messages[chat.messages.length - 1].content
        : ""
    );
    setActivePanel("HISTORY");
    setTerminalLines((lines) => [
      ...lines.slice(-5),
      `eon@core:~$ open chat "${chat.title}"`,
      "CHAT HISTORY • CONVERSATION LOADED",
    ]);
  };

  const deleteHistoryChat = (chatId: string) => {
    const wasActive = currentChatId === chatId;
    deleteChatSession(chatId);

    const sessions = loadChatSessions();
    setChatSessions(sessions);

    if (wasActive) {
      const next = ensureActiveChatSession();
      setCurrentChatId(next.id);
      setResponse(
        next.messages.length > 0
          ? next.messages[next.messages.length - 1].content
          : ""
      );
    }

    setTerminalLines((lines) => [
      ...lines.slice(-5),
      `eon@core:~$ delete chat "${chatId}"`,
      "CHAT DELETED • HISTORY UPDATED",
    ]);
  };

  const startNewChat = () => {
    const chat = createChatSession();
    setCurrentChatId(chat.id);
    setChatSessions(loadChatSessions());
    setResponse("");
    setCommand("");
    setActivePanel("CHAT");
    setTerminalLines((lines) => [
      ...lines.slice(-5),
      "eon@core:~$ new chat",
      "NEW CHAT • READY",
    ]);
  };

  const activateAgent = (agentId: EONAgentId) => {
    setSelectedAgent(agentId);
    const agent = EON_AGENTS.find((item) => item.id === agentId);
    setResponse(agent ? `${agent.name} SELECTED • ${agent.description}` : "AGENT SELECTED");
    setTerminalLines((lines) => [
      ...lines.slice(-5),
      `eon@core:~$ agent ${agentId.toLowerCase()}`,
      agent ? `${agent.name} ONLINE • ROUTE ${agent.destination}` : "AGENT READY",
    ]);
  };

  const handleVisionUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setResponse("VISION REQUIRES AN IMAGE FILE.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setResponse("IMAGE IS TOO LARGE. MAXIMUM SIZE IS 8 MB.");
      return;
    }

    setVisionBusy(true);
    setIsProcessing(true);
    setCoreState("thinking");
    setActivePanel("VISION");
    setResponse("EON VISION IS ANALYZING THE IMAGE...");

    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const value = String(reader.result || "");
          resolve(value.split(",")[1] || value);
        };
        reader.onerror = () => reject(new Error("Image could not be read."));
        reader.readAsDataURL(file);
      });

      const result = await analyzeEONImage(
        imageBase64,
        file.type,
        "Analyze this image for the user's request. Describe only visible information and clearly separate observations from uncertainty."
      );

      setResponse(result.response);
      rememberInteraction("Analyze uploaded image", result.response);
      setTerminalLines((lines) => [
        ...lines.slice(-5),
        "VISION • IMAGE ANALYSIS COMPLETE",
        `VISION MODEL • ${result.model}`,
      ]);
      speak(result.response, mode);
      setCoreState("speaking");
      window.setTimeout(() => setCoreState("idle"), 7000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "EON Vision could not analyze the image.";
      setResponse(message.toUpperCase());
      setCoreState("idle");
    } finally {
      setVisionBusy(false);
      setIsProcessing(false);
    }
  };

  const runTerminalCommand = (input: string) => {
    const value = input.trim();
    if (!value) return;

    let output = "";

    if (value.toLowerCase() === "system") {
      output = "CORE ONLINE • AI READY • WEB READY • VISION READY • MEMORY READY • AGENTS READY • WORKSPACE READY";
      selectPanel("SYSTEM");
    } else if (value.toLowerCase().startsWith("route ")) {
      const routed = routeUserRequest(value.slice(6));
      output = `DESTINATION: ${routed.destination} • PRIORITY: ${routed.priority} • STATUS: READY`;
    } else if (value.toLowerCase() === "clear") {
      setTerminalLines([]);
      return;
    } else {
      output = "COMMAND RECEIVED • USE SYSTEM, ROUTE <REQUEST>, OR CLEAR";
    }

    setTerminalLines((lines) => [
      ...lines.slice(-5),
      `eon@core:~$ ${value}`,
      output,
    ]);
  };

  return (
    <main
      className={`eonDesktop ${mode === "NO_LIMITS" ? "no-limits" : ""}`}
    >
      <canvas ref={canvasRef} className="stars" />
      <div className="desktopGlow" />

      <header className="desktopTopBar">
        <div className="desktopBrand">
          <span className="brandMark">EON</span>
          <span className="brandName">ENHANCED OPERATIONS NETWORK</span>
        </div>

        <nav className="desktopMenu" aria-label="EON desktop menu">
          {["File", "Edit", "View", "Tools", "Agents", "Window"].map((item) => (
            <button
              key={item}
              type="button"
              className="menuItem"
              onClick={() => {
                if (item === "File" || item === "Window") {
                  setTerminalOpen((open) => !open);
                  setResponse("TERMINAL TOGGLED • EON CHAT REMAINS AVAILABLE");
                } else if (item === "Edit") {
                  selectPanel("COMMANDS");
                } else if (item === "Agents") {
                  selectPanel("AGENTS");
                } else if (item === "Tools") {
                  selectPanel("TOOLS");
                } else {
                  selectPanel("CONTEXT");
                }
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="desktopStatus">
          <span className="onlineDot" />
          <span>{mode === "NORMAL" ? "ONLINE" : "NO LIMITS"}</span>
        </div>
      </header>

      <div className="desktopWorkspace">
        <aside className="systemRail">
          <div className="railTitle">SYSTEM</div>
          {[
            ["SYSTEM", "◈"],
            ["CHAT", "▣"],
            ["HISTORY", "▤"],
            ["CONTEXT", "◇"],
            ["MEMORY", "◎"],
            ["VISION", "◉"],
            ["WEB", "⌁"],
            ["AGENTS", "▦"],
            ["TOOLS", "⚙"],
            ["COMMANDS", "⌁"],
            ...(mode === "NO_LIMITS" ? [["DESIGN", "◇"]] : []),
          ].map(([panel, icon]) => (
            <button
              key={panel}
              type="button"
              className={`railButton ${
                activePanel === panel ? "active" : ""
              }`}
              onClick={() => selectPanel(panel as typeof activePanel)}
            >
              <span>{icon}</span>
              <small>{panel}</small>
            </button>
          ))}
        </aside>

        <section className="coreViewport">
          <div className="coreHeader">
            <span>EON CORE</span>
            <span className="coreHeaderLine" />
            <span>{coreState.toUpperCase()}</span>
          </div>

          <div className="coreCanvas">
            <EnergyCore
              state={coreState}
              playfulCommand={playfulCommand}
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
          </div>

          <div className="corePrompt">
            <span className="promptGlyph">&gt;_</span>
            <form
              className="desktopCommand"
              onSubmit={(event) => {
                event.preventDefault();
                submitCommand();
              }}
            >
              <input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder={
                  isProcessing
                    ? "EON IS THINKING..."
                    : "Ask EON anything..."
                }
                aria-label="Ask EON"
                disabled={isProcessing}
              />
              <button
                type="button"
                className="voiceButton"
                onClick={startVoice}
                aria-label="Start voice command"
              >
                ◉
              </button>
              <button
                type="submit"
                className="coreSend"
                disabled={isProcessing}
                aria-label="Send command"
              >
                ↵
              </button>
            </form>
          </div>

        </section>

        <aside className="contextPanel">
          <div className="panelHeading">
            <span>{activePanel}</span>
            <span className="panelIndicator">●</span>
          </div>

          <div className="panelBody">            {activePanel === "HISTORY" && (
              <div className="historyWorkspace">
                <div className="historyHeaderRow">
                  <span>PREVIOUS CHATS</span>
                  <button
                    type="button"
                    className="panelAction historyNewButton"
                    onClick={startNewChat}
                  >
                    + NEW CHAT
                  </button>
                </div>

                <div className="historyList">
                  {chatSessions.length === 0 ? (
                    <div className="chatEmptyState">
                      NO PREVIOUS CHATS.
                    </div>
                  ) : (
                    chatSessions.map((chat) => (
                      <div
                        key={chat.id}
                        className={`historyItem ${
                          currentChatId === chat.id ? "selected" : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="historyItemOpen"
                          onClick={() => openHistoryChat(chat.id)}
                        >
                          <span className="historyItemTitle">
                            {chat.title}
                          </span>
                          <span className="historyItemMeta">
                            {chat.messages.length} MESSAGES
                          </span>
                        </button>
                        <button
                          type="button"
                          className="historyDeleteButton"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteHistoryChat(chat.id);
                          }}
                          aria-label={`Delete chat ${chat.title}`}
                          title="Delete chat"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="historyConversation">
                  {(chatSessions.find((chat) => chat.id === currentChatId)?.messages ?? []).map((message) => (
                    <div
                      key={message.id}
                      className={`chatMessage ${
                        message.role === "user"
                          ? "userMessage"
                          : "assistantMessage"
                      }`}
                    >
                      <span className="chatMessageRole">
                        {message.role === "user" ? "YOU" : "EON"}
                      </span>
                      <div className="chatMessageContent">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "CHAT" && (
              <div className="chatWorkspace">
                <div className="chatWorkspaceHeader">
                  <span>EON RESPONSE</span>
                  <span>{isProcessing ? "PROCESSING" : "READY"}</span>
                </div>

                <div className="chatConversation">
                  {(chatSessions.find((chat) => chat.id === currentChatId)?.messages ?? []).map((message) => (
                    <div
                      key={message.id}
                      className={`chatMessage ${
                        message.role === "user"
                          ? "userMessage"
                          : "assistantMessage"
                      }`}
                    >
                      <span className="chatMessageRole">
                        {message.role === "user" ? "YOU" : "EON"}
                      </span>
                      <div className="chatMessageContent">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="chatResponseBox" aria-live="polite">
                  {response ? (
                    <div className="chatResponseText">
                      {response}
                    </div>
                  ) : (
                    <div className="chatEmptyState">
                      ASK EON SOMETHING.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="panelAction"
                  onClick={() => {
                    document.querySelector<HTMLInputElement>(
                      'input[aria-label="Ask EON"]'
                    )?.focus();
                  }}
                >
                  FOCUS COMMAND
                </button>
              </div>
            )}

            {activePanel === "DESIGN" && <DesignWorkspace />}

            {activePanel === "COMMANDS" && (
              <div className="panelStack">
                <button type="button" className="panelAction" onClick={() => setResponse(getHelpMessage().toUpperCase())}>SHOW COMMANDS</button>
                <button type="button" className="panelAction" onClick={resetEON}>RESET EON</button>
                <button type="button" className="panelAction" onClick={() => { stopSpeaking(); setResponse("SPEECH STOPPED"); }}>STOP SPEECH</button>
              </div>
            )}

            {activePanel === "VOICE" && (
              <div className="panelStack">
                <button type="button" className="panelAction" onClick={startVoice}>TOGGLE VOICE</button>
                <button type="button" className="panelAction" onClick={() => { stopSpeaking(); setResponse("VOICE OUTPUT STOPPED"); }}>STOP OUTPUT</button>
              </div>
            )}

            {activePanel === "SETTINGS" && (
              <div className="panelStack">
                <div className="metricRow"><span>MODE</span><b>{mode}</b></div>
                <div className="metricRow"><span>TERMINAL</span><b>{terminalOpen ? "OPEN" : "HIDDEN"}</b></div>
                <button type="button" className="panelAction" onClick={() => setTerminalOpen((open) => !open)}>
                  {terminalOpen ? "HIDE TERMINAL" : "OPEN TERMINAL"}
                </button>
              </div>
            )}

            {activePanel === "SYSTEM" && (
              <>
                <div className="metricRow"><span>CORE</span><b>ONLINE</b></div>
                <div className="metricRow"><span>AI</span><b>READY</b></div>
                <div className="metricRow"><span>WEB</span><b>READY</b></div>
                <div className="metricRow"><span>VISION</span><b>READY</b></div>
                <div className="metricRow"><span>MEMORY</span><b>READY</b></div>
                <div className="metricRow"><span>MODE</span><b>{mode}</b></div>
              </>
            )}

            {activePanel === "CONTEXT" && (
              <div className="panelNote">
                Current conversation context is available to EON through its
                memory and request-routing layers.
              </div>
            )}

            {activePanel === "MEMORY" && (
              <div className="panelNote">
                Local memory engine connected. Recent interaction context can
                be stored and reused by EON.
              </div>
            )}

            {activePanel === "VISION" && (
              <div className="panelStack">
                <div className="panelNote">
                  EON Vision is connected to the backend image-analysis engine.
                  Upload an image to run visual analysis.
                </div>
                <label className="panelAction" style={{ display: "block", textAlign: "center", cursor: visionBusy ? "wait" : "pointer" }}>
                  {visionBusy ? "ANALYZING IMAGE..." : "UPLOAD IMAGE"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleVisionUpload}
                    disabled={visionBusy}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            )}

            {activePanel === "WEB" && (
              <div className="panelNote">
                Web intelligence route available through EON's request
                router and grounded AI backend.
              </div>
            )}

            {activePanel === "AGENTS" && (
              <div className="agentList">
                {EON_AGENTS.map((agent) => (
                  <button key={agent.id} type="button" className={`agentCard ${selectedAgent === agent.id ? "selected" : ""}`} onClick={() => activateAgent(agent.id)}>
                    <span className="agentCardTop"><b>{agent.name}</b><i>● ONLINE</i></span>
                    <small>{agent.description}</small>
                    <em>ROUTE • {agent.destination}</em>
                  </button>
                ))}
              </div>
            )}

            {activePanel === "TOOLS" && (
              <div className="panelStack">
                <div className="panelNote">
                  Deterministic tools are connected for arithmetic, unit
                  conversion and UTC time. Use the command bar to invoke them.
                </div>
                <button
                  type="button"
                  className="panelAction"
                  onClick={() => {
                    setActivePanel("CHAT");
                    setCommand("calculate 25 * 4");
                    window.setTimeout(() => {
                      document.querySelector<HTMLInputElement>(
                        'input[aria-label="Ask EON"]'
                      )?.focus();
                    }, 0);
                  }}
                >
                  TEST CALCULATOR
                </button>
              </div>
            )}
          </div>

          <div className="panelFooter">
            ROUTE&nbsp; {speedInfo?.route ?? "STANDBY"}<br />
            PRIORITY&nbsp; {speedInfo?.priority ?? "NORMAL"}
          </div>
        </aside>
      </div>

      {terminalOpen && (
      <section className="terminalPanel">
        <div className="terminalHeader">
          <span>EON TERMINAL</span>
          <span>COMMAND CONSOLE</span>
        </div>
        <div className="terminalOutput" aria-live="polite">
          {terminalLines.map((line, index) => (
            <div key={`${index}-${line}`} className="terminalLine">
              {line}
            </div>
          ))}
        </div>
        <form
          className="terminalInput"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const input = form.elements.namedItem("terminal") as HTMLInputElement;
            runTerminalCommand(input.value);
            input.value = "";
          }}
        >
          <span>eon@core:~$</span>
          <input
            name="terminal"
            placeholder="system"
            autoComplete="off"
            aria-label="EON terminal command"
          />
        </form>
      </section>
      )}

      <footer className="desktopFooter">
        <span>INTELLIGENCE</span>
        <span>EXECUTION</span>
        <span>AUTONOMY</span>
        <span>BEYOND LIMITS</span>
        <button type="button" onClick={toggleMode}>
          {mode === "NORMAL" ? "ENTER NO LIMITS" : "RESTORE NORMAL"}
        </button>
        <button type="button" onClick={resetEON}>RESET</button>
      </footer>
    </main>
  );
}
