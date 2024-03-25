#!/bin/bash

# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

set -euo pipefail

./gradlew --offline --no-daemon flywayMigrate

if [ "${1:-}" = "--wait" ]; then
    echo "Waiting"
    while true; do
        sleep 30
    done
fi
