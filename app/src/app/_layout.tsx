import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OcorrenciasProvider } from '../context/OcorrenciasContext';
import { PreferenciasProvider } from '../context/PreferenciasContext';
import { useTema } from '../hooks/useTema';

/** Navegação raiz: abas principais + telas empilhadas (registro e detalhe). */
function Navegacao() {
  const { cores, fs, altoContraste } = useTema();
  return (
    <>
      <StatusBar style={altoContraste ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.superficie },
          headerTintColor: cores.primaria,
          headerTitleStyle: { color: cores.texto, fontSize: fs(18), fontWeight: '700' },
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="nova" options={{ title: 'Registrar problema', presentation: 'modal' }} />
        <Stack.Screen name="ocorrencia/[id]" options={{ title: 'Acompanhamento' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PreferenciasProvider>
        <OcorrenciasProvider>
          <Navegacao />
        </OcorrenciasProvider>
      </PreferenciasProvider>
    </SafeAreaProvider>
  );
}
