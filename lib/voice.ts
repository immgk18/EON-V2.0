"use client";

/*
 * ============================================================
 * EON 2.0 — VOICE ENGINE
 * Enhanced Operations Network
 * ============================================================
 */

export type EONMode =
  | "NORMAL"
  | "ALERT"
  | "NO_LIMITS";

let currentMode: EONMode = "NORMAL";

let normalVoice: SpeechSynthesisVoice | null = null;
let alertVoice: SpeechSynthesisVoice | null = null;

/* ============================================================
   SPEECH RECOGNITION TYPES
   ============================================================ */

export type VoiceRecognitionCallbacks = {
  onStart?: () => void;

  onResult?: (
    transcript: string
  ) => void;

  onEnd?: () => void;

  onError?: (
    error: string
  ) => void;
};

export type VoiceRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start: () => void;
  stop: () => void;
  abort: () => void;

  onstart:
    (() => void) | null;

  onresult:
    ((event: RecognitionEvent) => void) | null;

  onerror:
    ((event: Event) => void) | null;

  onend:
    (() => void) | null;
};

type RecognitionEvent =
  Event & {
    results: {
      [index: number]: {
        [index: number]: {
          transcript: string;
        };
      };
    };
  };

type RecognitionConstructor =
  new () => VoiceRecognitionInstance;

/* ============================================================
   BROWSER SUPPORT
   ============================================================ */

function speechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  );
}

/* ============================================================
   VOICE SELECTION
   ============================================================ */

