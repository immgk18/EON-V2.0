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

export function createVoiceRecognition(
  callbacks: VoiceCallbacks
) {
  if (typeof window === "undefined") {
    return null;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

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

  recognition.onresult = (event: any) => {
    const transcript =
      event.results?.[0]?.[0]?.transcript || "";

    if (transcript.trim()) {
      callbacks.onResult?.(
        transcript.trim()
      );
    }
  };

  recognition.onerror = (event: any) => {
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

export function speak(text: string) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = "en-IN";
  utterance.rate = 0.95;
  utterance.pitch = 0.85;
  utterance.volume = 1;

  window.speechSynthesis.speak(
    utterance
  );
}

export function stopSpeaking() {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return;
  }

  window.speechSynthesis.cancel();
}
