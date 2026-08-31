import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider } from './src/context/ThemeContext';
import { LibraryProvider } from './src/context/LibraryContext';
import { DailyLiturgyProvider } from './src/context/DailyLiturgyContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <NotificationProvider>
          <DailyLiturgyProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigator />
            </NavigationContainer>
          </DailyLiturgyProvider>
        </NotificationProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
}
