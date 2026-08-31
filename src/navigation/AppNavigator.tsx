import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '../screens/HomeScreen';
import { ReaderScreen } from '../screens/ReaderScreen';

export type RootStackParamList = {
  Home: undefined;
  Reader: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Reader">
      <Stack.Screen
        name="Reader"
        component={ReaderScreen}
        options={{ title: 'Leituras' }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Veritas' }}
      />
    </Stack.Navigator>
  );
}
