// SPDX-FileCopyrightText: 2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

/**
 * One synthetic but realistic feature for every layer GeoServer publishes to Trimble Locus. The
 * list doubles as the expected layer set of the WFS GetCapabilities response. Coordinates are
 * ETRS89 / GK25FIN (EPSG:3879) inside Espoo, attribute values are strings and get cast to the
 * column type on insert.
 */
data class WfsTestFeature(
    val layer: String,
    val geometry: String,
    val attributes: Map<String, String>,
)

private fun point(x: Int, y: Int) = "POINT ($x $y)"

private fun line(x: Int, y: Int) =
    "LINESTRING ($x $y, ${x + 150} ${y + 120}, ${x + 300} ${y + 180})"

private fun square(x: Int, y: Int) =
    "POLYGON (($x $y, ${x + 120} $y, ${x + 120} ${y + 90}, $x ${y + 90}, $x $y))"

private const val KONSULTTI = "Luontoselvitys Oy"
private const val KAUPUNKI = "Espoon kaupunki"

val wfsTestFeatures =
    listOf(
        WfsTestFeature(
            "aluerajaus_luontoselvitystilaus",
            square(25490000, 6675000),
            mapOf(
                "tilauksen_nimi" to "Keskuspuiston asemakaavan luontoselvitys 2026",
                "tilauksen_tekija" to "Tiina Tilaaja",
                "tilausyksikko" to "Kaupunkisuunnittelukeskus",
                "selvitys_linkki" to "https://luontotieto.espoo.fi/tilaukset/testi",
                "tilaus_vuosi" to "2026",
                "selvitys_tila" to "Tilattu",
            ),
        ),
        WfsTestFeature(
            "aluerajaus_luontoselvitys",
            square(25490200, 6675200),
            mapOf(
                "selvitys_nimi" to "Keskuspuiston luontoselvitys 2026",
                "selvitys_vuosi" to "2026",
                "selvitys_tekija" to KONSULTTI,
                "tilausyksikko" to "Kaupunkisuunnittelukeskus",
                "selvitys_linkki" to "https://luontotieto.espoo.fi/selvitykset/testi",
                "lisatieto" to "Liito-orava, lepakot ja luontotyypit",
                "selvitys_raportti_linkki" to "Ei julkinen",
            ),
        ),
        WfsTestFeature(
            "arvokkaat_luontokohteet_alueet",
            square(25478500, 6686000),
            mapOf(
                "pvm" to "2025-06-18",
                "havaitsija" to KAUPUNKI,
                "nimi" to "Sahajärven lehtokorpi",
                "arvoluokka" to "Maakunnallisesti arvokas",
                "aluekuvaus" to "Kostea lehtokorpi, runsaasti lahopuuta",
            ),
        ),
        WfsTestFeature(
            "arvokkaat_vesikohteet_alueet",
            square(25486000, 6681500),
            mapOf(
                "pvm" to "2025-07-02",
                "havaitsija" to KAUPUNKI,
                "nimi" to "Glomsinjoen koski",
                "arvoluokka" to "Luonnontilainen puro",
                "aluekuvaus" to "Taimenen lisääntymisalue",
                "vesisto" to "Espoonjoen vesistö",
            ),
        ),
        WfsTestFeature(
            "ekoyhteydet_alueet",
            square(25488000, 6679000),
            mapOf(
                "pvm" to "2026-05-20",
                "havaitsija" to KONSULTTI,
                "laatu" to "Yhteys on nykyisellään toimiva",
                "lisatieto" to "Metsäinen yhteys Keskuspuistosta Nuuksioon",
                "viite" to "Espoon ekologiset yhteydet 2026",
            ),
        ),
        WfsTestFeature(
            "ekoyhteydet_viivat",
            line(25491000, 6677000),
            mapOf(
                "pvm" to "2026-05-20",
                "havaitsija" to KONSULTTI,
                "laatu" to "Kehitettävä tai heikko yhteys",
                "lisatieto" to "Kehä II:n ylittävä yhteys",
                "viite" to "Espoon ekologiset yhteydet 2026",
            ),
        ),
        WfsTestFeature(
            "lahteet_pisteet",
            point(25481230, 6683410),
            mapOf(
                "pvm" to "2026-05-05",
                "havaitsija" to KONSULTTI,
                "tyyppi" to "Lähde",
                "lisatieto" to "Luonnontilainen lähde rinteen juurella",
                "viite" to "Pienvesiselvitys 2026",
            ),
        ),
        WfsTestFeature(
            "lajiryhma_alueet",
            square(25483000, 6670500),
            mapOf(
                "pvm" to "2025-05-30",
                "havaitsija" to KAUPUNKI,
                "lajiryhma" to "Linnut",
                "aluekuvaus" to "Paikallisesti arvokas lintualue",
            ),
        ),
        WfsTestFeature(
            "lepakko_alueet",
            square(25494300, 6673400),
            mapOf(
                "pvm" to "2026-07-10",
                "havaitsija" to KONSULTTI,
                "luokka" to "Luokka II",
                "lisatieto" to "Pohjanlepakon saalistusalue",
                "viite" to "Tapiolan lepakkoselvitys 2026",
            ),
        ),
        WfsTestFeature(
            "lepakko_viivat",
            line(25494500, 6673600),
            mapOf(
                "pvm" to "2026-07-10",
                "havaitsija" to KONSULTTI,
                "kuvaus" to "Siirtymäreitti puistokäytävää pitkin",
                "viite" to "Tapiolan lepakkoselvitys 2026",
            ),
        ),
        WfsTestFeature(
            "liito_orava_alueet",
            square(25489700, 6676100),
            mapOf(
                "pvm" to "2026-04-12",
                "havaitsija" to KONSULTTI,
                "aluetyyppi" to "Ydinalue",
                "aluekuvaus" to "Kuusivaltainen sekametsä, kolopuita",
                "viite" to "Keskuspuiston liito-oravaselvitys 2026",
                "kunta" to "49",
                "tarkkuus" to "GPS",
            ),
        ),
        WfsTestFeature(
            "liito_orava_pisteet",
            point(25489755, 6676148),
            mapOf(
                "pvm" to "2026-04-12",
                "havaitsija" to KONSULTTI,
                "puulaji" to "Kuusi",
                "halkaisija" to "45",
                "papanamaara" to "120",
                "pesa" to "true",
                "pesatyyppi" to "Kolo",
                "pesankorkeus" to "8",
                "viite" to "Keskuspuiston liito-oravaselvitys 2026",
                "kunta" to "49",
                "tarkkuus" to "GPS",
            ),
        ),
        WfsTestFeature(
            "liito_orava_yhteysviivat",
            line(25489600, 6676000),
            mapOf(
                "pvm" to "2026-04-12",
                "havaitsija" to KONSULTTI,
                "laatu" to "Hyvä",
                "luokka" to "Olemassa oleva",
                "viite" to "Keskuspuiston liito-oravaselvitys 2026",
                "kunta" to "49",
                "tarkkuus" to "Muu",
            ),
        ),
        WfsTestFeature(
            "lumo_alueet",
            square(25487200, 6682300),
            mapOf(
                "pvm" to "2026-06-02",
                "havaitsija" to KONSULTTI,
                "nimi" to "Träskändan jalopuumetsä",
                "lumo_luokka" to "1",
                "lisatieto" to "Vanhaa jalopuustoa",
                "viite" to "Träskändan luontoselvitys 2026",
            ),
        ),
        WfsTestFeature(
            "luontotyypit_alueet",
            square(25476400, 6689800),
            mapOf(
                "vuosi" to "2026",
                "havaitsija" to KONSULTTI,
                "nimi" to "Nuuksion korpi",
                "luontotyyppi_paaryhma" to "Suot",
                "luontotyyppi" to "Mustikkakorpi",
                "uhanalaisuusluokka" to "Erittäin uhanalaiset (EN)",
                "edustavuus" to "Hyvä (2)",
                "kuvaus" to "Luonnontilaisen kaltainen korpi",
                "lisatieto" to "-",
                "ominaislajit" to "Kuusi, mustikka, korpikarhunsammal",
                "lahopuusto" to "Runsaasti",
                "lumo_luokka" to "2",
                "viite" to "Nuuksion luontotyyppiselvitys 2026",
            ),
        ),
        WfsTestFeature(
            "muut_huomioitavat_lajit_alueet",
            square(25490900, 6677300),
            mapOf(
                "pvm" to "2026-06-15",
                "elioryhma" to "Linnut",
                "tieteellinen_nimi" to "Dryocopus martius",
                "suomenkielinen_nimi" to "Palokärki",
                "IUCN_luokka" to "Elinvoimaiset (LC)",
                "direktiivi" to "Lintudirektiivin liite I",
                "laji_luokitus" to "Lintudirektiivi",
                "havaitsija" to KONSULTTI,
                "viite" to "Keskuspuiston lajistoselvitys 2026",
            ),
        ),
        WfsTestFeature(
            "muut_huomioitavat_lajit_pisteet",
            point(25490960, 6677350),
            mapOf(
                "pvm" to "2026-06-15",
                "elioryhma" to "Putkilokasvit",
                "tieteellinen_nimi" to "Dactylorhiza incarnata",
                "suomenkielinen_nimi" to "Punakämmekkä",
                "IUCN_luokka" to "Vaarantuneet (VU)",
                "direktiivi" to "Rauhoitettu",
                "tarkkuus" to "GPS",
                "yksilo_maara" to "12",
                "yksikko" to "kpl",
                "havaitsija" to KONSULTTI,
                "viite" to "Keskuspuiston lajistoselvitys 2026",
            ),
        ),
        WfsTestFeature(
            "muut_huomioitavat_lajit_viivat",
            line(25486100, 6681600),
            mapOf(
                "pvm" to "2026-06-15",
                "elioryhma" to "Nisäkkäät",
                "tieteellinen_nimi" to "Lutra lutra",
                "suomenkielinen_nimi" to "Saukko",
                "IUCN_luokka" to "Elinvoimaiset (LC)",
                "direktiivi" to "Luontodirektiivin liite IV",
                "laji_luokitus" to "Luontodirektiivi",
                "havaitsija" to KONSULTTI,
                "viite" to "Glomsinjoen lajistoselvitys 2026",
            ),
        ),
        WfsTestFeature(
            "neuvotellut_alueet",
            square(25492600, 6679100),
            mapOf(
                "pvm" to "2026-03-03",
                "havaitsija" to "Uudenmaan ELY-keskus",
                "laji" to "Liito-orava",
                "aluetyyppi" to "Lisääntymis- ja levähdyspaikka",
                "aluekuvaus" to "ELY-keskuksen rajaama lisääntymis- ja levähdyspaikka",
                "koko" to "1.5",
                "kunta" to "49",
                "tarkkuus" to "Tarkkuusmitattu",
            ),
        ),
        WfsTestFeature(
            "noro_viivat",
            line(25481300, 6683500),
            mapOf(
                "pvm" to "2026-05-05",
                "havaitsija" to KONSULTTI,
                "tyyppi" to "Noro",
                "lisatieto" to "Luonnontilainen noro",
                "viite" to "Pienvesiselvitys 2026",
            ),
        ),
        WfsTestFeature(
            "vieraslajit_alueet",
            square(25493100, 6679400),
            mapOf(
                "pvm" to "2026-08-20",
                "elioryhma" to "Putkilokasvit",
                "tieteellinen_nimi" to "Lupinus polyphyllus",
                "suomenkielinen_nimi" to "Komealupiini",
                "yksilo_maara" to "200",
                "yksikko" to "m2",
                "havaitsija" to KAUPUNKI,
                "viite" to "Leppävaaran vieraslajikartoitus 2026",
            ),
        ),
        WfsTestFeature(
            "vieraslajit_pisteet",
            point(25493180, 6679460),
            mapOf(
                "pvm" to "2026-08-20",
                "elioryhma" to "Putkilokasvit",
                "tieteellinen_nimi" to "Heracleum persicum",
                "suomenkielinen_nimi" to "Persianjättiputki",
                "yksilo_maara" to "3",
                "yksikko" to "kpl",
                "tarkkuus" to "GPS",
                "havaitsija" to KAUPUNKI,
                "viite" to "Leppävaaran vieraslajikartoitus 2026",
            ),
        ),
    )
