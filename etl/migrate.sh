#!/bin/bash

# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

./gradlew --offline --no-daemon flywayMigrate
