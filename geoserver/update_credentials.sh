#!/bin/bash

# Credits to https://github.com/meggsimum/geoserver-docker/ and https://github.com/kartoza/docker-geoserver

echo "Updating GeoServer Credentials ..."

if [ -n "${DEBUG}" ]; then
  set -e
  set -x
fi;

# copy over default security folder to data dir (if not existing)
if [ ! -d "${GEOSERVER_DATA_DIR}/security" ]; then
  cp -r "${CATALINA_HOME}/webapps/geoserver/data/security" "${GEOSERVER_DATA_DIR}/"
fi

# Accept credentials as arguments or fallback to environment variables
if [ $# -eq 2 ]; then
  GEOSERVER_ADMIN_USER="$1"
  GEOSERVER_ADMIN_PASSWORD="$2"
  echo "Using credentials provided as script arguments"
else
  GEOSERVER_ADMIN_USER=${GEOSERVER_ADMIN_USER:-admin}
  GEOSERVER_ADMIN_PASSWORD=${GEOSERVER_ADMIN_PASSWORD:-geoserver}
  echo "Using credentials from environment variables (or defaults)"
fi

# templates to use as base for replacement
USERS_XML_ORIG="${CATALINA_HOME}/webapps/geoserver/data/security/usergroup/default/users.xml"
echo "USING USERS XML ORIGINAL:" "$USERS_XML_ORIG"
ROLES_XML_ORIG="${CATALINA_HOME}/webapps/geoserver/data/security/role/default/roles.xml"
echo "USING ROLES XML ORIGINAL:" "$ROLES_XML_ORIG"

# final users.xml file GeoServer data dir
USERS_XML=${USERS_XML:-"${GEOSERVER_DATA_DIR}/security/usergroup/default/users.xml"}
echo "SETTING USERS XML:" "$USERS_XML"
# final roles.xml file GeoServer data dir
ROLES_XML=${ROLES_XML:-"${GEOSERVER_DATA_DIR}/security/role/default/roles.xml"}
echo "SETTING ROLES XML:" . "$ROLES_XML"

CLASSPATH="$CATALINA_HOME/webapps/geoserver/WEB-INF/lib/"

# tmp files
TMP_USERS=/tmp/users.xml
TMP_ROLES=/tmp/roles.xml

make_hash(){
  local NEW_PASSWORD=$1
  local DIGEST_JAR
  DIGEST_JAR=$(find "$CLASSPATH" -regex ".*jasypt-[0-9]\.[0-9]\.[0-9].*jar" | head -n 1)
  (echo "digest1:" && java -classpath "$DIGEST_JAR" org.jasypt.intf.cli.JasyptStringDigestCLI digest.sh algorithm=SHA-256 saltSizeBytes=16 iterations=100000 input="$NEW_PASSWORD" verbose=0) | tr -d '\n'
}

# create PW hash for given password
PWD_HASH=$(make_hash "$GEOSERVER_ADMIN_PASSWORD")

# USERS.XML SETUP
# <user enabled="true" name="admin" password="digest1:D9miJH/hVgfxZJscMafEtbtliG0ROxhLfsznyWfG38X2pda2JOSV4POi55PQI4tw"/>
if sed -e "s/ name=\".*\" / name=\"${GEOSERVER_ADMIN_USER}\" /" -e "s|password=\".*\"/|password=\"${PWD_HASH}\"\/|" "$USERS_XML_ORIG" > "$TMP_USERS"; then
    mv "$TMP_USERS" "$USERS_XML"
    echo "Successfully replaced $USERS_XML"
else
    echo "CAUTION: Abort update_credentials.sh due to error while creating users.xml. File at $USERS_XML is left untouched"
    exit
fi

if [ -n "${GEOSERVER_WFS_PASSWORD}" ]; then
  WFS_USER=${GEOSERVER_WFS_USER:-wfs}
  WFS_PWD_HASH=$(make_hash "$GEOSERVER_WFS_PASSWORD")
  TMP_USERS_WITH_WFS=/tmp/users-wfs.xml
  if perl -0pe "s!<user enabled=\\\"true\\\" name=\\\"${WFS_USER}\\\" password=\\\"[^\"]*\\\"/>\\s*!!; s!(</users>)!        <user enabled=\\\"true\\\" name=\\\"${WFS_USER}\\\" password=\\\"${WFS_PWD_HASH}\\\"/>\\n    \\1!;" "$USERS_XML" > "$TMP_USERS_WITH_WFS"; then
      mv "$TMP_USERS_WITH_WFS" "$USERS_XML"
      echo "Successfully added or updated WFS user ${WFS_USER}"
  else
      echo "CAUTION: Abort update_credentials.sh due to error while adding WFS user. File at $USERS_XML is left untouched"
      exit
  fi
fi

# ROLES.XML SETUP
# <userRoles username="admin">
if sed -e "s/ username=\".*\"/ username=\"${GEOSERVER_ADMIN_USER}\"/" "$ROLES_XML_ORIG" > "$TMP_ROLES"; then
    mv "$TMP_ROLES" "$ROLES_XML"
    echo "Successfully replaced $ROLES_XML"
else
    echo "CAUTION: Abort update_credentials.sh due to error while creating roles.xml. File at $ROLES_XML is left untouched"
    exit
fi

echo "... DONE updating GeoServer Credentials ..."
