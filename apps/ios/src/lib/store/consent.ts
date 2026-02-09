import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = 'ses-cookie-consent';

export type ConsentPreferences = {
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
};

export async function getConsent(): Promise<ConsentPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setConsent(prefs: ConsentPreferences): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
}

export async function hasDecided(): Promise<boolean> {
  const prefs = await getConsent();
  return prefs?.decided === true;
}
