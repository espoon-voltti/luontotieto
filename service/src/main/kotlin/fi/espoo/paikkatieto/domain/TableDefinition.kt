// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.paikkatieto.domain

import fi.espoo.paikkatieto.reader.GpkgFeature
import fi.espoo.paikkatieto.reader.GpkgValidationError
import fi.espoo.paikkatieto.reader.GpkgValidationErrorReason
import org.jdbi.v3.core.Handle
import org.locationtech.jts.geom.Geometry
import org.locationtech.jts.io.WKBWriter
import java.sql.Date
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

interface TableDefinition {
    val columns: List<Column>
}

object LiitoOravaPisteet : TableDefinition {
    override val columns =
        listOf(
            Column(name = "geom", kClass = Geometry::class),
            Column(name = "pvm", kClass = Date::class),
            Column(name = "havaitsija", kClass = String::class),
            Column(name = "puulaji", kClass = String::class),
            Column(name = "halkaisija", kClass = Int::class),
            Column(name = "papanamaara", kClass = Int::class),
            Column(name = "pesa", kClass = Boolean::class),
            Column(name = "pesatyyppi", kClass = String::class, sqlType = "liito_orava_pesatyyppi"),
            Column(name = "pesankorkeus", kClass = Int::class),
            Column(name = "lisatieto", kClass = String::class, isNullable = true),
            Column(name = "viite", kClass = String::class),
            Column(name = "kunta", kClass = Int::class, isNullable = true),
            Column(name = "tarkkuus", kClass = String::class, sqlType = "luontotieto_mittaustyyppi")
        )
}

object LiitoOravaAlueet : TableDefinition {
    override val columns =
        listOf(
            Column(name = "geom", kClass = Geometry::class),
            Column(name = "pvm", kClass = Date::class),
            Column(name = "havaitsija", kClass = String::class),
            Column(name = "aluetyyppi", kClass = String::class, sqlType = "liito_orava_aluetyyppi"),
            Column(name = "aluekuvaus", kClass = String::class, isNullable = true),
            Column(name = "koko", kClass = Double::class),
            Column(name = "lisatieto", kClass = String::class, isNullable = true),
            Column(name = "viite", kClass = String::class),
            Column(name = "kunta", kClass = Int::class, isNullable = true),
            Column(name = "tarkkuus", kClass = String::class, sqlType = "luontotieto_mittaustyyppi")
        )
}

object LiitoOravaYhteysviivat : TableDefinition {
    override val columns =
        listOf(
            Column(name = "geom", kClass = Geometry::class),
            Column(name = "vuosi", kClass = Int::class),
            Column(name = "havaitsija", kClass = String::class),
            Column(name = "laatu", kClass = String::class, sqlType = "liito_orava_aluetyyppi"),
            Column(name = "lisatieto", kClass = String::class, isNullable = true),
            Column(name = "viite", kClass = String::class),
            Column(name = "kunta", kClass = Int::class, isNullable = true),
            Column(name = "tarkkuus", kClass = String::class, sqlType = "luontotieto_mittaustyyppi")
        )
}

fun Handle.insertLiitoOravaPisteet(data: Sequence<GpkgFeature>): Array<Int> {
    val batchInsert =
        prepareBatch(
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
        geom
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
        ST_GeomFromWKB(:geom, 3879)
    )
    RETURNING id
    """
        )

    data.forEach { batchInsert.add(convertColumnsWithGeometry(it.columns)) }

    return batchInsert.execute().toTypedArray()
}

fun Handle.insertLiitoOravaAlueet(data: Sequence<GpkgFeature>): Array<Int> {
    val batchInsert =
        prepareBatch(
            """
    INSERT INTO liito_orava_alueet (
        pvm,
        havaitsija,
        aluetyyppi,
        aluekuvaus,
        koko,
        lisatieto,
        viite,
        kunta,
        tarkkuus,
        geom
    ) 
    VALUES (
        :pvm,
        :havaitsija,
        :aluetyyppi::liito_orava_aluetyyppi,
        :aluekuvaus,
        :koko,
        :lisatieto,
        :viite,
        :kunta,
        :tarkkuus::luontotieto_mittaustyyppi,
        ST_GeomFromWKB(:geom, 3879)
    )
    RETURNING id
    """
        )

    data.forEach { batchInsert.add(convertColumnsWithGeometry(it.columns)) }

    return batchInsert.execute().toTypedArray()
}

fun Handle.insertLiitoOravaYhteysviivat(data: Sequence<GpkgFeature>): Array<Int> {
    val batchInsert =
        prepareBatch(
            """
    INSERT INTO liito_orava_yhteysviivat (
        vuosi,
        havaitsija,
        laatu,
        lisatieto,
        pituus,
        viite,
        kunta,
        tarkkuus,
        geom
    ) 
    VALUES (
        :vuosi,
        :havaitsija,
        :laatu,
        :lisatieto,
        :pituus,
        :viite,
        :kunta,
        :tarkkuus::luontotieto_mittaustyyppi,
        ST_GeomFromWKB(:geom, 3879)
    )
    RETURNING id
    """
        )

    data.forEach { batchInsert.add(convertColumnsWithGeometry(it.columns)) }

    return batchInsert.execute().toTypedArray()
}

private fun convertColumnsWithGeometry(map: Map<String, Any?>): Map<String, Any?> {
    return map.mapValues { (_, value) ->
        when (value) {
            is Geometry -> WKBWriter().write(value)
            else -> value
        }
    }
}
