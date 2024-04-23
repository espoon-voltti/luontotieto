// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.paikkatieto.writer

import fi.espoo.paikkatieto.domain.TableDefinition
import mu.KotlinLogging
import org.geotools.api.data.DataStore
import org.geotools.api.data.DataStoreFinder
import org.geotools.feature.simple.SimpleFeatureTypeBuilder
import org.geotools.geopkg.GeoPkgDataStoreFactory
import java.nio.file.Path
import kotlin.io.path.createTempFile

private val logger = KotlinLogging.logger {}

object GpkgWriter {
    fun write(tableDefinition: TableDefinition): Path? {
        var dataStore: DataStore? = null
        var path: Path? = null
        try {
            path = createTempFile("template-", ".gpkg")
            val dataStoreParams =
                mapOf(
                    GeoPkgDataStoreFactory.DBTYPE.key to GeoPkgDataStoreFactory.DBTYPE.sample,
                    GeoPkgDataStoreFactory.DATABASE.key to path.toString()
                )

            dataStore = DataStoreFinder.getDataStore(dataStoreParams)

            val builder =
                SimpleFeatureTypeBuilder().apply {
                    name = tableDefinition.layerName
                    setSRS("EPSG:3879")
                }

            for (column in tableDefinition.columns) {
                builder.add(column.name, column.kClass.java)
            }

            val featureType = builder.buildFeatureType()
            dataStore.createSchema(featureType)
        } catch (e: Exception) {
            logger.error("Unable to write .gkpg template", e)
        } finally {
            dataStore?.dispose()
        }
        return path
    }
}
