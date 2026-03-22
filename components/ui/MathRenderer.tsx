import React, { useMemo } from 'react';
import { View, Text, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';

interface MathSegment {
  type: 'text' | 'inline-math' | 'block-math';
  content: string;
}

interface MathRendererProps {
  content: string;
  style?: TextStyle;
  fontSize?: number;
}

/**
 * Parses text containing LaTeX math notation.
 * - $$...$$ for block/display math
 * - $...$ for inline math
 * - Everything else as plain text
 */
export function parseMathContent(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let remaining = text;

  const blockMaths: string[] = [];
  remaining = remaining.replace(/\$\$([\s\S]+?)\$\$/g, (_match, inner) => {
    const index = blockMaths.length;
    blockMaths.push(inner);
    return `\0BLOCK_MATH_${index}\0`;
  });

  const blockParts = remaining.split(/\0BLOCK_MATH_(\d+)\0/);

  for (let i = 0; i < blockParts.length; i++) {
    if (i % 2 === 1) {
      const mathContent = blockMaths[parseInt(blockParts[i], 10)];
      if (mathContent) {
        segments.push({ type: 'block-math', content: mathContent.trim() });
      }
    } else {
      const part = blockParts[i];
      if (!part) continue;

      const inlineParts = part.split(/\$((?:[^$\\]|\\.)+)\$/);

      for (let j = 0; j < inlineParts.length; j++) {
        if (j % 2 === 1) {
          segments.push({ type: 'inline-math', content: inlineParts[j] });
        } else {
          const textContent = inlineParts[j];
          if (textContent) {
            segments.push({ type: 'text', content: textContent });
          }
        }
      }
    }
  }

  return segments;
}

/**
 * Renders text with math notation.
 * Math segments are displayed in italic with a monospace feel.
 * To enable full LaTeX rendering, install react-native-mathjax-html-to-svg
 * and replace the fallback rendering below.
 */
export function MathRenderer({ content, style, fontSize }: MathRendererProps) {
  const { colors } = useTheme();
  const resolvedFontSize = fontSize ?? FONT_SIZES.base;

  const segments = useMemo(() => parseMathContent(content), [content]);

  const textColor = (style?.color as string) ?? colors.textPrimary;

  return (
    <Text
      style={[
        styles.wrapper,
        { color: textColor, fontFamily: FONTS.sansRegular, fontSize: resolvedFontSize },
        style,
      ]}
    >
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Text key={index}>{segment.content}</Text>;
        }

        if (segment.type === 'block-math') {
          return (
            <Text key={index} style={styles.mathText}>
              {'\n'}{segment.content}{'\n'}
            </Text>
          );
        }

        // inline-math — render in italic to distinguish from body text
        return (
          <Text key={index} style={styles.mathText}>
            {segment.content}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    includeFontPadding: false,
  },
  mathText: {
    fontStyle: 'italic',
    includeFontPadding: false,
  },
});
