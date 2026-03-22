import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface TypingTextProps {
  text: string;
  style?: object;
  cursorColor?: string;
  charInterval?: number;
  onComplete?: () => void;
}

export function TypingText({
  text,
  style,
  cursorColor = '#2360E8',
  charInterval = 18,
  onComplete,
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cursorOpacity = useSharedValue(1);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  useEffect(() => {
    // Reset on text change
    indexRef.current = 0;
    setDisplayedText('');
    setDone(false);

    if (!text) return;

    intervalRef.current = setInterval(() => {
      const i = indexRef.current;
      if (i >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDone(true);
        onComplete?.();
        return;
      }
      setDisplayedText(text.slice(0, i + 1));
      indexRef.current = i + 1;
    }, charInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, charInterval]);

  // Cursor blink
  useEffect(() => {
    if (done) {
      cursorOpacity.value = 0;
      return;
    }
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      false,
    );
  }, [done]);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <Text style={style}>{displayedText}</Text>
      {!done && (
        <Animated.Text style={[{ color: cursorColor, fontWeight: 'bold' }, cursorStyle]}>
          |
        </Animated.Text>
      )}
    </View>
  );
}
