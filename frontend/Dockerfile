# syntax=docker/dockerfile:1.23.0
# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

ARG NGINX_VERSION=1.30.0

FROM node:24.14.1-bookworm-slim AS builder

ARG CACHE_BUST=none

WORKDIR /project

COPY ./.yarn ./.yarn
COPY ./package.json ./yarn.lock ./.yarnrc.yml ./

RUN yarn install --immutable

COPY . .

RUN yarn build

FROM builder AS test

RUN yarn lint

FROM nginx:${NGINX_VERSION}

ARG CACHE_BUST=none

ENV NGINX_ENV=local \
    TZ=UTC

# https://github.com/hairyhenderson/gomplate
ARG GOMPLATE_VERSION=v4.3.3
ARG GOMPLATE_SHA256="ca281666e86f2f09218c1653e1908f572c0e349e9de64cb4ea93ade9333f0596"
# https://github.com/espoon-voltti/s3-downloader/
ARG S3_DOWNLOADER_VERSION=v1.5.1
ARG S3_DOWNLOADER_SHA256="cb751589ca60749c42b65009671d6076435e7454b8980ee98884e296a1ec6cb8"

RUN apt-get update \
 && apt-get -y dist-upgrade \
 && apt-get remove --auto-remove -y nginx-module-image-filter \
 && curl -sSfL "https://github.com/hairyhenderson/gomplate/releases/download/${GOMPLATE_VERSION}/gomplate_linux-amd64" \
      -o /bin/gomplate \
 && chmod +x /bin/gomplate \
 && echo "${GOMPLATE_SHA256}  /bin/gomplate" | sha256sum -c - \
 && curl -sSfL "https://github.com/espoon-voltti/s3-downloader/releases/download/${S3_DOWNLOADER_VERSION}/s3downloader-linux-amd64" \
      -o /bin/s3download \
 && chmod +x /bin/s3download \
 && echo "${S3_DOWNLOADER_SHA256}  /bin/s3download" | sha256sum -c - \
 && rm -rf /var/lib/apt/lists/*

COPY ./nginx/bin/ /bin/
COPY ./nginx/etc/ /etc/

ENTRYPOINT ["/bin/proxy-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

COPY --from=builder /project/dist/esbuild/luontotieto/ /static/

ARG build=none
ARG commit=none

ENV APP_BUILD="$build" \
    APP_COMMIT="$commit"
LABEL fi.espoo.build="$build" \
    fi.espoo.commit="$commit"
