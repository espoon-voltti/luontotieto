# syntax=docker/dockerfile:1.20.0
# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

FROM docker.osgeo.org/geoserver:2.28.0

ARG CACHE_BUST=none

COPY ./data_dir /opt/geoserver_data/

EXPOSE 8080