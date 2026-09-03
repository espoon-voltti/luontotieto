# syntax=docker/dockerfile:1.26.0
# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

FROM docker.osgeo.org/geoserver:2.28.3

ARG CACHE_BUST=none

# The upstream image is not rebuilt on Ubuntu security updates, so pick them up
# ourselves - as the service, frontend and api-gateway images already do. The
# weekly CACHE_BUST above forces this layer to be rebuilt.
RUN apt-get update \
 && apt-get -y dist-upgrade \
 && rm -rf /var/lib/apt/lists/*

COPY ./data_dir /opt/geoserver_data/
COPY ./update_credentials.sh /opt/update_credentials.sh
RUN chmod +x /opt/update_credentials.sh

EXPOSE 8080
