import React, { useMemo } from 'react';
import { View, Text, TextStyle, StyleSheet } from 'react-native';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';
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

export function parseMathContent(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let remaining = text;

  // Temporary placeholders for block math so they aren't consumed by inline regex
  const blockMaths: string[] = [];
  remaining = remaining.replace(/\$\$([\s\S]+?)\$\$/g, (_match, inner) => {
    const index = blockMaths.length;
    blockMaths.push(inner);
    return `\0BLOCK_MATH_${index}\0`;
  });

  // Split on block math placeholders
  const blockParts = remaining.split(/\0BLOCK_MATH_(\d+)\0/);

  for (let i = 0; i < blockParts.length; i++) {
    if (i % 2 === 1) {
      // This is a block math index
      const mathContent = blockMaths[parseInt(blockParts[i], 10)];
      if (mathContent) {
        segments.push({ type: 'block-math', content: mathContent.trim() });
      }
    } else {
      // This part may contain inline math
      const part = blockParts[i];
      if (!part) continue;

      const inlineParts = part.split(/\$((?:[^$\\]|\\.)+)\$/);

      for (let j = 0; j < inlineParts.length; j++) {
        if (j % 2 === 1) {
          // Inline math capture group
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

export function MathRenderer({ content, style, fontSize }: MathRendererProps) {
  const { colors } = useTheme();
  const resolvedFontSize = fontSize ?? FONT_SIZES.base;

  const segments = useMemo(() => parseMathContent(content), [content]);

  const textColor = (style?.color as string) ?? colors.textPrimary;

  return (
    <Text style={[styles.wrapper, { color: textColor, fontFamily: FONTS.sansRegular, fontSize: resolvedFontSize }, style]}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
            <Text
              key={index}
              style={[
                styles.text,
                {
                  color: textColor,
                  fontFamily: FONTS.sansRegular,
                  fontSize: resolvedFontSize,
                },
              ]}
            >
              {segment.content}
            </Text>
          );
        }

        if (segment.type === 'block-math') {
          return (
            <View key={index} style={styles.blockMathWrapper}>
              <MathJaxSvg
                color={colors.textPrimary}
                fontSize={resolvedFontSize}
              >
                {`$$${segment.content}$$`}
              </MathJaxSvg>
            </View>
          );
        }

        // inline-math
        return (
          <MathJaxSvg
            key={index}
            color={colors.textPrimary}
            fontSize={resolvedFontSize}
          >
            {`$${segment.content}$`}
          </MathJaxSvg>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    includeFontPadding: false,
  },
  text: {
    includeFontPadding: false,
  },
  blockMathWrapper: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
});
