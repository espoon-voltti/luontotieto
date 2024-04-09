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

enum class GpkgValidationErrorReason {
    IS_NULL,
    WRONG_TYPE
}

data class GpkgValidationError(
    val column: String,
    val value: Any?,
    val reason: GpkgValidationErrorReason
)

data class GpkgFeature(val columns: Map<String, Any>, val errors: List<GpkgValidationError>) {
    fun isValid() = errors.isEmpty()
}

class GpkgReader(file: File, val tableDefinition: TableDefinition) :
    Iterator<GpkgFeature>, Closeable {
    private val gpkg: GeoPackage = GeoPackage(file)
    private val reader: SimpleFeatureReader

    init {
        val featureEntry =
            gpkg.features().firstOrNull()
                ?: throw GpkgReaderException("Unable to find feature table")
        reader = gpkg.reader(featureEntry, null, null)
    }

    fun isValid(): Boolean {
        return this.asSequence().all { it.isValid() }
    }

    override fun hasNext(): Boolean {
        return reader.hasNext()
    }

    override fun next(): GpkgFeature {
        val gpkgFeature = reader.next()

        val columns =
            tableDefinition.columns.associate { column ->
                Pair(column.name, gpkgFeature.getAttribute(column.name))
            }

        val errors =
            tableDefinition.columns.mapNotNull { column ->
                column.validate(gpkgFeature.getAttribute(column.name))
            }

        return GpkgFeature(columns = columns, errors = errors)
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
