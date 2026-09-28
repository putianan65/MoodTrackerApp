// Per-weight imports so only the weights we use end up in the bundle.
import { BagelFatOne_400Regular } from '@expo-google-fonts/bagel-fat-one/400Regular';
import { IBMPlexSansThaiLooped_400Regular } from '@expo-google-fonts/ibm-plex-sans-thai-looped/400Regular';
import { IBMPlexSansThaiLooped_500Medium } from '@expo-google-fonts/ibm-plex-sans-thai-looped/500Medium';
import { IBMPlexSansThaiLooped_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-thai-looped/600SemiBold';
import { Mali_600SemiBold } from '@expo-google-fonts/mali/600SemiBold';
import { Mali_700Bold } from '@expo-google-fonts/mali/700Bold';
import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [loaded, error] = useFonts({
    BagelFatOne_400Regular,
    Mali_600SemiBold,
    Mali_700Bold,
    IBMPlexSansThaiLooped_400Regular,
    IBMPlexSansThaiLooped_500Medium,
    IBMPlexSansThaiLooped_600SemiBold,
  });
  // Fall back to system fonts rather than blocking the app if a font fails.
  return loaded || !!error;
}
