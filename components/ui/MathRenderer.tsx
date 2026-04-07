import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TextStyle, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES } from '@/constants/theme';

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
 * Returns true if the content contains any LaTeX math delimiters.
 */
function hasMath(text: string): boolean {
  return /\$\$.+?\$\$|\$(?:[^$\\]|\\.)+\$/s.test(text);
}

/**
 * Builds a minimal HTML page that renders math via KaTeX CDN.
 */
function buildKaTeXHTML(content: string, textColor: string, bgColor: string, fontSize: number): string {
  // Escape content for safe embedding in HTML
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif;
  font-size:${fontSize}px;
  line-height:1.6;
  color:${textColor};
  background:${bgColor};
  padding:4px 0;
  overflow:hidden;
}
.katex{font-size:1.05em!important}
.katex-display{margin:8px 0!important;overflow-x:auto;overflow-y:hidden}
.katex-display>.katex{text-align:left}
</style>
</head>
<body>
<div id="content">${escaped}</div>
<script>
renderMathInElement(document.getElementById('content'),{
  delimiters:[
    {left:'$$',right:'$$',display:true},
    {left:'$',right:'$',display:false}
  ],
  throwOnError:false
});
// Send height to RN after render
setTimeout(function(){
  var h=document.body.scrollHeight;
  window.ReactNativeWebView.postMessage(JSON.stringify({height:h}));
},100);
</script>
</body>
</html>`;
}

/**
 * Renders text with optional LaTeX math notation.
 * - If no math is detected, renders as plain <Text> (zero overhead).
 * - If math delimiters are present, renders via a WebView with KaTeX.
 */
export function MathRenderer({ content, style, fontSize }: MathRendererProps) {
  const { colors } = useTheme();
  const resolvedFontSize = fontSize ?? FONT_SIZES.base;
  const textColor = (style?.color as string) ?? colors.textPrimary;

  const containsMath = useMemo(() => hasMath(content), [content]);

  const [webViewHeight, setWebViewHeight] = useState(resolvedFontSize * 2);

  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.height && data.height > 0) {
        setWebViewHeight(data.height + 4);
      }
    } catch {}
  }, []);

  // Fast path: no math → plain Text
  if (!containsMath) {
    return (
      <Text
        style={[
          { color: textColor, fontFamily: FONTS.sansRegular, fontSize: resolvedFontSize, lineHeight: resolvedFontSize * 1.6 },
          style,
        ]}
      >
        {content}
      </Text>
    );
  }

  // Math path: WebView with KaTeX
  const html = useMemo(
    () => buildKaTeXHTML(content, textColor, 'transparent', resolvedFontSize),
    [content, textColor, resolvedFontSize],
  );

  return (
    <View style={{ minHeight: resolvedFontSize * 1.6 }}>
      <WebView
        source={{ html }}
        style={{ height: webViewHeight, backgroundColor: 'transparent', opacity: 0.99 }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={onMessage}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled={false}
        startInLoadingState={false}
        {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' } : {})}
      />
    </View>
  );
}
