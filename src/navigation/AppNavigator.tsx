import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUpdates } from '../context/UpdateContext';
import { useTheme } from '../context/ThemeContext';
import { ReaderScreen } from '../screens/ReaderScreen';

// Adia a avaliação das telas e dos dados da Bíblia até a primeira visita à aba.
const getBibleScreen = () => require('../screens/BibleScreen').BibleScreen;
const getNotesScreen = () => require('../screens/NotesScreen').NotesScreen;
const getPrayersScreen = () => require('../screens/PrayersScreen').PrayersScreen;
const getSettingsScreen = () => require('../screens/SettingsScreen').SettingsScreen;

export type RootTabParamList = {
  Liturgy: { date?: string } | undefined;
  Bible: { bookIndex?: number; chapter?: number; verses?: number[] } | undefined;
  Notes: undefined;
  Prayers: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const icons: Record<
  keyof RootTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Liturgy: { active: 'book', inactive: 'book-outline' },
  Bible: { active: 'library', inactive: 'library-outline' },
  Notes: { active: 'document-text', inactive: 'document-text-outline' },
  Prayers: { active: 'sparkles', inactive: 'sparkles-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

export function AppNavigator() {
  const { colors } = useTheme();
  const { latestVersion } = useUpdates();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Liturgy"
      screenOptions={({ route }) => ({
        lazy: true,
        headerTitle: 'veritas',
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.primary,
          fontFamily: 'serif',
          fontSize: 27,
          fontWeight: '700',
        },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          height: 66 + insets.bottom,
          paddingTop: 7,
          paddingBottom: 8 + insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, focused, size }) =>
          route.name === 'Prayers' ? (
            <MaterialCommunityIcons name="hands-pray" color={color} size={size} />
          ) : (
            <Ionicons
              name={focused ? icons[route.name].active : icons[route.name].inactive}
              color={color}
              size={size}
            />
          ),
      })}
    >
      <Tab.Screen name="Liturgy" component={ReaderScreen} options={{ title: 'Liturgia' }} />
      <Tab.Screen name="Bible" getComponent={getBibleScreen} options={{ title: 'Bíblia' }} />
      <Tab.Screen name="Notes" getComponent={getNotesScreen} options={{ title: 'Coleções' }} />
      <Tab.Screen name="Prayers" getComponent={getPrayersScreen} options={{ title: 'Orações' }} />
      <Tab.Screen
        name="Settings"
        getComponent={getSettingsScreen}
        options={{ title: 'Configurações', tabBarBadge: latestVersion ? '!' : undefined }}
      />
    </Tab.Navigator>
  );
}
