#!/bin/sh -eu

# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

# shellcheck disable=SC2155

set -eu

if [ "${DEBUG:-false}" = "true" ]; then
  set -x
fi

export HOST_IP="UNAVAILABLE"

if [ "${API_GATEWAY_URL:-X}" = 'X' ]; then
  echo 'ERROR: API_GATEWAY_URL must be a non-empty string!'
  exit 1
fi

mkdir -p /nginx/config
cp -r /etc/nginx/* /nginx/config/

for directory in /nginx/config/conf.d/ /nginx/config/; do
  gomplate --input-dir="$directory" --output-map="$directory"'{{ .in | strings.ReplaceAll ".template" "" }}'
done

if [ "${DEBUG:-false}" = "true" ]; then
  cat /nginx/config/nginx.conf
  cat /nginx/config/conf.d/default.conf
fi

if [ "${BASIC_AUTH_ENABLED:-false}" = 'true' ]; then
  echo "$BASIC_AUTH_CREDENTIALS" > /nginx/config/.htpasswd
fi


exec "$@"
