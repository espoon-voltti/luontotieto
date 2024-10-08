<!--
SPDX-FileCopyrightText: 2023-2024 City of Espoo

SPDX-License-Identifier: LGPL-2.1-or-later
-->

# Luontotietoportaali WFS-endpoint (GeoServer)

This directory `./geoserver` contains:

- `Dockerfile` to create a customized GeoServer installation for Luontotietoportaali WFS-service
- `./geoserver/data_dir` GeoServer's data directory with relevant configurations. This directory is fully copied into the built Docker-image.

## Instructions

### Environment variables

```
SKIP_DEMO_DATA: true                            # Skip Geoserver demo data, should be true in production
POSTGRES_JNDI_ENABLED: true                     # Enable JNDI, should be true in production
POSTGRES_HOST: paikkatieto-db                   # Hostname
POSTGRES_PORT: 5432                             # Port
POSTGRES_DB: paikkatietodb                      # Database
POSTGRES_USERNAME: paikkatietodb                # Username
POSTGRES_PASSWORD: postgres                     # Password
EXTRA_JAVA_OPTS: -DALLOW_ENV_PARAMETRIZATION=true -DGEOSERVER_CONSOLE_DISABLED=true -Xms256m -Xmx512m
GEOSERVER_ADMIN_PASSWORD: plain:password        # In production please use hashed password, see section below
GEOSERVER_WFS_PASSWORD: plain:wfs_password      # In production please use hashed password, see section below
```

### Password hashing

GeoServer supports only a limited set of password hashing algorithms. Irreversible sha256 will be the
best option in this service despite it's technical limitations.

Execute in the running GeoServer container:

```
docker exec -it [CONTAINER_ID] bash
echo "digest1:" && java -classpath $(find $CLASSPATH -regex ".*jasypt-[0-9]\.[0-9]\.[0-9].*jar") org.jasypt.intf.cli.JasyptStringDigestCLI digest.sh algorithm=SHA-256 saltSizeBytes=16 iterations=100000 input=PASSWORD_TO_HASH verbose=0
```

Copy the hash and provide it either in `GEOSERVER_ADMIN_PASSWORD` or `GEOSERVER_WFS_PASSWORD`

### Layer configuration

1. Navigate to GeoServer Admin UI in `http://localhost:8000/geoserver`. Username is `admin` and password can be found from `compose/docker-compose.yml`

2. Open _Layers_ view and click _+ Add a new layer_
   ![Add a new layer](docs/add-layer-1.png "Add a new layer")

3. Publish the layer
   ![Publish layer](docs/add-layer-2.png "Publish")

4. Configure the layer.

   - _Compute from SRS bounds_ (calculates layer bounds)
   - _Compute from native bounds_ (calculate native layer bounds)
   - _Save_ after bounds have been calculated.
     ![Configure the layer](docs/add-layer-3.png "Configure the layer")

5. Commit changes in `geoserver/*` to Git.
