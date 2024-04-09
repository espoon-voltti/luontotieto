// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.paikkatieto.reader

import fi.espoo.paikkatieto.domain.TableDefinition
import mu.KotlinLogging
import org.geotools.api.data.SimpleFeatureReader
import org.geotools.geopkg.GeoPackage
import java.io.Closeable
import java.io.File
import java.io.IOException

private val logger = KotlinLogging.logger {}

class GpkgReaderException(msg: String) : IOException(msg)

class GpkgReader(file: File, val tableDefinition: TableDefinition) :
    Iterator<Map<String, Any?>>, Closeable {
    private val gpkg: GeoPackage = GeoPackage(file)
    private val reader: SimpleFeatureReader

    init {
        val featureEntry =
            gpkg.features().firstOrNull()
                ?: throw GpkgReaderException("Unable to find feature table")
        reader = gpkg.reader(featureEntry, null, null)
    }

    override fun hasNext(): Boolean {
        return reader.hasNext()
    }

    override fun next(): Map<String, Any> {
        val feature = reader.next()
        return tableDefinition.columns.associateWith { feature.getAttribute(it) }
    }

    override fun close() {
        try {
            reader.close()
        } catch (e: IOException) {
            logger.error("Unable to close SimpleFeatureReader", e)
        }
        try {
            gpkg.close()
        } catch (e: IOException) {
            logger.error("Unable to close GeoPackage", e)
        }
    }
}
