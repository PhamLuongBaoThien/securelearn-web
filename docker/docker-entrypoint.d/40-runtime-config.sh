#!/bin/sh
set -eu
escaped_api_url=$(printf '%s' "${API_BASE_URL:-}" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf 'window.__SECURELEARN_CONFIG__ = { apiBaseUrl: "%s" };\n' "$escaped_api_url" > /usr/share/nginx/html/runtime-config.js