function selectVoice(
  voices: SpeechSynthesisVoice[],
  alert: boolean
): SpeechSynthesisVoice | null {
  if (!voices.length) {
    return null;
  }

  const englishVoices =
    voices.filter((voice) =>
      voice.lang
        .toLowerCase()
        .startsWith("en")
    );

  const candidates =
    englishVoices.length > 0
      ? englishVoices
      : voices;

  const maleKeywords = [
    "male",
    "david",
    "mark",
    "george",
    "daniel",
    "james",
    "guy",
    "alex",
    "fred",
    "tom",
    "microsoft david",
    "microsoft mark",
  ];

  const femaleKeywords = [
    "female",
    "zira",
    "samantha",
    "susan",
    "hazel",
    "victoria",
    "karen",
  ];

  let bestVoice:
    SpeechSynthesisVoice | null = null;

  let bestScore = -Infinity;

  for (const voice of candidates) {
    const name =
      voice.name.toLowerCase();

    let score = 0;

    if (
      voice.lang
        .toLowerCase()
        .startsWith("en-in")
    ) {
      score += 12;
    } else if (
      voice.lang
        .toLowerCase()
        .startsWith("en")
    ) {
      score += 8;
    }

    for (const keyword of maleKeywords) {
      if (name.includes(keyword)) {
        score += 15;
      }
    }

    for (const keyword of femaleKeywords) {
      if (name.includes(keyword)) {
        score -= 10;
      }
    }

    if (
      alert &&
      voice.localService
    ) {
      score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

/* ============================================================
   INITIALIZE VOICES
   ============================================================ */

export function initializeVoiceEngine(): void {
  if (!speechSupported()) {
    return;
  }

  const loadVoices = () => {
    const voices =
      window.speechSynthesis.getVoices();

    if (!voices.length) {
      return;
    }

    normalVoice =
      selectVoice(
        voices,
        false
      );

    alertVoice =
      selectVoice(
        voices,
        true
      );
  };

  loadVoices();

  window.speechSynthesis.addEventListener(
    "voiceschanged",
    loadVoices
  );
}

/* ============================================================
   MODE
   ============================================================ */

export function getMode(): EONMode {
  return currentMode;
}

export function setMode(
  mode: EONMode
): void {
  currentMode = mode;
}

/* ============================================================
   NORMAL MODE
   ============================================================ */

function speakNormal(
  text: string
): void {
  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  utterance.lang =
    "en-IN";

  utterance.rate =
    0.94;

  utterance.pitch =
    0.88;

  utterance.volume =
    1;

  if (normalVoice) {
    utterance.voice =
      normalVoice;
  }

  window.speechSynthesis.speak(
    utterance
  );
}

/* ============================================================
   HIGH ALERT MODE
   ============================================================ */

function speakHighAlert(
  text: string
): void {
  /*
   * Mechanical pauses.
   */

  const roboticText =
    text
      .replace(/\s+/g, " ")
      .replace(/\./g, "... ")
      .replace(/,/g, "... ")
      .replace(/!/g, "... ")
      .trim();

  const utterance =
    new SpeechSynthesisUtterance(
      roboticText
    );

  utterance.lang =
    "en-IN";

  /*
   * Deep robotic pitch.
   */

  utterance.pitch =
    0.32;

  /*
   * Slow intimidating cadence.
   */

  utterance.rate =
    0.64;

  utterance.volume =
    1;

  if (alertVoice) {
    utterance.voice =
      alertVoice;
  }

  window.speechSynthesis.speak(
    utterance
  );
}

/* ============================================================
   MAIN SPEAK FUNCTION
   ============================================================ */

export function speak(
  text: string,
  mode?: EONMode
): void {
  if (!speechSupported()) {
    return;
  }

  const cleanText =
    text.trim();

  if (!cleanText) {
    return;
  }

  /*
   * Use explicitly supplied mode,
   * otherwise use current EON mode.
   */

  const speechMode =
    mode ?? currentMode;

  if (mode) {
    currentMode = mode;
  }

  /*
   * Stop previous speech.
   */

  window.speechSynthesis.cancel();

  /*
   * Give browser TTS a moment
   * to clear the previous utterance.
   */

  window.setTimeout(() => {
    /*
     * ALERT and NO_LIMITS both
     * use the robotic voice.
     */

    if (
      speechMode === "ALERT" ||
      speechMode === "NO_LIMITS"
    ) {
      speakHighAlert(
        cleanText
      );
    } else {
      speakNormal(
        cleanText
      );
    }
  }, 50);
}

/* ============================================================
   STOP SPEAKING
   ============================================================ */

export function stopSpeaking(): void {
  if (!speechSupported()) {
    return;
  }

  window.speechSynthesis.cancel();
}

/* ============================================================
   NORMAL MODE
   ============================================================ */

export function activateNormalMode(): void {
  stopSpeaking();

  currentMode =
    "NORMAL";

  window.setTimeout(() => {
    speak(
      "Normal mode restored. How can I assist you?",
      "NORMAL"
    );
  }, 150);
}

/* ============================================================
   HIGH ALERT MODE
   ============================================================ */

export function activateHighAlertMode(): void {
  stopSpeaking();

  currentMode =
    "ALERT";

  window.setTimeout(() => {
    speak(
      "Warning. High alert protocol activated. Enhanced control systems online.",
      "ALERT"
    );
  }, 180);
}

/* ============================================================
   MODE COMMAND DETECTION
   ============================================================ */

export function detectModeCommand(
  text: string
): boolean {
  const command =
    text
      .toLowerCase()
      .trim();

  if (
    command.includes(
      "eon has no limits"
    )
  ) {
    activateHighAlertMode();

    return true;
  }

  if (
    command.includes(
      "eon has limits"
    )
  ) {
    activateNormalMode();

    return true;
  }

  return false;
}

/* ============================================================
   MODE SWITCH
   ============================================================ */

export function switchMode(
  mode: EONMode
): void {
  if (
    mode === currentMode
  ) {
    return;
  }

  if (
    mode === "ALERT" ||
    mode === "NO_LIMITS"
  ) {
    activateHighAlertMode();
  } else {
    activateNormalMode();
  }
}

/* ============================================================
   SYSTEM STATUS
   ============================================================ */

export function speakSystemStatus(
  status: string
): void {
  if (
    currentMode === "ALERT" ||
    currentMode === "NO_LIMITS"
  ) {
    speak(
      `System status. ${status}. Awaiting command.`,
      "ALERT"
    );

    return;
  }

  speak(
    `System status: ${status}.`,
    "NORMAL"
  );
}

/* ============================================================
   CREATE VOICE RECOGNITION
   ============================================================ */

export function createVoiceRecognition(
  callbacks: VoiceRecognitionCallbacks
): VoiceRecognitionInstance | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const browserWindow =
    window as typeof window & {
      SpeechRecognition?: RecognitionConstructor;

      webkitSpeechRecognition?:
        RecognitionConstructor;
    };

  const SpeechRecognition =
    browserWindow.SpeechRecognition ||
    browserWindow.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError?.(
      "Speech recognition is not supported by this browser."
    );

    return null;
  }

  const recognition =
    new SpeechRecognition();

  recognition.continuous =
    false;

  recognition.interimResults =
    false;

  recognition.lang =
    "en-IN";

  /* START */

  recognition.onstart =
    () => {
      callbacks.onStart?.();
    };

  /* RESULT */

  recognition.onresult =
    (event) => {
      const transcript =
        event.results[0][0]
          .transcript
          .trim();

      if (transcript) {
        callbacks.onResult?.(
          transcript
        );
      }
    };

  /* ERROR */

  recognition.onerror =
    () => {
      callbacks.onError?.(
        "Speech recognition error."
      );
    };

  /* END */

  recognition.onend =
    () => {
      callbacks.onEnd?.();
    };

  return recognition;
}

/* ============================================================
   INITIALIZATION
   ============================================================ */

if (
  typeof window !==
  "undefined"
) {
  initializeVoiceEngine();
}

/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

const EONVoice = {
  speak,
  stopSpeaking,
  getMode,
  setMode,
  switchMode,
  activateNormalMode,
  activateHighAlertMode,
  detectModeCommand,
  speakSystemStatus,
  initializeVoiceEngine,
  createVoiceRecognition,
};

export default EONVoice;
