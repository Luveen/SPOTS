// useFonts.js
import * as Font from 'expo-font';

export async function loadFonts() {
  await Font.loadAsync({
    'Macondo-Swash-Caps': require('./assets/fonts/MacondoSwashCaps-Regular.ttf'),
  });
}