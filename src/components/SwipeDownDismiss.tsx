import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, PanResponder, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
};

const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.8;

export function SwipeDownDismiss({ children, onDismiss, style }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      gesture.dy > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_, gesture) => {
      translateY.setValue(Math.max(0, gesture.dy));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy >= DISMISS_DISTANCE || gesture.vy >= DISMISS_VELOCITY) {
        Animated.timing(translateY, {
          toValue: 800,
          duration: 180,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) onDismissRef.current();
        });
        return;
      }

      Animated.spring(translateY, {
        toValue: 0,
        speed: 22,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(translateY, {
        toValue: 0,
        speed: 22,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    },
  })).current;

  return (
    <Animated.View {...panResponder.panHandlers} style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
