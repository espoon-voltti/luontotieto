#!/bin/bash

# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE DATABASE paikkatietodb_it;
	GRANT ALL PRIVILEGES ON DATABASE paikkatietodb_it TO paikkatietodb;
EOSQL
