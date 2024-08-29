package fi.espoo.luontotieto

import fi.espoo.luontotieto.common.SanitizationService
import fi.espoo.luontotieto.domain.DocumentType
import fi.espoo.luontotieto.domain.Order
import fi.espoo.luontotieto.domain.OrderReportDocument
import fi.espoo.luontotieto.domain.Report
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.reflect.full.memberProperties

@SpringBootTest
class SanitizationServiceTest {

    private lateinit var sanitizationService: SanitizationService

    @BeforeEach
    fun setUp() {
        sanitizationService = SanitizationService()
    }

    val unsafePatterns =
        listOf("=", "+", "-", "@", "<", ">", "script", "<body>", "<iframe", "<html>", "<h1>", "+CMD", "style")


    @Test
    fun `test CSV and HTML injection prevention on a report`() {

        val testReport = Report(
            UUID.randomUUID(),
            "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
            true,
            OffsetDateTime.now(),
            OffsetDateTime.now(),
            "\"<body onload='stealCookies()'>",
            "\"<iframe src='evil.com'></iframe>",
            false,
            listOf(DocumentType.REPORT),
            listOf("\"=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>\"", "+CMD|' /C calc'!A0"),

            Order(
                UUID.randomUUID(),
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                listOf(
                    "\"=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>\"",
                    "+CMD|' /C calc'!A0"
                ),
                listOf(
                    "\"=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>\"",
                    "+CMD|' /C calc'!A0"
                ),
                OffsetDateTime.now(),
                OffsetDateTime.now(),
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                UUID.randomUUID(),
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                LocalDate.now(),
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                listOf(
                    OrderReportDocument(
                        description = "=SUM(21:21)<script>alert('XSS')</script><html><h1>injection</h1></html>",
                        DocumentType.LIITO_ORAVA_VIIVAT
                    )
                )

            )
        )

        val sanitizedReport = sanitizationService.sanitizeObject(testReport)

        checkForUnsafePatterns(sanitizedReport, unsafePatterns)

    }

    private fun checkForUnsafePatterns(obj: Any, unsafePatterns: List<String>) {
        obj::class.memberProperties.forEach { prop ->
            val value = prop.getter.call(obj)
            when (value) {
                is String -> {
                    // Ensure that the string does not contain any unsafe patterns after sanitization
                    unsafePatterns.forEach { pattern ->
                        assertTrue(
                            !value.contains(pattern),
                            "Property ${prop.name} contains unsafe pattern after sanitization: $value"
                        )
                    }
                }

                is Array<*> -> {
                    // If it's an array, check each element
                    value.forEach { item ->
                        if (item is String) {
                            unsafePatterns.forEach { pattern ->
                                assertTrue(
                                    !item.contains(pattern),
                                    "Array item in ${prop.name} contains unsafe pattern after sanitization: $item"
                                )
                            }
                        }
                    }
                }

                else -> {
                    // If it's an object, recursively check its properties
                    if (value != null && !sanitizationService.isPrimitiveOrString(value)) {
                        checkForUnsafePatterns(value, unsafePatterns)
                    }
                }
            }
        }
    }


}

