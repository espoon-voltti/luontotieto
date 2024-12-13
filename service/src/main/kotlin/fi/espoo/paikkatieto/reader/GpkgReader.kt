// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.paikkatieto.reader

import fi.espoo.luontotieto.domain.PaikkaTietoEnum
import fi.espoo.paikkatieto.domain.TableDefinition
import mu.KotlinLogging
import org.geotools.api.data.SimpleFeatureReader
import org.geotools.api.feature.simple.SimpleFeature
import org.geotools.geopkg.GeoPackage
import org.locationtech.jts.geom.Geometry
import java.io.Closeable
import java.io.File
import java.io.IOException
import java.util.Locale
import kotlin.reflect.full.isSubclassOf

private val logger = KotlinLogging.logger {}

class GpkgReaderException(
    msg: String
) : IOException(msg)

enum class GpkgValidationErrorReason {
    IS_NULL,
    WRONG_TYPE,
    INVALID_VALUE
}

data class GpkgValidationError(
    val id: String,
    val column: String,
    val value: Any?,
    val reason: GpkgValidationErrorReason
)

data class GpkgFeature(
    val columns: Map<String, Any?>,
    val errors: List<GpkgValidationError>
) {
    fun isValid() = errors.isEmpty()
}

class GpkgReader(
    private val file: File,
    val tableDefinition: TableDefinition,
    private val validEnums: List<PaikkaTietoEnum>
) : Iterator<GpkgFeature>,
    Closeable {
    private lateinit var gpkg: GeoPackage
    private var reader: SimpleFeatureReader

    init {
        try {
            gpkg = GeoPackage(file)
            val featureEntry =
                gpkg.features().firstOrNull()
                    ?: throw GpkgReaderException("Unable to find feature table ${file.name}")
            logger.debug("Found feature table ${featureEntry.tableName} in file ${file.name}")
            reader = gpkg.reader(featureEntry, null, null)
        } catch (e: IOException) {
            try {
                gpkg.close()
            } catch (e: IOException) {
                logger.error("Unable to close GeoPackage", e)
            }
            throw e
        }
    }

    fun isValid(): Boolean = this.asSequence().all { it.isValid() }

    override fun hasNext(): Boolean = reader.hasNext()

    override fun next(): GpkgFeature {
        val gpkgFeature = reader.next()
        val columns =
            tableDefinition.columns.associate { column ->
                val isGeometryColumn = column.kClass.isSubclassOf(Geometry::class)
                if (isGeometryColumn) {
                    val geom = gpkgFeature.getAttribute(column.name) ?: gpkgFeature.defaultGeometry
                    Pair(column.name, geom)
                } else {
                    Pair(column.name, getAttribute(column.name, gpkgFeature))
                }
            }

        val errors =
            tableDefinition.columns.mapNotNull { column ->
                val isGeometryColumn = column.kClass.isSubclassOf(Geometry::class)
                val attr =
                    if (isGeometryColumn) {
                        gpkgFeature.getAttribute(column.name) ?: gpkgFeature.defaultGeometry
                    } else {
                        getAttribute(column.name, gpkgFeature)
                    }

                val allowedColumnValues =
                    validEnums
                        .filter { it.name == column.sqlType }
                        .map { it.value }

                column.validate(gpkgFeature.id, attr, allowedColumnValues)
            }

        return GpkgFeature(columns = columns, errors = errors)
    }

    private fun getAttribute(
        column: String,
        gpkgFeature: SimpleFeature
    ): Any? =
        gpkgFeature.getAttribute(column)
            ?: gpkgFeature.getAttribute(column.uppercase())
            ?: gpkgFeature.getAttribute(
                column.lowercase().replaceFirstChar {
                    if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString()
                }
            )

    override fun close() {
        try {
            reader.close()
            logger.debug("Closed SimpleFeatureReader file {}", file.name)
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
