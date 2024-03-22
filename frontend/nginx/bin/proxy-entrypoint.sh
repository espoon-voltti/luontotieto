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

for template in /etc/nginx/conf.d/*.template /etc/nginx/*.template; do
    if ! test -f "$template"; then
      continue
    fi
    target=$(echo "$template" | sed -e "s/.template$//")

    erb "$template" > "$target"
done

if [ "${DEBUG:-false}" = "true" ]; then
  cat /etc/nginx/nginx.conf
  cat /etc/nginx/conf.d/default.conf
fi

if [ "${BASIC_AUTH_ENABLED:-false}" = 'true' ]; then
  echo "$BASIC_AUTH_CREDENTIALS" > /etc/nginx/.htpasswd
fi


exec "$@"
