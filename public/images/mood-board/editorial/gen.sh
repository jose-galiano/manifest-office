#!/usr/bin/env bash
# Usage: ./gen.sh <filename-without-ext> "<prompt>"
set -euo pipefail
NAME="$1"
PROMPT="$2"
OUT="/Users/jose/gemini/antigravity/scratch/manifest-office/public/images/mood-board/editorial/${NAME}.png"

if [ -f "$OUT" ]; then
  echo "SKIP $NAME (exists)"
  exit 0
fi

RESP=$(curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict" \
  -H "x-goog-api-key: ${GOOGLE_AI_API_KEY}" \
  -H "Content-Type: application/json" \
  --data @<(python3 -c "import json,sys,os; print(json.dumps({'instances':[{'prompt': sys.argv[1]}],'parameters':{'sampleCount':1,'aspectRatio': os.environ.get('AR','1:1')}}))" "$PROMPT"))

export OUT
echo "$RESP" | python3 -c "
import sys, json, base64, os
data = json.loads(sys.stdin.read())
out = os.environ['OUT']
if 'predictions' in data and data['predictions']:
    img = data['predictions'][0].get('bytesBase64Encoded')
    if img:
        with open(out, 'wb') as f:
            f.write(base64.b64decode(img))
        print('OK ' + os.path.basename(out))
    else:
        print('NO_IMG ' + os.path.basename(out) + ' :: ' + json.dumps(data)[:200])
        sys.exit(2)
else:
    print('ERR ' + os.path.basename(out) + ' :: ' + json.dumps(data)[:300])
    sys.exit(2)
" OUT="$OUT"
