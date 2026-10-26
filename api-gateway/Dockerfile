# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

FROM node:24.22.1-bookworm-slim AS base

ARG CACHE_BUST=none

WORKDIR /app

FROM base AS builder

COPY ./.yarn ./.yarn
COPY ./package.json ./yarn.lock ./.yarnrc.yml ./

RUN yarn install --immutable

COPY . .

RUN yarn build

FROM builder AS test

RUN yarn type-check
#RUN yarn test

FROM builder

ENV NODE_ENV production

ARG S3_DOWNLOADER_VERSION=v1.6.0
ARG S3_DOWNLOADER_SHA256="f69116f2e2eeb78fa6297e053ed7f311a1bf120c0ff0ea3c966335223f94a5e9"

RUN apt-get update \
      && apt-get -y dist-upgrade \
      && apt-get -y install curl \
      && curl -sSfL https://github.com/espoon-voltti/s3-downloader/releases/download/${S3_DOWNLOADER_VERSION}/s3downloader-linux-amd64 \
      -o /bin/s3download \
      && echo "${S3_DOWNLOADER_SHA256}  /bin/s3download" | sha256sum -c - \
      && chmod +x /bin/s3download

RUN userdel -r node \
 && addgroup --gid 1000 luontotieto \
 && adduser --uid 1000 --gid 1000 --gecos "" -q --home /home/luontotieto --disabled-password luontotieto \
 && mkdir -p /config \
 && chown luontotieto:luontotieto /config

VOLUME /config

ARG build=none
ARG commit=none

ENV APP_BUILD "$build"
ENV APP_COMMIT "$commit"

LABEL fi.espoo.build="$build" \
      fi.espoo.commit="$commit"

USER luontotieto

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "dist/index.js"]
