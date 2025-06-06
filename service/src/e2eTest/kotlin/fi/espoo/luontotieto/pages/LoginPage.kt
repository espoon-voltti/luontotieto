// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.pages

import com.microsoft.playwright.Page
import com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat
import fi.espoo.luontotieto.baseUrl
import fi.espoo.luontotieto.dataQa

class LoginPage(
    private val page: Page
) {
    val startAdLoginButton = page.locator(dataQa("start-ad-login"))
    val loggedInUser = page.locator(dataQa("logged-in-user"))

    fun assertUrl() {
        assertThat(page).hasURL("$baseUrl/kirjaudu")
    }

    fun loginWithAd() {
        startAdLoginButton.click()
        page.locator("button").click()
        assertThat(loggedInUser).containsText("Sanna Suunnittelija")
    }
}
