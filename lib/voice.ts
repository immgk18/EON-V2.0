"use client";

/*
 * ============================================================
 * EON 2.0 — VOICE ENGINE
 * Enhanced Operations Network
 * ============================================================
 */

export type EONMode = "NORMAL" | "NO_LIMITS";

let currentMode: EONMode = "NORMAL";

let normalVoice: SpeechSynthesisVoice | null = null;
let alertVoice: SpeechSynthesisVoice | null = null;

/* ============================================================
   SPEECH RECOGNITION TYPES
   ============================================================ */

type RecognitionEvent = Event & {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type RecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor =
  new () => RecognitionInstance;

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

  const english =
    voices.filter((voice) =>
      voice.lang
        .toLowerCase()
        .startsWith("en")
    );

  const candidates =
    english.length > 0
      ? english
      : voices;

  const preferredMaleNames = [
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

  const femaleNames = [
    "female",
    "zira",
    "samantha",
    "susan",
    "hazel",
    "victoria",
    "karen",
  ];

  let best: SpeechSynthesisVoice | null =
    null;

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

    for (const keyword of preferredMaleNames) {
      if (name.includes(keyword)) {
        score += 15;
      }
    }

    for (const keyword of femaleNames) {
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
      best = voice;
    }
  }

  return best;
}

/* ============================================================
   INITIALIZE VOICES
   ============================================================ */

export function initializeVoiceEngine(): void {
  if (!speechSupported()) {
    return;
  }

  const load = () => {
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

  load();

  window.speechSynthesis.addEventListener(
    "voiceschanged",
    load
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
   NORMAL SPEECH
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
   HIGH ALERT SPEECH
   ============================================================ */

function speakHighAlert(
  text: string
): void {
  /*
   * Deliberate punctuation creates mechanical pauses
   * in browser speech synthesis.
   */

  const roboticText =
    text
      .replace(/\s+/g, " ")
      .replace(/\./g, "... ")
      .replace(/,/g, "... ")
      .trim();

  const utterance =
    new SpeechSynthesisUtterance(
      roboticText
    );

  utterance.lang =
    "en-IN";

  /*
   * DEEP + SLOW
   */

  utterance.rate =
    0.64;

  utterance.pitch =
    0.32;

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
  text: string
): void {
  if (
    !speechSupported() ||
    !text.trim()
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  /*
   * Give the browser a tiny moment to cancel
   * the previous utterance.
   */

  window.setTimeout(() => {
    if (
      currentMode ===
      "NO_LIMITS"
    ) {
      speakHighAlert(text);
    } else {
      speakNormal(text);
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
      "Normal mode restored. How can I assist you?"
    );
  }, 150);
}

/* ============================================================
   HIGH ALERT MODE
   ============================================================ */

export function activateHighAlertMode(): void {
  stopSpeaking();

  currentMode =
    "NO_LIMITS";

  window.setTimeout(() => {
    speak(
      "Warning. High alert protocol activated. Enhanced control systems online."
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
    currentMode ===
    "NO_LIMITS"
  ) {
    speak(
      `System status. ${status}. Awaiting command.`
    );
  } else {
    speak(
      `System status: ${status}.`
    );
  }
}

/* ============================================================
   CREATE VOICE RECOGNITION
   ============================================================
   IMPORTANT:
   Your existing page.tsx imports this function.
   This keeps the microphone system compatible.
   ============================================================ */

export function createVoiceRecognition(
  onResult: (transcript: string) => void,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: string) => void
): RecognitionInstance | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const SpeechRecognition =
    (
      window as typeof window & {
        SpeechRecognition?: RecognitionConstructor;
        webkitSpeechRecognition?: RecognitionConstructor;
      }
    ).SpeechRecognition ||
    (
      window as typeof window & {
        webkitSpeechRecognition?: RecognitionConstructor;
      }
    ).webkitSpeechRecognition;

  if (!SpeechRecognition) {
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

  recognition.onstart =
    () => {
      if (onStart) {
        onStart();
      }
    };

  recognition.onresult =
    (event) => {
      const transcript =
        event.results[0][0]
          .transcript
          .trim();

      if (transcript) {
        onResult(transcript);
      }
    };

  recognition.onerror =
    () => {
      if (onError) {
        onError(
          "Speech recognition error."
        );
      }
    };

  recognition.onend =
    () => {
      if (onEnd) {
        onEnd();
      }
    };

  return recognition;
}

/* ============================================================
   AUTO INITIALIZATION
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
