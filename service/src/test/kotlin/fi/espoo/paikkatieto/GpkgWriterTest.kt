// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.paikkatieto

import fi.espoo.paikkatieto.domain.TableDefinition
import fi.espoo.paikkatieto.domain.tableDefinitions
import fi.espoo.paikkatieto.writer.GpkgWriter
import org.geotools.api.data.DataStoreFinder
import org.geotools.geopkg.GeoPkgDataStoreFactory
import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.exists
import kotlin.test.Test
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class GpkgWriterTest {
    private fun checkIsValidSchema(
        file: Path,
        tableDefinition: TableDefinition
    ): Boolean {
        val dataStoreParams =
            mapOf(
                GeoPkgDataStoreFactory.DBTYPE.key to GeoPkgDataStoreFactory.DBTYPE.sample,
                GeoPkgDataStoreFactory.DATABASE.key to file.toString()
            )
        val dataStore = DataStoreFinder.getDataStore(dataStoreParams)
        val schema = dataStore.getSchema(tableDefinition.layerName)

        return tableDefinition.columns.all { column ->
            val type = schema.getType(column.name)
            column.kClass == type.binding.kotlin
        }
    }

    @Test
    fun testAndValidateFiles() {
        for (tableDefinition in tableDefinitions) {
            val file = GpkgWriter.write(tableDefinition)
            assertNotNull(file)
            assertTrue(file.exists())
            assertTrue(Files.size(file) > 0)
            val valid = checkIsValidSchema(file, tableDefinition)
            assertTrue(valid)
        }
    }
}
