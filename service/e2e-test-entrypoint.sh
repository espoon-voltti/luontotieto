#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

set -euo pipefail

echo 'INFO: Waiting for compose stack to be up ...'
./wait-for-url.sh "http://frontend/health"
./wait-for-url.sh "http://api-gateway:3000/health"

echo "Running tests ..."

./gradlew e2eTest
