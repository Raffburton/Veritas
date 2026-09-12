import { Text as NativeText, TextInput as NativeTextInput, StyleSheet, type TextInputProps, type TextProps } from 'react-native';

import { useTheme } from '../context/ThemeContext';

export function AccessibleText({ style, ...props }: TextProps) {
  const { boldText } = useTheme();

  return <NativeText {...props} style={[style, boldText && styles.bold]} />;
}

export function AccessibleTextInput({ style, ...props }: TextInputProps) {
  const { boldText } = useTheme();

  return <NativeTextInput {...props} style={[style, boldText && styles.bold]} />;
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
});
