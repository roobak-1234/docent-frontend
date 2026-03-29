type RuntimeMapConfig = {
  REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY?: string;
  REACT_APP_AZURE_MAPS_KEY?: string;
  AZURE_MAPS_SUBSCRIPTION_KEY?: string;
  AZURE_MAPS_KEY?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeMapConfig;
  }
}

const normalizeValue = (value: string | null | undefined): string => (value || '').trim();

const readLocalStorageKey = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return normalizeValue(window.localStorage.getItem('AZURE_MAPS_SUBSCRIPTION_KEY'));
  } catch {
    return '';
  }
};

export const getAzureMapsSubscriptionKey = (): string => {
  const env = process.env as Record<string, string | undefined>;
  const runtimeConfig = typeof window !== 'undefined' ? window.__APP_CONFIG__ : undefined;

  return (
    normalizeValue(env.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY) ||
    normalizeValue(env.REACT_APP_AZURE_MAPS_KEY) ||
    normalizeValue(runtimeConfig?.REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY) ||
    normalizeValue(runtimeConfig?.REACT_APP_AZURE_MAPS_KEY) ||
    normalizeValue(runtimeConfig?.AZURE_MAPS_SUBSCRIPTION_KEY) ||
    normalizeValue(runtimeConfig?.AZURE_MAPS_KEY) ||
    readLocalStorageKey()
  );
};

export const azureMapsKeyHelpText =
  'Map unavailable - configure REACT_APP_AZURE_MAPS_SUBSCRIPTION_KEY or provide window.__APP_CONFIG__.AZURE_MAPS_SUBSCRIPTION_KEY';
