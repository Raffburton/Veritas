import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = '@veritas:preferences';

export type UserPreferences = {
  theme: 'light' | 'dark' | 'system';
};

export async function savePreferences(preferences: UserPreferences) {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function loadPreferences(): Promise<UserPreferences | null> {
  const storedPreferences = await AsyncStorage.getItem(PREFERENCES_KEY);

  if (!storedPreferences) {
    return null;
  }

  return JSON.parse(storedPreferences) as UserPreferences;
}

export async function clearPreferences() {
  await AsyncStorage.removeItem(PREFERENCES_KEY);
}
