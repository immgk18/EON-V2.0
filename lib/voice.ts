export type VoiceMode = "NORMAL" | "ALERT";

export type VoiceCallbacks = {
  onStart?: () => void;
  onResult?: (text: string) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
};

function getVoices(): SpeechSynthesisVoice[] {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return [];
  }

  return window.speechSynthesis.getVoices();
}

function findMaleVoice(): SpeechSynthesisVoice | null {
  const voices = getVoices();

  if (!voices.length) {
    return null;
  }

  /*
   * Browser voice names are inconsistent across operating systems.
   * We therefore score likely male English voices rather than
   * depending on one exact voice name.
   */

  const preferredNames = [
    "Google UK English Male",
    "Google US English Male",
    "Microsoft David",
    "Microsoft Mark",
    "Microsoft Guy",
    "Microsoft Ryan",
    "Daniel",
    "Alex",
    "Arthur",
    "Thomas",
    "Oliver",
    "James",
  ];

  for (const preferred of preferredNames) {
    const match = voices.find(
      (voice) =>
        voice.name
          .toLowerCase()
          .includes(preferred.toLowerCase())
    );

    if (match) {
      return match;
    }
  }

  const maleKeywords = [
    "male",
    "david",
    "mark",
    "guy",
    "ryan",
    "daniel",
    "alex",
    "arthur",
    "thomas",
    "oliver",
    "james",
  ];

  const englishMale = voices.find(
    (voice) => {
      const name =
        voice.name.toLowerCase();

      const language =
        voice.lang.toLowerCase();

      return (
        (language.startsWith("en") ||
          language === "en-in") &&
        maleKeywords.some(
          (keyword) =>
            name.includes(keyword)
        )
      );
    }
  );

  if (englishMale) {
    return englishMale;
  }

  const englishVoice =
    voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith("en")
    );

  return englishVoice || voices[0];
}

export function createVoiceRecognition(
  callbacks: VoiceCallbacks
) {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const SpeechRecognition =
    (window as any)
      .SpeechRecognition ||
    (window as any)
      .webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError?.(
      "Speech recognition is not supported in this browser."
    );

    return null;
  }

  const recognition =
    new SpeechRecognition() as SpeechRecognitionInstance;

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-IN";

  recognition.onstart = () => {
    callbacks.onStart?.();
  };

  recognition.onresult = (
    event: any
  ) => {
    const transcript =
      event.results?.[0]?.[0]
        ?.transcript || "";

    if (
      transcript.trim()
    ) {
      callbacks.onResult?.(
        transcript.trim()
      );
    }
  };

  recognition.onerror = (
    event: any
  ) => {
    callbacks.onError?.(
      event?.error ||
        "Voice recognition failed."
    );
  };

  recognition.onend = () => {
    callbacks.onEnd?.();
  };

  return recognition;
}

/*
 * Wait until browser voices have loaded.
 *
 * Some browsers populate speech voices asynchronously.
 */
function loadVoices(): Promise<
  SpeechSynthesisVoice[]
> {
  return new Promise(
    (resolve) => {
      const current =
        getVoices();

      if (current.length) {
        resolve(current);
        return;
      }

      if (
        typeof window ===
        "undefined"
      ) {
        resolve([]);
        return;
      }

      const handleVoices =
        () => {
          const voices =
            getVoices();

          window.speechSynthesis.removeEventListener(
            "voiceschanged",
            handleVoices
          );

          resolve(voices);
        };

      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handleVoices
      );

      setTimeout(() => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoices
        );

        resolve(
          getVoices()
        );
      }, 1200);
    }
  );
}

export async function speak(
  text: string,
  mode: VoiceMode = "NORMAL"
) {
  if (
    typeof window ===
      "undefined" ||
    !(
      "speechSynthesis" in
      window
    )
  ) {
    return;
  }

  const voices =
    await loadVoices();

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  const maleVoice =
    findMaleVoice();

  if (maleVoice) {
    utterance.voice =
      maleVoice;
  }

  utterance.lang =
    maleVoice?.lang ||
    "en-IN";

  /*
   * NORMAL MODE
   *
   * Calm, warm and friendly.
   */
  if (
    mode === "NORMAL"
  ) {
    utterance.rate =
      0.92;

    utterance.pitch =
      0.72;

    utterance.volume =
      1;
  }

  /*
   * HIGH ALERT MODE
   *
   * Slower, lower and more
   * intimidating.
   */
  if (
    mode === "ALERT"
  ) {
    utterance.rate =
      0.68;

    utterance.pitch =
      0.25;

    utterance.volume =
      1;
  }

  /*
   * Keep the variable referenced so
   * TypeScript knows voice loading
   * is intentional even when the
   * browser returns no voice.
   */
  void voices;

  window.speechSynthesis.speak(
    utterance
  );
}

export function stopSpeaking() {
  if (
    typeof window ===
      "undefined" ||
    !(
      "speechSynthesis" in
      window
    )
  ) {
    return;
  }

  window.speechSynthesis.cancel();
}
