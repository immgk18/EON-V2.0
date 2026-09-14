"use client";

export type EONProvider =
  | "GEMINI"
  | "LOCAL"
  | "EON";

export type ProviderStatus =
  | "ACTIVE"
  | "READY"
  | "PLANNED"
  | "OFFLINE";

export type ProviderInfo = {
  id: EONProvider;
  name: string;
  status: ProviderStatus;
  role: string;
  description: string;
};

const PROVIDERS: Record<
  EONProvider,
  ProviderInfo
> = {
  GEMINI: {
    id: "GEMINI",
    name: "Google Gemini",
    status: "ACTIVE",
    role: "Primary Intelligence Provider",
    description:
      "Current cloud intelligence provider used by EON.",
  },

  LOCAL: {
    id: "LOCAL",
    name: "EON Local Brain",
    status: "READY",
    role: "Local Intelligence Provider",
    description:
      "Reserved for an open-weight model running on local hardware.",
  },

  EON: {
    id: "EON",
    name: "EON Intelligence",
    status: "PLANNED",
    role: "Future EON-Owned Model",
    description:
      "Reserved for a future EON-customized or EON-trained intelligence model.",
  },
};

let activeProvider: EONProvider = "GEMINI";

export function getActiveProvider(): EONProvider {
  return activeProvider;
}

export function setActiveProvider(
  provider: EONProvider
): boolean {
  const selectedProvider =
    PROVIDERS[provider];

  if (!selectedProvider) {
    return false;
  }

  if (
    selectedProvider.status ===
    "OFFLINE"
  ) {
    return false;
  }

  activeProvider = provider;

  return true;
}

export function getProvider(
  provider: EONProvider
): ProviderInfo {
  return PROVIDERS[provider];
}

export function getAllProviders(): ProviderInfo[] {
  return Object.values(PROVIDERS);
}

export function isProviderAvailable(
  provider: EONProvider
): boolean {
  const status =
    PROVIDERS[provider].status;

  return (
    status === "ACTIVE" ||
    status === "READY"
  );
}

export function selectBestProvider(): EONProvider {
  if (
    isProviderAvailable(activeProvider)
  ) {
    return activeProvider;
  }

  if (
    isProviderAvailable("LOCAL")
  ) {
    return "LOCAL";
  }

  return "GEMINI";
}

export function getProviderManagerStatus() {
  return {
    engine: "EON Provider Manager",
    version: "1.0",
    status: "online",

    activeProvider,

    providers: PROVIDERS,

    fallbackOrder: [
      "LOCAL",
      "GEMINI",
      "EON",
    ],

    capabilities: {
      providerSelection: true,
      providerStatus: true,
      localProviderReady: true,
      geminiProviderActive: true,
      eonOwnedProviderPlanned: true,
    },

    note:
      "Provider Manager controls intelligence-provider selection. Actual local and EON-owned model execution will be connected in later phases.",
  };
}

export default {
  getActiveProvider,
  setActiveProvider,
  getProvider,
  getAllProviders,
  isProviderAvailable,
  selectBestProvider,
  getProviderManagerStatus,
};
