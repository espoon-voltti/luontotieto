# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

FROM eclipse-temurin:22-jammy AS base

ARG CACHE_BUST=none

LABEL maintainer="https://github.com/espoon-voltti/luontotieto"

ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
RUN apt-get update \
 && apt-get -y dist-upgrade \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      tzdata \
      ca-certificates \
      curl \
      unzip \
 && ln -fs /usr/share/zoneinfo/Europe/Helsinki /etc/localtime \
 && dpkg-reconfigure --frontend noninteractive tzdata \
 && rm -rf /var/lib/apt/lists/* \
 && curl -sSfL https://github.com/espoon-voltti/s3-downloader/releases/download/v1.4.1/s3downloader-linux-amd64 \
       -o /bin/s3download \
 && chmod +x /bin/s3download

FROM base AS builder

RUN apt-get update\
 && apt-get install -y libglib2.0-0\
    libnss3\
    libnspr4\
    libdbus-1-3\
    libatk1.0-0\
    libatk-bridge2.0-0\
    libcups2\
    libdrm2\
    libxcb1\
    libxkbcommon0\
    libatspi2.0-0\
    libx11-6\
    libxcomposite1\
    libxdamage1\
    libxext6\
    libxfixes3\
    libxrandr2\
    libgbm1\
    libpango-1.0-0\
    libcairo2\
    libasound2

WORKDIR /app

COPY ./gradle/ ./gradle/
COPY ./gradlew ./build.gradle.kts ./gradle.properties ./settings.gradle.kts ./

RUN ./gradlew --no-daemon resolveDependencies

COPY . .


# --offline is used to be sure that all dependencies are installed in previous steps
RUN ./gradlew --offline --no-daemon ktlintCheck
RUN ./gradlew --offline --no-daemon assemble  \
 && unzip -oq build/libs/luontotieto-service-boot.jar -d target


FROM base

WORKDIR /app

COPY ./entrypoint.sh entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]

COPY --from=builder /app/target/ .

ARG build=none
ARG commit=none
ENV APP_BUILD "$build"
ENV APP_COMMIT "$commit"
LABEL fi.espoo.build="$build" \
      fi.espoo.commit="$commit"
