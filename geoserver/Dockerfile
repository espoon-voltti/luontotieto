# syntax=docker/dockerfile:1.22.0
# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

FROM docker.osgeo.org/geoserver:2.27.5

ARG CACHE_BUST=none

COPY ./data_dir /opt/geoserver_data/
COPY ./update_credentials.sh /opt/update_credentials.sh
RUN chmod +x /opt/update_credentials.sh

EXPOSE 8080
