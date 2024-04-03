// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.paikkatieto.domain

import org.jdbi.v3.core.Handle
import org.locationtech.jts.geom.Geometry
import org.locationtech.jts.io.WKBWriter

interface TableDefinition {
    val columns: List<String>
}

object LiitoOravaPisteet : TableDefinition {
    override val columns =
        listOf(
            "geom",
            "pvm",
            "havaitsija",
            "puulaji",
            "halkaisija",
            "papanamaara",
            "pesa",
            "pesatyyppi",
            "pesankorkeus",
            "lisatieto",
            "viite",
            "kunta",
            "tarkkuus"
        )
}

object LiitoOravaAlueet : TableDefinition {
    override val columns =
        listOf(
            "geom",
            "pvm",
            "havaitsija",
            "aluetyyppi",
            "aluekuvaus",
            "koko",
            "lisatieto",
            "viite",
            "kunta",
            "tarkkuus"
        )
}

object LiitoOravaYhteysviivat : TableDefinition {
    override val columns =
        listOf(
            "geom",
            "vuosi",
            "havaitsija",
            "laatu",
            "lisatieto",
            "pituus",
            "viite",
            "kunta",
            "tarkkuus"
        )
}

fun Handle.insertLiitoOravaPisteet(data: Sequence<Map<String, Any?>>): Array<Int> {
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

    data.forEach { batchInsert.add(convertMapWithGeometry(it)) }

    return batchInsert.execute().toTypedArray()
}

fun Handle.insertLiitoOravaAlueet(data: Sequence<Map<String, Any?>>): Array<Int> {
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

    data.forEach { batchInsert.add(convertMapWithGeometry(it)) }

    return batchInsert.execute().toTypedArray()
}

fun Handle.insertLiitoOravaYhteysviivat(data: Sequence<Map<String, Any?>>): Array<Int> {
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

    data.forEach { batchInsert.add(convertMapWithGeometry(it)) }

    return batchInsert.execute().toTypedArray()
}

private fun convertMapWithGeometry(map: Map<String, Any?>): Map<String, Any?> {
    return map.mapValues { (_, value) ->
        when (value) {
            is Geometry -> WKBWriter().write(value)
            else -> value
        }
    }
}
