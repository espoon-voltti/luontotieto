// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.paikkatieto

import fi.espoo.paikkatieto.domain.TableDefinition
import fi.espoo.paikkatieto.reader.GpkgFeature
import fi.espoo.paikkatieto.reader.GpkgReader
import fi.espoo.paikkatieto.reader.GpkgValidationError
import fi.espoo.paikkatieto.reader.GpkgValidationErrorReason
import org.locationtech.jts.io.WKTReader
import java.io.File
import java.sql.Date
import kotlin.test.Test
import kotlin.test.assertEquals

class GpkgReaderTest {
    @Test
    fun `reads liito_orava_pisteet GeoPackage file`() {
        val file = File("src/test/resources/test-data/liito_orava_pisteet.gpkg")
        val point1 =
            WKTReader().read("POINT(25478090.217030223 6679589.505727745)").also { it.srid = 3879 }
        val point2 =
            WKTReader().read("POINT(25477822.196581766 6679874.633864404)").also { it.srid = 3879 }

        val expected =
            listOf(
                GpkgFeature(
                    columns =
                        mapOf<String, Any?>(
                            "geom" to point1,
                            "pvm" to Date.valueOf("2024-03-17"),
                            "havaitsija" to "Hannu Havaitsija",
                            "puulaji" to "Koivu",
                            "halkaisija" to 60,
                            "papanamaara" to 1,
                            "pesa" to false,
                            "pesatyyppi" to "Pönttö",
                            "pesankorkeus" to 2,
                            "lisatieto" to null,
                            "viite" to "11",
                            "kunta" to 79,
                            "tarkkuus" to "GPS"
                        ),
                    errors = emptyList()
                ),
                GpkgFeature(
                    columns =
                        mapOf<String, Any?>(
                            "geom" to point2,
                            "pvm" to Date.valueOf("2024-03-10"),
                            "havaitsija" to "Hannu Havaitsija",
                            "puulaji" to "Mänty",
                            "halkaisija" to 34,
                            "papanamaara" to 1,
                            "pesa" to true,
                            "pesatyyppi" to "Kolo",
                            "pesankorkeus" to 11,
                            "lisatieto" to null,
                            "viite" to "Espoo",
                            "kunta" to 79,
                            "tarkkuus" to "Muu"
                        ),
                    errors = emptyList()
                )
            )
        GpkgReader(file, TableDefinition.LiitoOravaPisteet).use { reader ->
            val actual = reader.asSequence().toList()
            assertEquals(expected, actual)
        }
    }

    @Test
    fun `reads liito_orava_alueet GeoPackage file`() {
        val file = File("src/test/resources/test-data/liito_orava_alueet.gpkg")
        val polygon =
            WKTReader()
                .read(
                    """
                POLYGON ((25477807.241104946 6679802.40297119, 25477911.620408114 6679758.50094668, 25477810.37696384 6679735.205994899, 25477810.37696384 6679735.205994899, 25477807.241104946 6679802.40297119))"
                """
                        .trimIndent()
                )
                .also { it.srid = 3879 }

        val expected: List<GpkgFeature> =
            listOf(
                GpkgFeature(
                    columns =
                        mapOf<String, Any?>(
                            "geom" to polygon,
                            "pvm" to Date.valueOf("2024-04-20"),
                            "havaitsija" to "Harri Havaitsija",
                            "aluetyyppi" to "Elinalue",
                            "aluekuvaus" to "Alue oravalle",
                            "lisatieto" to null,
                            "viite" to "Espoo 4/2024",
                            "kunta" to 79,
                            "tarkkuus" to "Muu"
                        ),
                    errors = emptyList()
                )
            )
        GpkgReader(file, TableDefinition.LiitoOravaAlueet).use { reader ->
            val actual = reader.asSequence().toList()
            assertEquals(expected, actual)
        }
    }

    @Test
    fun `reads liito_orava_alueet GeoPackage file with errors`() {
        val file = File("src/test/resources/test-data/liito_orava_alueet_broken.gpkg")
        val polygon =
            WKTReader()
                .read(
                    """
                POLYGON ((25477807.241104946 6679802.40297119, 25477911.620408114 6679758.50094668, 25477810.37696384 6679735.205994899, 25477810.37696384 6679735.205994899, 25477807.241104946 6679802.40297119))"
                """
                        .trimIndent()
                )
                .also { it.srid = 3879 }

        val expected: List<GpkgFeature> =
            listOf(
                GpkgFeature(
                    columns =
                        mapOf<String, Any?>(
                            "geom" to polygon,
                            "pvm" to Date.valueOf("2024-04-20"),
                            "havaitsija" to "Harri Havaitsija",
                            "aluetyyppi" to "Elinalue",
                            "aluekuvaus" to "Alue oravalle",
                            "lisatieto" to null,
                            "viite" to "Espoo 4/2024",
                            "kunta" to "79",
                            "tarkkuus" to null
                        ),
                    errors =
                        listOf(
                            GpkgValidationError(
                                column = "kunta",
                                value = "79",
                                reason = GpkgValidationErrorReason.WRONG_TYPE
                            ),
                            GpkgValidationError(
                                column = "tarkkuus",
                                value = null,
                                reason = GpkgValidationErrorReason.IS_NULL
                            )
                        )
                )
            )
        GpkgReader(file, TableDefinition.LiitoOravaAlueet).use { reader ->
            val actual = reader.asSequence().toList()
            assertEquals(expected, actual)
        }
    }
}
