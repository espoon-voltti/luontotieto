// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto

import com.microsoft.playwright.Page
import fi.espoo.luontotieto.pages.LoginPage
import org.junit.jupiter.api.Test

class E2ETests : PlaywrightTest() {
    @Test
    fun `ad login works`() {
        val page = getPageWithDefaultOptions()
        doLogin(page)
    }

    private fun doLogin(page: Page) {
        page.navigate("$baseUrl/kirjaudu")
        val loginPage = LoginPage(page)
        loginPage.assertUrl()
        loginPage.loginWithAd()
    }
}
