#!/bin/bash
set -euo pipefail

cp environment.ts frontend/src/environment.ts 

# HTTP_SCHEME=${HTTP_SCHEME:-"https"}
# HOST_DOMAIN=${HOST_DOMAIN:-"little-world.com"}
# FULL_HOST_DOMAIN="$HTTP_SCHEME://$HOST_DOMAIN"

# cd frontend

# sed -i.bak "s|isNative: .*,|isNative: true,|" src/environment.ts

# if [[ -n "$HOST_DOMAIN" && "$HOST_DOMAIN" == *ngrok* ]]; then
#   sed -i.bak "s|allowNgrokRequests: .*,|allowNgrokRequests: true,|" src/environment.ts
# else
#   sed -i.bak "s|allowNgrokRequests: .*,|allowNgrokRequests: false,|" src/environment.ts
# fi

# sed -i.bak "s|backendUrl: '.*'|backendUrl: '$FULL_HOST_DOMAIN'|" src/environment.ts
# rm -f src/environment.ts.bak

# cp src/environment.ts ../environment.ts

# echo "frontend/src/environment.ts patched for native development (backend: $FULL_HOST_DOMAIN)"
