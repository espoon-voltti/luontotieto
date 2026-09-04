# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

FROM node:24.20.0-bookworm-slim AS base

ARG CACHE_BUST=none

WORKDIR /app

FROM base AS builder

COPY ./.yarn ./.yarn
COPY ./package.json ./yarn.lock ./.yarnrc.yml ./

RUN yarn install --immutable

COPY . .

RUN yarn build

FROM builder AS test

RUN yarn lint
#RUN yarn test

FROM builder

ENV NODE_ENV production

ARG S3_DOWNLOADER_VERSION=v1.5.2
ARG S3_DOWNLOADER_SHA256="70a40524bf901d999eb7f85aaebfed25132767a1475cb76147f5c7f01ef5c66d"

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
