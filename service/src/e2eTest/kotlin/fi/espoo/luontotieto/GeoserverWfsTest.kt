// SPDX-FileCopyrightText: 2026 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import fi.espoo.luontotieto.config.GeoserverEnv
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.GeoserverController
import fi.espoo.luontotieto.domain.OrderController
import fi.espoo.luontotieto.domain.OrderReportDocument
import fi.espoo.luontotieto.domain.Report
import fi.espoo.luontotieto.domain.ReportController
import java.time.Duration
import java.util.UUID
import javax.xml.parsers.DocumentBuilderFactory
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import okhttp3.Credentials
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.withHandleUnchecked
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.DynamicTest.dynamicTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestFactory
import org.junit.jupiter.api.TestInstance
import org.locationtech.jts.io.WKTReader
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.test.context.SpringBootTest
import org.w3c.dom.Element

/**
 * Trimble Locus reads the approved nature data from GeoServer as WFS 1.0.0 with the `wfs` user.
 * These tests cover what a GeoServer upgrade can break: the users and roles the startup script
 * installs, the published layer set, the schema and data of every layer, and the path from an
 * approved report through PostGIS to WFS. GeoServer must read the same paikkatieto database as the
 * service under test (PAIKKATIETO_DB_NAME in the e2e compose file).
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class GeoserverWfsTest {
    @Qualifier("jdbi-luontotieto") @Autowired private lateinit var jdbi: Jdbi
    @Qualifier("jdbi-paikkatieto") @Autowired private lateinit var paikkatietoJdbi: Jdbi
    @Autowired private lateinit var geoserverEnv: GeoserverEnv
    @Autowired private lateinit var orderController: OrderController
    @Autowired private lateinit var reportController: ReportController
    @Autowired private lateinit var geoserverController: GeoserverController

    private val wfsCredentials =
        Credentials.basic(
            System.getenv("GEOSERVER_WFS_USERNAME") ?: "wfs",
            System.getenv("GEOSERVER_WFS_PASSWORD") ?: "wfs_password",
        )
    private val adminCredentials by lazy {
        Credentials.basic(geoserverEnv.userName, geoserverEnv.password)
    }
    private val wfsUrl by lazy { "${geoserverEnv.baseUrl}geoserver/wfs" }
    private val restUrl by lazy { "${geoserverEnv.baseUrl}geoserver/rest" }
    private val http = OkHttpClient.Builder().readTimeout(Duration.ofSeconds(60)).build()
    private val testRunId = UUID.randomUUID()
    private val expectedLayers = wfsTestFeatures.map { it.layer }.toSet()
    private lateinit var columnTypes: Map<String, Map<String, String>>
    private lateinit var geometryTypes: Map<String, String>

    @BeforeAll
    fun insertTestFeatures() {
        jdbi.withHandleUnchecked { tx ->
            tx.execute(
                "INSERT INTO users (id, updated, external_id, name) VALUES (?, now(), ?, ?)",
                adminUser.id,
                "wfs-test:${adminUser.id}",
                "Teija Testaaja",
            )
            tx.execute(
                "INSERT INTO users (id, updated, name, email, role) VALUES (?, now(), ?, ?, 'yrityskäyttäjä')",
                customerUser.id,
                "Yritys Oy",
                "wfs-test-${customerUser.id}@example.com",
            )
        }
        paikkatietoJdbi.withHandleUnchecked { tx ->
            columnTypes =
                tx.select(
                        """
                        SELECT table_name, column_name, udt_name FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = ANY(?)
                        """,
                        expectedLayers.toTypedArray(),
                    )
                    .mapToMap()
                    .groupBy({ it["table_name"] as String }) {
                        (it["column_name"] as String) to (it["udt_name"] as String)
                    }
                    .mapValues { (_, columns) -> columns.toMap() }
            geometryTypes =
                tx.select("SELECT f_table_name, type FROM geometry_columns").mapToMap().associate {
                    (it["f_table_name"] as String) to (it["type"] as String)
                }
            wfsTestFeatures.forEach { tx.insertFeature(it) }
        }
    }

    @AfterAll
    fun deleteTestFeatures() {
        paikkatietoJdbi.withHandleUnchecked { tx ->
            wfsTestFeatures.forEach { feature ->
                val (column, value) = marker(feature.layer)
                tx.execute("DELETE FROM ${feature.layer} WHERE CAST($column AS text) = ?", value)
            }
        }
    }

    @Test
    fun `WFS requires a login`() {
        val anonymous = wfs(null, "1.0.0", "GetCapabilities")
        assertEquals(401, anonymous.code)
        assertTrue(anonymous.authenticate?.startsWith("Basic") == true, anonymous.authenticate)
        val wrongPassword = wfs(Credentials.basic("wfs", "wrong"), "1.0.0", "GetCapabilities")
        assertEquals(401, wrongPassword.code)
    }

    @TestFactory
    fun `wfs user gets every layer from GetCapabilities`(): List<DynamicTest> =
        listOf("1.0.0", "1.1.0", "2.0.0").map { version ->
            dynamicTest("WFS $version") {
                val response = wfs(wfsCredentials, version, "GetCapabilities")
                assertEquals(200, response.code, response.body.take(500))
                assertTrue(response.body.contains("version=\"$version\""), response.body.take(500))
                val published =
                    Regex("<Name>luontotieto:([a-z_]+)</Name>")
                        .findAll(response.body)
                        .map { it.groupValues[1] }
                        .toSet()
                assertEquals(expectedLayers, published)
            }
        }

    @TestFactory
    fun `DescribeFeatureType matches the PostGIS table of every layer`(): List<DynamicTest> =
        wfsTestFeatures.map { feature ->
            dynamicTest(feature.layer) {
                val response =
                    wfs(
                        wfsCredentials,
                        "1.0.0",
                        "DescribeFeatureType",
                        "typeName" to "luontotieto:${feature.layer}",
                    )
                assertEquals(200, response.code, response.body.take(500))
                val described =
                    Regex("<xsd:element [^>]*name=\"([^\"]+)\"[^>]*type=\"([^\"]+)\"")
                        .findAll(response.body)
                        .associate { it.groupValues[1] to it.groupValues[2] }
                        .filterKeys { it != feature.layer }
                // The primary key is not exposed and array columns are not supported by WFS
                val expected =
                    columnTypes
                        .getValue(feature.layer)
                        .filter { (column, type) -> column != "id" && !type.startsWith("_") }
                        .mapValues { (_, type) -> xsdType(feature.layer, type) }
                assertEquals(expected, described)
            }
        }

    @TestFactory
    fun `GetFeature returns the inserted feature of every layer`(): List<DynamicTest> =
        wfsTestFeatures.map { feature ->
            dynamicTest(feature.layer) {
                val (markerColumn, markerValue) = marker(feature.layer)
                val filter = "$markerColumn='$markerValue'"
                val hits =
                    wfs(
                        wfsCredentials,
                        "2.0.0",
                        "GetFeature",
                        "typeNames" to "luontotieto:${feature.layer}",
                        "resultType" to "hits",
                        "CQL_FILTER" to filter,
                    )
                assertEquals(200, hits.code, hits.body.take(500))
                assertEquals(
                    "1",
                    Regex("numberMatched=\"(\\d+)\"").find(hits.body)?.groupValues?.get(1),
                    "GeoServer does not serve the inserted row. Does it read the same database " +
                        "as the service? ${hits.body.take(500)}",
                )
                val gml = getFeatures(feature.layer, filter).single()
                assertEquals(
                    feature.attributes + (markerColumn to markerValue),
                    gml.attributes.filterKeys { it in feature.attributes || it == markerColumn },
                )
                assertTrue(gml.srsName.endsWith("3879"), gml.srsName)
                assertCoordinates(feature.geometry, gml.coordinates)
            }
        }

    @Test
    fun `only admin may reload the configuration and nothing else is open in REST`() {
        assertEquals(200, post("$restUrl/reload", adminCredentials).code)
        assertTrue(post("$restUrl/reload", wfsCredentials).code in setOf(401, 403))
        assertEquals(401, post("$restUrl/reload", null).code)
        assertTrue(get("$restUrl/workspaces", adminCredentials).code in setOf(401, 403))
        assertTrue(get("$restUrl/workspaces", wfsCredentials).code in setOf(401, 403))
    }

    @Test
    fun `approved report is served through WFS until it is reopened`() {
        val reportName = "Keskuspuiston liito-oravaselvitys 2026"
        val created =
            createOrderAndReport(
                orderController,
                name = reportName,
                reportDocuments =
                    listOf(
                        OrderReportDocument(
                            "Liito-oravan papanapuut",
                            DocumentType.LIITO_ORAVA_PISTEET,
                        )
                    ),
            )
        reportController.updateReport(
            adminUser,
            created.reportId,
            Report.Companion.ReportInput(reportName, false, emptyList()),
        )
        assertEquals(
            201,
            createLiitoOravaPisteetReportFile(reportController, created.reportId)
                .statusCode
                .value(),
        )
        reportController.approveReport(adminUser, created.reportId, false, null)
        assertTrue(geoserverController.reloadSchemas(adminUser).isSuccess)

        val filter = "selvitys_id='${created.reportId}'"
        val features = getFeatures("liito_orava_pisteet", filter)
        assertEquals(2, features.size)
        val koivu = features.single { it.attributes["puulaji"] == "Koivu" }
        assertEquals(reportName, koivu.attributes["viite"])
        assertEquals("2024-03-17", koivu.attributes["pvm"])
        assertCoordinates("POINT (25478090.217030223 6679589.505727745)", koivu.coordinates)

        reportController.reopenReport(adminUser, created.reportId)
        assertEquals(emptyList(), getFeatures("liito_orava_pisteet", filter))
    }

    private data class HttpResult(val code: Int, val body: String, val authenticate: String?)

    private data class GmlFeature(
        val attributes: Map<String, String>,
        val coordinates: List<Double>,
        val srsName: String,
    )

    private fun wfs(
        credentials: String?,
        version: String,
        request: String,
        vararg params: Pair<String, String>,
    ): HttpResult {
        val url =
            wfsUrl.toHttpUrl().newBuilder().apply {
                addQueryParameter("service", "WFS")
                addQueryParameter("version", version)
                addQueryParameter("request", request)
                params.forEach { (name, value) -> addQueryParameter(name, value) }
            }
        return get(url.build().toString(), credentials)
    }

    private fun get(url: String, credentials: String?) =
        send(Request.Builder().url(url), credentials)

    private fun post(url: String, credentials: String?) =
        send(
            Request.Builder().url(url).post("".toRequestBody("application/xml".toMediaType())),
            credentials,
        )

    private fun send(builder: Request.Builder, credentials: String?): HttpResult {
        credentials?.let { builder.header("Authorization", it) }
        http.newCall(builder.build()).execute().use { response ->
            return HttpResult(
                response.code,
                response.body.string(),
                response.header("WWW-Authenticate"),
            )
        }
    }

    /** Fetches features as Trimble does: WFS 1.0.0 and GML 2. */
    private fun getFeatures(layer: String, cqlFilter: String): List<GmlFeature> {
        val response =
            wfs(
                wfsCredentials,
                "1.0.0",
                "GetFeature",
                "typeName" to "luontotieto:$layer",
                "CQL_FILTER" to cqlFilter,
            )
        assertEquals(200, response.code, response.body.take(500))
        val document =
            DocumentBuilderFactory.newInstance()
                .apply { isNamespaceAware = true }
                .newDocumentBuilder()
                .parse(response.body.byteInputStream())
        val features = document.getElementsByTagNameNS("luontotieto", layer)
        return (0 until features.length).map { index ->
            val attributes = mutableMapOf<String, String>()
            var coordinates = emptyList<Double>()
            var srsName = ""
            val children = (features.item(index) as Element).childNodes
            for (i in 0 until children.length) {
                val child = children.item(i) as? Element ?: continue
                if (child.namespaceURI != "luontotieto") continue
                if (child.localName == "geom") {
                    val geometry = child.getElementsByTagName("*").item(0) as Element
                    srsName = geometry.getAttribute("srsName")
                    coordinates =
                        child
                            .getElementsByTagNameNS("http://www.opengis.net/gml", "coordinates")
                            .item(0)
                            .textContent
                            .trim()
                            .split(Regex("[ ,]+"))
                            .map { it.toDouble() }
                } else {
                    attributes[child.localName] = child.textContent
                }
            }
            GmlFeature(attributes, coordinates, srsName)
        }
    }

    private fun assertCoordinates(wkt: String, actual: List<Double>) {
        val expected = WKTReader().read(wkt).coordinates.flatMap { listOf(it.x, it.y) }
        assertEquals(expected.size, actual.size, "coordinates $actual")
        expected.zip(actual).forEach { (e, a) -> assertEquals(e, a, 0.01, "coordinates $actual") }
    }

    private fun marker(layer: String): Pair<String, String> =
        if ("selvitys_id" in columnTypes.getValue(layer)) "selvitys_id" to testRunId.toString()
        else "viite" to "WFS-testi $testRunId"

    private fun Handle.insertFeature(feature: WfsTestFeature) {
        val values = feature.attributes + marker(feature.layer)
        val types = columnTypes.getValue(feature.layer)
        val columns = values.keys.joinToString { "\"$it\"" }
        val casts = values.keys.joinToString { "CAST(:$it AS \"${types.getValue(it)}\")" }
        createUpdate(
                "INSERT INTO ${feature.layer} ($columns, geom) " +
                    "VALUES ($casts, ST_GeomFromText(:geom, 3879))"
            )
            .bindMap(values)
            .bind("geom", feature.geometry)
            .execute()
    }

    private fun xsdType(layer: String, udtName: String) =
        when (udtName) {
            "int4" -> "xsd:int"
            "float4" -> "xsd:float"
            "bool" -> "xsd:boolean"
            "date" -> "xsd:date"
            "geometry" ->
                when (val type = geometryTypes.getValue(layer)) {
                    "POINT" -> "gml:PointPropertyType"
                    "LINESTRING" -> "gml:LineStringPropertyType"
                    "POLYGON" -> "gml:PolygonPropertyType"
                    else -> error("Unexpected geometry type $type")
                }
            else -> "xsd:string"
        }
}
