#!/bin/bash

# SPDX-FileCopyrightText: 2017-2026 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

set -euo pipefail

for port in 5432 5433 8000; do
  until nc -z localhost "$port"; do
    echo "Waiting for port $port"
    sleep 1
  done
done

exec "$@"
