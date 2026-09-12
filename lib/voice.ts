"use client";

/*
 * ============================================================
 * EON 2.0 — VOICE ENGINE
 * Enhanced Operations Network
 *
 * NORMAL MODE:
 * - Natural male-oriented browser voice selection
 * - Friendly
 * - Moderate speed
 * - Normal pitch
 *
 * HIGH ALERT MODE:
 * - Deep voice selection
 * - Very low pitch
 * - Slower cadence
 * - Mechanical command delivery
 * - Deliberate pauses
 * - Mode-transition announcements
 *
 * NOTE:
 * Browser SpeechSynthesis voices vary by operating system/browser.
 * A dedicated TTS backend can provide a truly consistent voice later.
 * ============================================================
 */

export type EONMode = "NORMAL" | "NO_LIMITS";

let currentMode: EONMode = "NORMAL";

let voicesLoaded = false;

let selectedNormalVoice: SpeechSynthesisVoice | null = null;
let selectedAlertVoice: SpeechSynthesisVoice | null = null;

/* ============================================================
   MODE
   ============================================================ */

export function getMode(): EONMode {
  return currentMode;
}

export function setMode(mode: EONMode): void {
  currentMode = mode;
}

/* ============================================================
   BROWSER CHECK
   ============================================================ */

function speechAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  );
}

/* ============================================================
   VOICE LOADING
   ============================================================ */

function loadVoices(): SpeechSynthesisVoice[] {
  if (!speechAvailable()) {
    return [];
  }

  const voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    voicesLoaded = true;
  }

  return voices;
}

/* ============================================================
   VOICE SELECTION
   ============================================================ */

