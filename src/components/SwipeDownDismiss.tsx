import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, type StyleProp, View, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  dragArea: ReactNode;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
};

const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.8;

export function SwipeDownDismiss({ children, dragArea, onDismiss, style }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const dragDistance = useRef(0);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  function restorePosition() {
    Animated.spring(translateY, {
      toValue: 0,
      speed: 22,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }

  function finishGesture() {
    const elapsed = Math.max(Date.now() - touchStartTime.current, 1);
    const velocity = dragDistance.current / elapsed;
    if (dragDistance.current >= DISMISS_DISTANCE || velocity >= DISMISS_VELOCITY) {
      Animated.timing(translateY, {
        toValue: 800,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDismissRef.current();
      });
      return;
    }

    restorePosition();
  }

  return (
    <Animated.View
      style={[style, { transform: [{ translateY }] }]}
    >
      <View
        onTouchStart={(event) => {
          touchStartY.current = event.nativeEvent.pageY;
          touchStartTime.current = Date.now();
          dragDistance.current = 0;
        }}
        onTouchMove={(event) => {
          const distance = Math.max(0, event.nativeEvent.pageY - touchStartY.current);
          dragDistance.current = distance;
          translateY.setValue(distance);
        }}
        onTouchEnd={finishGesture}
        onTouchCancel={restorePosition}
      >
        {dragArea}
      </View>
      {children}
    </Animated.View>
  );
}
