import React, { useMemo, useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_SIZES } from '@/constants/theme';

interface StudyGuideRendererProps {
  content: string;
  fontSize?: number;
}

/**
 * Renders rich study guide content with:
 * - KaTeX for LaTeX math ($...$ and $$...$$)
 * - Markdown (bold, tables, lists, headers)
 * - Highlighted text (==text==)
 * - Proper theming matching the app
 */
function buildHTML(content: string, textColor: string, bgColor: string, primaryColor: string, surfaceColor: string, borderColor: string, fontSize: number): string {
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
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:-apple-system,BlinkMacSystemFont,'DM Sans',sans-serif;
  font-size:${fontSize}px;
  line-height:1.7;
  color:${textColor};
  background:${bgColor};
  padding:2px 0;
  overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,h4{
  font-weight:700;
  margin:20px 0 8px 0;
  line-height:1.3;
}
h2{font-size:1.15em;border-bottom:1px solid ${borderColor};padding-bottom:6px}
h3{font-size:1.05em}
p{margin:8px 0}
strong{font-weight:700;color:${textColor}}
ul,ol{padding-left:20px;margin:8px 0}
li{margin:4px 0;line-height:1.6}
table{
  width:100%;
  border-collapse:collapse;
  margin:12px 0;
  font-size:0.92em;
}
th{
  background:${surfaceColor};
  font-weight:700;
  text-align:left;
  padding:8px 10px;
  border:1px solid ${borderColor};
}
td{
  padding:8px 10px;
  border:1px solid ${borderColor};
}
tr:nth-child(even){background:${surfaceColor}}
mark,.highlight{
  background:rgba(255,220,0,0.25);
  padding:1px 4px;
  border-radius:3px;
}
blockquote{
  border-left:3px solid ${primaryColor};
  padding:8px 12px;
  margin:12px 0;
  background:${surfaceColor};
  border-radius:0 8px 8px 0;
  font-style:normal;
}
code{
  background:${surfaceColor};
  padding:2px 6px;
  border-radius:4px;
  font-size:0.9em;
}
hr{border:none;border-top:1px solid ${borderColor};margin:16px 0}
.katex{font-size:1.05em!important}
.katex-display{margin:10px 0!important;overflow-x:auto;overflow-y:hidden}
.katex-display>.katex{text-align:left}
a{color:${primaryColor};text-decoration:none}
</style>
</head>
<body>
<div id="content">${escaped}</div>
<script>
// Convert ==text== to <mark>text</mark> before markdown processing
var el=document.getElementById('content');
el.innerHTML=el.innerHTML.replace(/==(.*?)==/g,'<mark>$1</mark>');

// Parse markdown
if(typeof marked!=='undefined'){
  // Preserve math delimiters by temporarily replacing them
  var mathBlocks=[];
  var html=el.innerHTML;
  html=html.replace(/\\$\\$([\\s\\S]+?)\\$\\$/g,function(m,inner){
    mathBlocks.push(m);
    return '%%MATHBLOCK'+(mathBlocks.length-1)+'%%';
  });
  html=html.replace(/\\$([^$]+?)\\$/g,function(m,inner){
    mathBlocks.push(m);
    return '%%MATHBLOCK'+(mathBlocks.length-1)+'%%';
  });

  // Parse markdown
  html=marked.parse(html);

  // Restore math
  html=html.replace(/%%MATHBLOCK(\\d+)%%/g,function(m,i){
    return mathBlocks[parseInt(i)];
  });

  el.innerHTML=html;
}

// Render KaTeX
renderMathInElement(el,{
  delimiters:[
    {left:'$$',right:'$$',display:true},
    {left:'$',right:'$',display:false}
  ],
  throwOnError:false
});

// Send height
setTimeout(function(){
  window.ReactNativeWebView.postMessage(JSON.stringify({height:document.body.scrollHeight}));
},200);
// Re-measure after images/fonts load
setTimeout(function(){
  window.ReactNativeWebView.postMessage(JSON.stringify({height:document.body.scrollHeight}));
},800);
</script>
</body>
</html>`;
}

export function StudyGuideRenderer({ content, fontSize }: StudyGuideRendererProps) {
  const { colors } = useTheme();
  const resolvedFontSize = fontSize ?? FONT_SIZES.base;

  const [webViewHeight, setWebViewHeight] = useState(200);

  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.height && data.height > 0) {
        setWebViewHeight(data.height + 8);
      }
    } catch {}
  }, []);

  const html = useMemo(
    () => buildHTML(
      content,
      colors.textPrimary,
      'transparent',
      colors.primary,
      colors.surface,
      colors.border,
      resolvedFontSize,
    ),
    [content, colors.textPrimary, colors.primary, colors.surface, colors.border, resolvedFontSize],
  );

  return (
    <View style={{ minHeight: 40 }}>
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
