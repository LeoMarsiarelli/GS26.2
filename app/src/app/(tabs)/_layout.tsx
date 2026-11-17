import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { ActivityIndicator, View } from 'react-native';
import { usePreferencias } from '../../context/PreferenciasContext';
import { useTema } from '../../hooks/useTema';

/** Abas principais. Redireciona ao cadastro de perfil no primeiro acesso. */
export default function TabsLayout() {
  const { carregado, perfil } = usePreferencias();
  const { cores, fs } = useTema();

  if (!carregado) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator size="large" color={cores.primaria} accessibilityLabel="Carregando" />
      </View>
    );
  }
  if (!perfil) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTitleStyle: { color: cores.texto, fontSize: fs(18), fontWeight: '700' },
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarStyle: { backgroundColor: cores.superficie, borderTopColor: cores.borda, height: 64 + (fs(12) - 12) * 2 },
        tabBarLabelStyle: { fontSize: fs(12), fontWeight: '600' },
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="proximas"
        options={{ title: 'Perto de mim', tabBarIcon: ({ color, size }) => <Ionicons name="location" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="indicadores"
        options={{ title: 'Indicadores', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Acessibilidade', tabBarIcon: ({ color, size }) => <Ionicons name="accessibility" color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
