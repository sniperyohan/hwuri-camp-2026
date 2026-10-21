#!/bin/bash
# 사용법: bash make-share.sh 슬러그 "카톡 제목" "카톡 설명"
SLUG="$1"; TITLE="$2"; DESC="$3"
[ -z "$SLUG" ] && { echo "슬러그를 입력하세요"; exit 1; }
SB=$(grep -o 'https://[a-z0-9]*\.supabase\.co' config.js | head -1)
SITE="https://covenant.chatbotai.co.kr"
mkdir -p s
cat > "s/$SLUG.html" <<HTML
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>$TITLE</title>
<meta property="og:title" content="$TITLE">
<meta property="og:description" content="$DESC">
<meta property="og:type" content="website">
<meta property="og:url" content="$SITE/s/$SLUG.html">
<meta property="og:image" content="$SB/storage/v1/object/public/uploads/og/$SLUG.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=$SITE/camp.html?c=$SLUG">
</head>
<body><p style="font-family:sans-serif;padding:40px;text-align:center">일정표로 이동 중입니다... <a href="$SITE/camp.html?c=$SLUG">바로가기</a></p></body>
</html>
HTML
echo "생성됨: s/$SLUG.html"
