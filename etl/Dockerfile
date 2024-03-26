# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

FROM eclipse-temurin:21-jammy

COPY ./gradle/ ./gradle/
COPY ./gradlew ./build.gradle.kts
COPY . .
RUN ./gradlew build

ENTRYPOINT ["./migrate.sh"]
