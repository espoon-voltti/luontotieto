#!/bin/sh

# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

url="$1"
code="${2:-200}"
healthcheck() {
	curl -sSw "%{http_code}" --connect-timeout 8 --max-time 10 "$url" -o /dev/null
}

TRIES=60

while [ $TRIES -gt 0 ]; do
	STATUS=$(healthcheck)

	if [ "$STATUS" = "${code}" ]; then
		exit 0
	fi
	echo "Got $STATUS for $url - retrying ..."
	sleep 5s
	TRIES=$((TRIES - 1))
done

echo "Failed to wait for code $code from $url"

exit 1