function findBestVoice(
  voices: SpeechSynthesisVoice[],
  alert: boolean
): SpeechSynthesisVoice | null {
  if (!voices.length) {
    return null;
  }

  const englishVoices = voices.filter(
    (voice) =>
      voice.lang.toLowerCase().startsWith("en")
  );

  const candidates =
    englishVoices.length > 0
      ? englishVoices
      : voices;

  /*
   * Browser voice names differ between Windows,
   * Chrome, Edge, Android, macOS, etc.
   *
   * We therefore use keyword scoring instead of
   * relying on one exact voice name.
   */

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
    "google uk english male",
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

  let bestVoice: SpeechSynthesisVoice | null =
    null;

  let bestScore = -Infinity;

  for (const voice of candidates) {
    const name =
      voice.name.toLowerCase();

    let score = 0;

    /*
     * Prefer English.
     */

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

    /*
     * Male-oriented voices.
     */

    for (const keyword of maleKeywords) {
      if (name.includes(keyword)) {
        score += 15;
      }
    }

    /*
     * Avoid known female-oriented names
     * when possible.
     */

    for (const keyword of femaleKeywords) {
      if (name.includes(keyword)) {
        score -= 12;
      }
    }

    /*
     * HIGH ALERT prefers local/system voices because
     * they are often more stable for lower pitch.
     */

    if (alert && !voice.localService) {
      score -= 1;
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
  if (!speechAvailable()) {
    return;
  }

  const selectVoices = () => {
    const voices =
      loadVoices();

    selectedNormalVoice =
      findBestVoice(
        voices,
        false
      );

    selectedAlertVoice =
      findBestVoice(
        voices,
        true
      );
  };

  selectVoices();

  /*
   * Some browsers load voices asynchronously.
   */

  if (!voicesLoaded) {
    window.speechSynthesis.addEventListener(
      "voiceschanged",
      selectVoices,
      {
        once: true,
      }
    );
  }
}

/* ============================================================
   NORMAL MODE TEXT
   ============================================================ */

function prepareNormalText(
  text: string
): string {
  return text
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   HIGH ALERT TEXT PROCESSOR
   ============================================================ */

function prepareAlertText(
  text: string
): string {
  let result =
    text
      .replace(/\s+/g, " ")
      .trim();

  /*
   * Make the browser TTS use a more deliberate cadence.
   *
   * These pauses are intentionally created through
   * punctuation because SpeechSynthesis doesn't provide
   * reliable phoneme-level timing controls.
   */

  result = result
    .replace(/\./g, ". ...")
    .replace(/!/g, "! ...")
    .replace(/\?/g, "? ...")
    .replace(/,/g, ", ...");

  /*
   * Short command phrases become more mechanical.
   */

  return result;
}

/* ============================================================
   SPEAK
   ============================================================ */

export function speak(
  text: string
): void {
  if (!speechAvailable()) {
    return;
  }

  const cleanText =
    text.trim();

  if (!cleanText) {
    return;
  }

  /*
   * Stop previous speech immediately.
   */

  window.speechSynthesis.cancel();

  /*
   * Refresh voice list if necessary.
   */

  if (
    !selectedNormalVoice ||
    !selectedAlertVoice
  ) {
    initializeVoiceEngine();
  }

  const alert =
    currentMode === "NO_LIMITS";

  const processedText =
    alert
      ? prepareAlertText(cleanText)
      : prepareNormalText(cleanText);

  const utterance =
    new SpeechSynthesisUtterance(
      processedText
    );

  /*
   * EON uses Indian English when available.
   */

  utterance.lang =
    "en-IN";

  /*
   * ========================================================
   * NORMAL MODE
   * ========================================================
   */

  if (!alert) {
    utterance.rate =
      0.94;

    utterance.pitch =
      0.88;

    utterance.volume =
      1;

    if (selectedNormalVoice) {
      utterance.voice =
        selectedNormalVoice;
    }
  }

  /*
   * ========================================================
   * HIGH ALERT MODE
   * ========================================================
   *
   * Much deeper + slower.
   *
   * Browser pitch normally ranges from 0 to 2.
   * 0.35 produces a noticeably deeper synthetic voice.
   */

  if (alert) {
    utterance.rate =
      0.68;

    utterance.pitch =
      0.35;

    utterance.volume =
      1;

    if (selectedAlertVoice) {
      utterance.voice =
        selectedAlertVoice;
    }
  }

  /*
   * Optional callbacks.
   */

  utterance.onstart = () => {
    if (
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(
        new CustomEvent(
          "eon:speaking",
          {
            detail: {
              mode: currentMode,
            },
          }
        )
      );
    }
  };

  utterance.onend = () => {
    if (
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(
        new CustomEvent(
          "eon:speech-end"
        )
      );
    }
  };

  utterance.onerror = () => {
    if (
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(
        new CustomEvent(
          "eon:speech-error"
        )
      );
    }
  };

  window.speechSynthesis.speak(
    utterance
  );
}

/* ============================================================
   STOP
   ============================================================ */

export function stopSpeaking(): void {
  if (!speechAvailable()) {
    return;
  }

  window.speechSynthesis.cancel();
}

/* ============================================================
   NORMAL MODE TRANSITION
   ============================================================ */

export function activateNormalMode(): void {
  stopSpeaking();

  currentMode =
    "NORMAL";

  /*
   * Slight delay lets the previous speech cancel cleanly.
   */

  window.setTimeout(() => {
    speak(
      "Normal mode restored. How can I assist you?"
    );
  }, 120);
}

/* ============================================================
   HIGH ALERT TRANSITION
   ============================================================ */

export function activateHighAlertMode(): void {
  stopSpeaking();

  currentMode =
    "NO_LIMITS";

  /*
   * This wording is intentionally short.
   * Short commands sound much more synthetic
   * when combined with the deep pitch + slow rate.
   */

  window.setTimeout(() => {
    speak(
      "Warning. ... High alert protocol activated. ... Enhanced control systems online."
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

  /*
   * HIGH ALERT
   */

  if (
    command.includes(
      "eon has no limits"
    )
  ) {
    activateHighAlertMode();

    return true;
  }

  /*
   * NORMAL
   */

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
   DIRECT MODE SWITCH
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
   STATUS ANNOUNCEMENTS
   ============================================================ */

export function speakSystemStatus(
  status: string
): void {
  if (
    currentMode ===
    "NO_LIMITS"
  ) {
    speak(
      `System status. ... ${status}. ... Awaiting command.`
    );

    return;
  }

  speak(
    `System status: ${status}.`
  );
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
};

export default EONVoice;
