// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.paikkatieto.domain

import fi.espoo.luontotieto.domain.Order
import fi.espoo.luontotieto.domain.Report
import fi.espoo.paikkatieto.reader.GpkgFeature
import fi.espoo.paikkatieto.reader.GpkgValidationError
import fi.espoo.paikkatieto.reader.GpkgValidationErrorReason
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.mapTo
import org.locationtech.jts.geom.Geometry
import org.locationtech.jts.geom.LineString
import org.locationtech.jts.geom.Point
import org.locationtech.jts.geom.Polygon
import org.locationtech.jts.io.WKBWriter
import java.sql.Date
import java.util.UUID
import kotlin.reflect.KClass
import kotlin.reflect.full.isSubclassOf

data class Column(
    val name: String,
    val kClass: KClass<out Any>,
    val isNullable: Boolean = false,
    val sqlType: String? = null
) {
    fun validate(
        id: String,
        value: Any?
    ): GpkgValidationError? =
        when {
            value == null && !isNullable ->
                GpkgValidationError(
                    id = id,
                    column = name,
                    value = null,
                    reason = GpkgValidationErrorReason.IS_NULL
                )

            value != null &&
                (!value::class.isSubclassOf(kClass) && value::class != kClass::class) -> {
                val errorValue =
                    if (kClass.isSubclassOf(Geometry::class)) {
                        kClass.simpleName
                    } else {
                        value
                    }

                GpkgValidationError(
                    id = id,
                    column = name,
                    value = errorValue,
                    reason = GpkgValidationErrorReason.WRONG_TYPE
                )
            }

            else -> null
        }
}

