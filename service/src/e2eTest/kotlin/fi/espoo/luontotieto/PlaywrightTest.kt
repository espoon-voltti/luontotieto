// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import com.microsoft.playwright.Browser
import com.microsoft.playwright.BrowserType
import com.microsoft.playwright.Page
import com.microsoft.playwright.Playwright
import org.jdbi.v3.core.Jdbi
import org.jdbi.v3.core.kotlin.withHandleUnchecked
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.boot.test.context.SpringBootTest

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT
)
abstract class PlaywrightTest {
    @Qualifier("jdbi-luontotieto")
    @Autowired
    protected lateinit var jdbi: Jdbi

    protected lateinit var playwright: Playwright
    protected lateinit var browser: Browser

    @BeforeAll
    fun beforeAllSuper() {
        jdbi.withHandleUnchecked { tx ->
            tx.execute(
                """
                CREATE OR REPLACE FUNCTION reset_database() RETURNS void AS ${'$'}${'$'}
                BEGIN
                  EXECUTE (
                    SELECT 'TRUNCATE TABLE ' || string_agg(quote_ident(table_name), ', ') || ' CASCADE'
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_type = 'BASE TABLE'
                    AND table_name <> 'flyway_schema_history'
                    AND table_name <> 'users'
                  );
                  
                  DELETE FROM users WHERE id <> '00000000-0000-0000-0000-000000000000';
                  
                  EXECUTE (
                    SELECT 'SELECT ' || coalesce(string_agg(format('setval(%L, %L, false)', sequence_name, start_value), ', '), '')
                    FROM information_schema.sequences
                    WHERE sequence_schema = 'public'
                  );
                END ${'$'}${'$'} LANGUAGE plpgsql;
                """.trimIndent()
            )
        }

        playwright = Playwright.create()
        browser =
            playwright.chromium().launch(
                BrowserType
                    .LaunchOptions()
                    .setHeadless(runningInDocker)
                    .setTimeout(10_000.0)
            )
    }

    @BeforeEach
    fun beforeEachSuper() {
        jdbi.withHandleUnchecked { tx ->
            tx.execute("SELECT reset_database()")
        }
    }

    @AfterAll
    fun afterAllSuper() {
        browser.close()
        playwright.close()
    }

    protected fun getPageWithDefaultOptions(): Page {
        val page = browser.newPage()
        val timeout = if (runningInDocker) 10_000.0 else 2000.0
        page.setDefaultTimeout(timeout)
        page.setDefaultNavigationTimeout(timeout)
        if (E2E_DEBUG_LOGGING) {
            page.onDOMContentLoaded {
                println("DOMContentLoaded")
            }
            page.onConsoleMessage { println("Console ${it.type()}: ${it.text()}") }
            page.onPageError { println("PageError") }
            page.onRequest { println("Request ${it.method()} ${it.url()}") }
            page.onResponse { println("Response ${it.status()} ${it.url()}") }
            page.onRequestFailed { println("RequestFailed") }
            page.onRequestFinished { println("RequestFinished") }
        }
        return page
    }
}
