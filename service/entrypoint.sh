#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

set -euo pipefail

# For log tagging (with a default value and error logging without crashing)
# shellcheck disable=SC2155
export HOST_IP=$(curl --max-time 10 --silent --fail --show-error http://169.254.169.254/latest/meta-data/local-ipv4 || printf 'UNAVAILABLE')

if [ "${VOLTTI_ENV:-local}" != "local" ]; then
  s3download "$DEPLOYMENT_BUCKET" config /config
fi

# shellcheck disable=SC2086
exec java -cp . -server $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher "$@"