enum class TableDefinition(
    val layerName: String,
    val sqlInsertStatement: String,
    val columns: List<Column>
) {
    ALUERAJAUS_LUONTOSELVITYSTILAUS(
        layerName = "aluerajaus_luontoselvitystilaus",
        sqlInsertStatement = SQL_INSERT_ALUERAJAUS_LUONTOSELVITYSTILAUS,
        columns = listOf(Column(name = "geom", kClass = Polygon::class))
    ),
    ALUERAJAUS_LUONTOSELVITYS(
        layerName = "aluerajaus_luontoselvitys",
        sqlInsertStatement = SQL_INSERT_ALUERAJAUS_LUONTOSELVITYS,
        columns = listOf(Column(name = "geom", kClass = Polygon::class))
    ),
    LIITO_ORAVA_PISTEET(
        layerName = "liito_orava_pisteet",
        sqlInsertStatement = SQL_INSERT_LIITO_ORAVA_PISTEET,
        columns =
            listOf(
                Column(name = "geom", kClass = Point::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "puulaji", kClass = String::class),
                Column(name = "halkaisija", kClass = Int::class),
                Column(name = "papanamaara", kClass = Int::class),
                Column(name = "pesa", kClass = Boolean::class),
                Column(
                    name = "pesatyyppi",
                    kClass = String::class,
                    sqlType = "liito_orava_pesatyyppi"
                ),
                Column(name = "pesankorkeus", kClass = Int::class),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(name = "kunta", kClass = Int::class, isNullable = true),
                Column(
                    name = "tarkkuus",
                    kClass = String::class,
                    sqlType = "luontotieto_mittaustyyppi"
                ),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    LIITO_ORAVA_ALUEET(
        layerName = "liito_orava_alueet",
        sqlInsertStatement = SQL_INSERT_LIITO_ORAVA_ALUEET,
        columns =
            listOf(
                Column(name = "geom", kClass = Polygon::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(
                    name = "aluetyyppi",
                    kClass = String::class,
                    sqlType = "liito_orava_aluetyyppi"
                ),
                Column(name = "aluekuvaus", kClass = String::class, isNullable = true),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(name = "kunta", kClass = Int::class, isNullable = true),
                Column(
                    name = "tarkkuus",
                    kClass = String::class,
                    sqlType = "luontotieto_mittaustyyppi"
                ),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    LIITO_ORAVA_YHTEYSVIIVAT(
        layerName = "liito_orava_yhteysviivat",
        sqlInsertStatement = SQL_INSERT_LIITO_ORAVA_YHTEYSVIIVAT,
        columns =
            listOf(
                Column(name = "geom", kClass = LineString::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "laatu", kClass = String::class, sqlType = "liito_orava_aluetyyppi"),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(name = "kunta", kClass = Int::class, isNullable = true),
                Column(
                    name = "tarkkuus",
                    kClass = String::class,
                    sqlType = "luontotieto_mittaustyyppi"
                ),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    MUUT_HUOMIOITAVAT_LAJIT_PISTEET(
        layerName = "muut_huomioitavat_lajit_pisteet",
        sqlInsertStatement = SQL_INSERT_MUUT_HUOMIOITAVAT_LAJIT_PISTEET,
        columns =
            listOf(
                Column(name = "geom", kClass = Point::class),
                Column(name = "pvm", kClass = Date::class),
                Column(
                    name = "elioryhma",
                    kClass = String::class,
                    sqlType = "muut_huomioitavat_lajit_elioryhma"
                ),
                Column(name = "tieteellinen_nimi", kClass = String::class),
                Column(name = "suomenkielinen_nimi", kClass = String::class),
                Column(name = "IUCN_luokka", kClass = String::class, sqlType = "IUCN_luokka"),
                Column(name = "direktiivi", kClass = String::class),
                Column(name = "paikan_nimi", kClass = String::class, isNullable = true),
                Column(name = "havaintopaikan_kuvaus", kClass = String::class, isNullable = true),
                Column(name = "koordinaatti_tarkkuus", kClass = Double::class, isNullable = true),
                Column(
                    name = "tarkkuus",
                    kClass = String::class,
                    sqlType = "luontotieto_mittaustyyppi"
                ),
                Column(name = "yksilo_maara", kClass = Int::class),
                Column(name = "yksikko", kClass = String::class, isNullable = true),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(name = "havaitsija", kClass = String::class),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    MUUT_HUOMIOITAVAT_LAJIT_VIIVAT(
        layerName = "muut_huomioitavat_lajit_viivat",
        sqlInsertStatement = SQL_INSERT_MUUT_HUOMIOITAVAT_LAJIT_VIIVAT,
        columns =
            listOf(
                Column(name = "geom", kClass = LineString::class),
                Column(name = "pvm", kClass = Date::class),
                Column(
                    name = "elioryhma",
                    kClass = String::class,
                    sqlType = "muut_huomioitavat_lajit_elioryhma"
                ),
                Column(name = "tieteellinen_nimi", kClass = String::class),
                Column(name = "suomenkielinen_nimi", kClass = String::class),
                Column(name = "IUCN_luokka", kClass = String::class, sqlType = "IUCN_luokka"),
                Column(name = "direktiivi", kClass = String::class),
                Column(name = "havaintopaikan_kuvaus", kClass = String::class, isNullable = true),
                Column(name = "laji_luokitus", kClass = String::class),
                // Do not write pituus to DB. Keep it only in the template.
                Column(name = "pituus", kClass = Double::class, isNullable = true),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(name = "havaitsija", kClass = String::class),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    MUUT_HUOMIOITAVAT_LAJIT_ALUEET(
        layerName = "muut_huomioitavat_lajit_alueet",
        sqlInsertStatement = SQL_INSERT_MUUT_HUOMIOITAVAT_LAJIT_ALUEET,
        columns =
            listOf(
                Column(name = "geom", kClass = Polygon::class),
                Column(name = "pvm", kClass = Date::class),
                Column(
                    name = "elioryhma",
                    kClass = String::class,
                    sqlType = "muut_huomioitavat_lajit_elioryhma"
                ),
                Column(name = "tieteellinen_nimi", kClass = String::class),
                Column(name = "suomenkielinen_nimi", kClass = String::class),
                Column(name = "IUCN_luokka", kClass = String::class, sqlType = "IUCN_luokka"),
                Column(name = "direktiivi", kClass = String::class),
                Column(name = "havaintopaikan_kuvaus", kClass = String::class, isNullable = true),
                Column(name = "laji_luokitus", kClass = String::class),
                Column(name = "yksilo_maara", kClass = Int::class, isNullable = true),
                Column(name = "yksikko", kClass = String::class, isNullable = true),
                // Do not write pinta_ala to DB. Keep it only in the template.
                Column(name = "pinta_ala", kClass = Double::class, isNullable = true),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(name = "havaitsija", kClass = String::class),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    LEPAKKO_VIIVAT(
        layerName = "lepakko_viivat",
        sqlInsertStatement = SQL_INSERT_LEPAKKO_VIIVAT,
        columns =
            listOf(
                Column(name = "geom", kClass = LineString::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "kuvaus", kClass = String::class),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    LEPAKKO_ALUEET(
        layerName = "lepakko_alueet",
        sqlInsertStatement = SQL_INSERT_LEPAKKO_ALUEET,
        columns =
            listOf(
                Column(name = "geom", kClass = Polygon::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "luokka", kClass = String::class, sqlType = "lepakko_luokka"),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    LUMO_ALUEET(
        layerName = "lumo_alueet",
        sqlInsertStatement = SQL_INSERT_LUMO_ALUEET,
        columns =
            listOf(
                Column(name = "geom", kClass = Polygon::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "nimi", kClass = String::class, isNullable = true),
                Column(name = "lumo_luokka", kClass = String::class, sqlType = "lumo_luokka"),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    NORO_VIIVAT(
        layerName = "noro_viivat",
        sqlInsertStatement = SQL_INSERT_NORO_VIIVAT,
        columns =
            listOf(
                Column(name = "geom", kClass = LineString::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    LUONTOTYYPIT_ALUEET(
        layerName = "luontotyypit_alueet",
        sqlInsertStatement = SQL_INSERT_LUONTOTYYPIT_ALUEET,
        columns =
            listOf(
                Column(name = "geom", kClass = Polygon::class),
                Column(name = "vuosi", kClass = Int::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "nimi", kClass = String::class, isNullable = true),
                Column(
                    name = "luontotyyppi_paaryhma",
                    kClass = String::class,
                    sqlType = "luontotyyppi_paaryhma"
                ),
                Column(name = "luontotyyppi", kClass = String::class),
                Column(
                    name = "uhanalaisuusluokka",
                    kClass = String::class,
                    sqlType = "IUCN_luokka"
                ),
                Column(name = "edustavuus", kClass = String::class, sqlType = "edustavuus_luokka"),
                Column(name = "kuvaus", kClass = String::class),
                Column(name = "lisatieto", kClass = String::class),
                Column(name = "ominaislajit", kClass = String::class),
                Column(name = "uhanalaiset_lajit", kClass = String::class, isNullable = true),
                Column(name = "lahopuusto", kClass = String::class),
                Column(
                    name = "lumo_luokka",
                    kClass = String::class,
                    sqlType = "luontotyyppi_lumo_luokka"
                ),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    EKOYHTEYDET_ALUEET(
        layerName = "ekoyhteydet_alueet",
        sqlInsertStatement = SQL_INSERT_EKOYHTEYDET_ALUEET,
        columns =
            listOf(
                Column(name = "geom", kClass = Polygon::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "laatu", kClass = String::class, sqlType = "yhteyden_laatu"),
                Column(name = "lisatieto", kClass = String::class),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    EKOYHTEYDET_VIIVAT(
        layerName = "ekoyhteydet_viivat",
        sqlInsertStatement = SQL_INSERT_EKOYHTEYDET_VIIVAT,
        columns =
            listOf(
                Column(name = "geom", kClass = LineString::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "laatu", kClass = String::class, sqlType = "yhteyden_laatu"),
                Column(name = "lisatieto", kClass = String::class),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    ),
    LAHTEET_PISTEET(
        layerName = "lahteet_pisteet",
        sqlInsertStatement = SQL_INSERT_LAHTEET_PISTEET,
        columns =
            listOf(
                Column(name = "geom", kClass = Point::class),
                Column(name = "pvm", kClass = Date::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "tyyppi", kClass = String::class),
                Column(name = "lisatieto", kClass = String::class),
                Column(
                    name = "viite",
                    kClass = String::class,
                    isNullable = true
                )
            )
    )
}

fun Handle.insertPaikkatieto(
    tableDefinition: TableDefinition,
    report: Report,
    data: Sequence<GpkgFeature>,
    params: Map<String, Any?> = emptyMap(),
    overrideReportName: Boolean = false
): Array<Int> {
    val batchInsert = prepareBatch(tableDefinition.sqlInsertStatement)
    data.forEach {
        val reportName = if (overrideReportName) it.columns["viite"] ?: report.name else report.name
        batchInsert.add(
            convertColumnsWithGeometry(it.columns)
                .plus("reportId" to report.id)
                .plus("reportName" to reportName)
                .plus(params)
        )
    }
    return batchInsert.execute().toTypedArray()
}

fun Handle.deletePaikkatieto(
    tableDefinition: TableDefinition,
    reportId: UUID,
): Int {
    val deleteQuery = "DELETE FROM ${tableDefinition.layerName} WHERE selvitys_id = :reportId"
    return createUpdate(deleteQuery).bind("reportId", reportId).execute()
}

fun Handle.updateAluerajausLuontoselvitystilaus(
    reportId: UUID,
    order: Order
): Int {
    return createQuery(
        """
        WITH updated AS (
            UPDATE aluerajaus_luontoselvitystilaus
                SET tilauksen_nimi = :name,
                    tilauksen_tekija = :contactPerson,
                    tilausyksikko = :unit
            WHERE selvitys_id = :reportId
            RETURNING *
        )
        SELECT COUNT(*) FROM updated;
            """
    ).bind("reportId", reportId)
        .bind("name", order.name)
        .bind("contactPerson", order.contactPerson)
        .bind("unit", order.orderingUnit?.joinToString(","))
        .mapTo<Int>()
        .one()
}

fun Handle.deleteAluerajausLuontoselvitystilaus(reportId: UUID): Int {
    return createUpdate("DELETE FROM aluerajaus_luontoselvitystilaus WHERE selvitys_id = :reportId")
        .bind("reportId", reportId)
        .execute()
}

private const val SQL_INSERT_ALUERAJAUS_LUONTOSELVITYSTILAUS =
    """
        INSERT INTO aluerajaus_luontoselvitystilaus (
            tilauksen_nimi,
            tilauksen_tekija,
            tilausyksikko,
            selvitys_id,
            selvitys_linkki,
            geom
        ) VALUES (
            :name,
            :contactPerson,
            :unit,
            :reportId,
            :reportLink,
            ST_GeomFromWKB(:geom, 3879)
        )
        RETURNING id
    """

private const val SQL_INSERT_ALUERAJAUS_LUONTOSELVITYS =
    """
        INSERT INTO aluerajaus_luontoselvitys (
            selvitys_nimi,
            selvitys_vuosi,
            selvitys_tekija,
            tilausyksikko,
            selvitys_id,
            selvitys_linkki,
            selvitys_raportti_linkki,
            lisatieto,
            selvitetyt_tiedot,
            geom
        ) VALUES (
            :name,
            :year,
            :contactPerson,
            :unit,
            :reportId,
            :reportLink,
            :reportDocumentLink,
            :additionalInformation,
            :surveyedData,
            ST_GeomFromWKB(:geom, 3879)
        )
        RETURNING id
    """

private const val SQL_INSERT_LIITO_ORAVA_PISTEET =
    """
    INSERT INTO liito_orava_pisteet (
        pvm,
        havaitsija,
        puulaji,
        halkaisija,
        papanamaara,
        pesa,
        pesatyyppi,
        pesankorkeus,
        lisatieto,
        viite,
        kunta,
        tarkkuus,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :puulaji,
        :halkaisija,
        :papanamaara,
        :pesa,
        :pesatyyppi::liito_orava_pesatyyppi,
        :pesankorkeus,
        :lisatieto,
        :reportName,
        :kunta,
        :tarkkuus::luontotieto_mittaustyyppi,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_LIITO_ORAVA_ALUEET =
    """
    INSERT INTO liito_orava_alueet (
        pvm,
        havaitsija,
        aluetyyppi,
        aluekuvaus,
        lisatieto,
        viite,
        kunta,
        tarkkuus,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :aluetyyppi::liito_orava_aluetyyppi,
        :aluekuvaus,
        :lisatieto,
        :reportName,
        :kunta,
        :tarkkuus::luontotieto_mittaustyyppi,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_LIITO_ORAVA_YHTEYSVIIVAT =
    """
    INSERT INTO liito_orava_yhteysviivat (
        pvm,
        havaitsija,
        laatu,
        lisatieto,
        viite,
        kunta,
        tarkkuus,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :laatu,
        :lisatieto,
        :reportName,
        :kunta,
        :tarkkuus::luontotieto_mittaustyyppi,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_MUUT_HUOMIOITAVAT_LAJIT_PISTEET =
    """
    INSERT INTO muut_huomioitavat_lajit_pisteet (
        pvm,
        elioryhma,
        tieteellinen_nimi,
        suomenkielinen_nimi,
        "IUCN_luokka",
        direktiivi,
        paikan_nimi,
        havaintopaikan_kuvaus,
        koordinaatti_tarkkuus,
        tarkkuus,
        yksilo_maara,
        yksikko,
        lisatieto,
        viite,
        havaitsija,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :elioryhma::muut_huomioitavat_lajit_elioryhma,
        :tieteellinen_nimi,
        :suomenkielinen_nimi,
        :IUCN_luokka::"IUCN_luokka",
        :direktiivi,
        :paikan_nimi,
        :havaintopaikan_kuvaus,
        :koordinaatti_tarkkuus,
        :tarkkuus::luontotieto_mittaustyyppi,
        :yksilo_maara,
        :yksikko,
        :lisatieto,
        :reportName,
        :havaitsija,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_MUUT_HUOMIOITAVAT_LAJIT_VIIVAT =
    """
    INSERT INTO muut_huomioitavat_lajit_viivat (
        pvm,
        elioryhma,
        tieteellinen_nimi,
        suomenkielinen_nimi,
        "IUCN_luokka",
        direktiivi,
        havaintopaikan_kuvaus,
        laji_luokitus,
        lisatieto,
        viite,
        havaitsija,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :elioryhma::muut_huomioitavat_lajit_elioryhma,
        :tieteellinen_nimi,
        :suomenkielinen_nimi,
        :IUCN_luokka::"IUCN_luokka",
        :direktiivi,
        :havaintopaikan_kuvaus,
        :laji_luokitus,
        :lisatieto,
        :reportName,
        :havaitsija,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_MUUT_HUOMIOITAVAT_LAJIT_ALUEET =
    """
    INSERT INTO muut_huomioitavat_lajit_alueet (
        pvm,
        elioryhma,
        tieteellinen_nimi,
        suomenkielinen_nimi,
        "IUCN_luokka",
        direktiivi,
        havaintopaikan_kuvaus,
        laji_luokitus,
        yksilo_maara,
        yksikko,
        lisatieto,
        viite,
        havaitsija,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :elioryhma::muut_huomioitavat_lajit_elioryhma,
        :tieteellinen_nimi,
        :suomenkielinen_nimi,
        :IUCN_luokka::"IUCN_luokka",
        :direktiivi,
        :havaintopaikan_kuvaus,
        :laji_luokitus,
        :yksilo_maara,
        :yksikko,
        :lisatieto,
        :reportName,
        :havaitsija,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_LEPAKKO_VIIVAT =
    """
    INSERT INTO lepakko_viivat (
        pvm,
        havaitsija,
        kuvaus,
        lisatieto,
        viite,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :kuvaus,
        :lisatieto,
        :reportName,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_LEPAKKO_ALUEET =
    """
    INSERT INTO lepakko_alueet (
        pvm,
        havaitsija,
        luokka,
        lisatieto,
        viite,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :luokka::lepakko_luokka,
        :lisatieto,
        :reportName,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_LUMO_ALUEET =
    """
    INSERT INTO lumo_alueet (
        pvm,
        havaitsija,
        nimi,
        lumo_luokka,
        lisatieto,
        viite,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :nimi,
        :lumo_luokka::lumo_luokka,
        :lisatieto,
        :reportName,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_NORO_VIIVAT =
    """
    INSERT INTO noro_viivat (
        pvm,
        havaitsija,
        lisatieto,
        viite,
        geom,
        selvitys_id
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :lisatieto,
        :reportName,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
    )
    RETURNING id
    """

private const val SQL_INSERT_LUONTOTYYPIT_ALUEET =
    """
    INSERT INTO luontotyypit_alueet (
        vuosi,
        havaitsija,
        nimi,
        luontotyyppi_paaryhma,
        luontotyyppi,
        uhanalaisuusluokka,
        edustavuus,
        kuvaus,
        lisatieto,
        ominaislajit,
        uhanalaiset_lajit,
        lahopuusto,
        lumo_luokka,
        viite,
        selvitys_id,
        geom
    ) 
    VALUES (
        :vuosi,
        :havaitsija,
        :nimi,
        :luontotyyppi_paaryhma::luontotyyppi_paaryhma,
        :luontotyyppi,
        :uhanalaisuusluokka::"IUCN_luokka",
        :edustavuus::edustavuus_luokka,
        :kuvaus,
        :lisatieto,
        :ominaislajit,
        :uhanalaiset_lajit,
        :lahopuusto,
        :lumo_luokka::luontotyyppi_lumo_luokka,
        :reportName,
        :reportId,
        ST_GeomFromWKB(:geom, 3879)
    )
    RETURNING id
    """

private const val SQL_INSERT_EKOYHTEYDET_ALUEET =
    """
    INSERT INTO ekoyhteydet_alueet (
        pvm,
        havaitsija,
        laatu,
        lisatieto,
        viite,
        selvitys_id,
        geom
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :laatu::yhteyden_laatu,
        :lisatieto,
        :reportName,
        :reportId,
        ST_GeomFromWKB(:geom, 3879)
    )
    RETURNING id
    """

private const val SQL_INSERT_EKOYHTEYDET_VIIVAT =
    """
    INSERT INTO ekoyhteydet_viivat (
        pvm,
        havaitsija,
        laatu,
        lisatieto,
        viite,
        selvitys_id,
        geom
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :laatu::yhteyden_laatu,
        :lisatieto,
        :reportName,
        :reportId,
        ST_GeomFromWKB(:geom, 3879)
    )
    RETURNING id
    """

private const val SQL_INSERT_LAHTEET_PISTEET =
    """
    INSERT INTO lahteet_pisteet (
        pvm,
        havaitsija,
        tyyppi,
        lisatieto,
        viite,
        selvitys_id,
        geom
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :tyyppi,
        :lisatieto,
        :reportName,
        :reportId,
        ST_GeomFromWKB(:geom, 3879)
    )
    RETURNING id
    """

fun Handle.getEnumRange(column: Column): List<String>? {
    return column.sqlType?.let { sqlType ->
        createQuery("""SELECT unnest(enum_range(NULL::"$sqlType"))::text""")
            .mapTo(String::class)
            .list()
    }
}

private fun convertColumnsWithGeometry(map: Map<String, Any?>): Map<String, Any?> {
    return map.mapValues { (_, value) ->
        when (value) {
            is Geometry -> WKBWriter().write(value)
            else -> value
        }
    }
}
