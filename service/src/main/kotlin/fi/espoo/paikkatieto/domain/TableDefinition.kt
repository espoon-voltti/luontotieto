// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.paikkatieto.domain

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
    fun validate(value: Any?): GpkgValidationError? =
        when {
            value == null && !isNullable ->
                GpkgValidationError(
                    column = name,
                    value = null,
                    reason = GpkgValidationErrorReason.IS_NULL
                )
            value != null &&
                (!value::class.isSubclassOf(kClass) && value::class != kClass::class) ->
                GpkgValidationError(
                    column = name,
                    value = value,
                    reason = GpkgValidationErrorReason.WRONG_TYPE
                )
            else -> null
        }
}

enum class TableDefinition(
    val layerName: String,
    val sqlInsertStatement: String,
    val columns: List<Column>
) {
    LiitoOravaPisteet(
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
                Column(name = "viite", kClass = String::class),
                Column(name = "kunta", kClass = Int::class, isNullable = true),
                Column(
                    name = "tarkkuus",
                    kClass = String::class,
                    sqlType = "luontotieto_mittaustyyppi"
                )
            )
    ),
    LiitoOravaAlueet(
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
                Column(name = "viite", kClass = String::class),
                Column(name = "kunta", kClass = Int::class, isNullable = true),
                Column(
                    name = "tarkkuus",
                    kClass = String::class,
                    sqlType = "luontotieto_mittaustyyppi"
                )
            )
    ),
    LiitoOravaYhteysviivat(
        layerName = "liito_orava_yhteysviivat",
        sqlInsertStatement = SQL_INSERT_LIITO_ORAVA_YHTEYSVIIVAT,
        columns =
            listOf(
                Column(name = "geom", kClass = LineString::class),
                Column(name = "vuosi", kClass = Int::class),
                Column(name = "havaitsija", kClass = String::class),
                Column(name = "laatu", kClass = String::class, sqlType = "liito_orava_aluetyyppi"),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(name = "viite", kClass = String::class),
                Column(name = "kunta", kClass = Int::class, isNullable = true),
                Column(
                    name = "tarkkuus",
                    kClass = String::class,
                    sqlType = "luontotieto_mittaustyyppi"
                )
            )
    ),
    MuutHuomioitavatLajitPisteet(
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
                Column(
                    name = "IUCN_luokka",
                    kClass = String::class,
                    sqlType = "muut_huomioitavat_lajit_IUCN_luokka"
                ),
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
                Column(name = "viite", kClass = String::class),
                Column(name = "havaitsija", kClass = String::class)
            )
    ),
    MuutHuomioitavatLajitViivat(
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
                Column(
                    name = "IUCN_luokka",
                    kClass = String::class,
                    sqlType = "muut_huomioitavat_lajit_IUCN_luokka"
                ),
                Column(name = "direktiivi", kClass = String::class),
                Column(name = "havaintopaikan_kuvaus", kClass = String::class, isNullable = true),
                Column(name = "laji_luokitus", kClass = String::class),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(name = "viite", kClass = String::class),
                Column(name = "havaitsija", kClass = String::class)
            )
    ),
    MuutHuomioitavatLajitAlueet(
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
                Column(
                    name = "IUCN_luokka",
                    kClass = String::class,
                    sqlType = "muut_huomioitavat_lajit_IUCN_luokka"
                ),
                Column(name = "direktiivi", kClass = String::class),
                Column(name = "havaintopaikan_kuvaus", kClass = String::class, isNullable = true),
                Column(name = "laji_luokitus", kClass = String::class),
                Column(name = "yksilo_maara", kClass = Int::class, isNullable = true),
                Column(name = "yksikko", kClass = String::class, isNullable = true),
                Column(name = "lisatieto", kClass = String::class, isNullable = true),
                Column(name = "viite", kClass = String::class),
                Column(name = "havaitsija", kClass = String::class)
            )
    )
}

fun Handle.insertPaikkatieto(
    tableDefinition: TableDefinition,
    reportId: UUID,
    data: Sequence<GpkgFeature>
): Array<Int> {
    val batchInsert = prepareBatch(tableDefinition.sqlInsertStatement)
    data.forEach {
        batchInsert.add(convertColumnsWithGeometry(it.columns).plus(Pair("reportId", reportId)))
    }
    return batchInsert.execute().toTypedArray()
}

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
        :viite,
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
        :viite,
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
        vuosi,
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
        :vuosi,
        :havaitsija,
        :laatu,
        :lisatieto,
        :viite,
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
        :IUCN_luokka::"muut_huomioitavat_lajit_IUCN_luokka",
        :direktiivi,
        :paikan_nimi,
        :havaintopaikan_kuvaus,
        :koordinaatti_tarkkuus,
        :tarkkuus::luontotieto_mittaustyyppi,
        :yksilo_maara,
        :yksikko,
        :lisatieto,
        :viite,
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
        :IUCN_luokka::"muut_huomioitavat_lajit_IUCN_luokka",
        :direktiivi,
        :havaintopaikan_kuvaus,
        :laji_luokitus,
        :lisatieto,
        :viite,
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
        :IUCN_luokka::"muut_huomioitavat_lajit_IUCN_luokka",
        :direktiivi,
        :havaintopaikan_kuvaus,
        :laji_luokitus,
        :yksilo_maara,
        :yksikko,
        :lisatieto,
        :viite,
        :havaitsija,
        ST_GeomFromWKB(:geom, 3879),
        :reportId
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
