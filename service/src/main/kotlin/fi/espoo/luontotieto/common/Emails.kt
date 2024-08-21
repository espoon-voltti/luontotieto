// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.common

import org.jsoup.Jsoup

val DO_NOT_REPLY_MESSAGE =
    """Ethän vastaa tähän viestiin. Mikäli kirjautumisessa 
    tai tunnusten kanssa ilmenee haasteita, olethan yhteydessä ymparisto@espoo.fi.
    """.trimMargin()

fun linkElement(url: String) = """<a href="$url">$url</a>"""

data class EmailContent(
    val title: String,
    val text: String,
    @org.intellij.lang.annotations.Language("html") val html: String
) {
    companion object {
        private val TOO_MANY_NEWLINES = Regex("\n{3,}")

        fun fromHtml(
            subject: String,
            @org.intellij.lang.annotations.Language("html") html: String
        ) = Jsoup.parseBodyFragment(html).let { doc ->
            val parsedHtml = doc.body().html()

            doc.select("hr").forEach {
                it.replaceWith(doc.createElement("p").text("-----"))
            }
            doc.select("p").forEach { it.prependText("\n").appendText("\n") }
            doc.select("a").forEach { a ->
                val replacement = doc.createElement("a")
                replacement.text(a.attr("href").removePrefix("mailto:"))
                a.replaceWith(replacement)
            }

            EmailContent(
                subject,
                text =
                doc.body()
                    .wholeText()
                    .lineSequence()
                    .joinToString(separator = "\n") { it.trim() }
                    .replace(TOO_MANY_NEWLINES, "\n\n")
                    .trim(),
                html = parsedHtml,
            )
        }
    }
}

class Emails {
    companion object {
        fun getUserCreatedEmail(
            link: String,
            email: String,
            password: String
        ) = EmailContent.fromHtml(
            "Käyttäjätunnukset luotu Espoon Luontotietoportaaliin",
            """
<p>Teille on luotu käyttäjätunnukset Espoon Luontotietoportaaliin.</p>
<p>Voitte kirjautua palveluun osoitteessa ${linkElement(link)}.</p>
<p>Käyttäjätunnus: $email</p>
<p>Salasana: $password</p>
<p>Vaihtakaa salasana ensimmäisen kirjautumisen yhteydessä.</p>
<p>$DO_NOT_REPLY_MESSAGE</p>
"""
        )

        fun getUserPasswordUpdatedEmail(link: String) =
            EmailContent.fromHtml(
                "Salasana vaihdettu Espoon Luontotietoportaalissa",
                """
<p>Teidän salasananne on vaihdettu Espoon Luontotietoportaalissa.</p>
<p>Voitte kirjautua palveluun osoitteessa ${linkElement(link)}.</p>
<p>Jos et ole itse vaihtanut salasanaasi, pyydämme sinua ottamaan yhteyttä ymparisto@espoo.fi.</p>
<p>$DO_NOT_REPLY_MESSAGE</p>
"""
            )

        fun getPasswordResetedEmail(
            link: String,
            password: String
        ) = EmailContent.fromHtml(
            "Salasana resetoitu Espoon Luontotietoportaalissa",
            """
<p>Teidän salasananne Espoon Luontotietoportaaliin on resetoitu.</p>
<p>Voitte kirjautua palveluun osoitteessa ${linkElement(link)}.</p>
<p>Uusi salasana: $password</p>
<p>Vaihtakaa salasana ensimmäisen kirjautumisen yhteydessä.</p>
<p>$DO_NOT_REPLY_MESSAGE</p>
"""
        )

        fun getReportApprovedEmail(
            reportName: String,
            approverName: String,
            link: String
        ) = EmailContent.fromHtml(
            "Hyväksytty selvitys: $reportName",
            """
<p>$approverName on hyväksynyt selvityksen $reportName.</p>
<p>Selvityksen nimi: $reportName</p>
<p>Linkki selvitykseen: ${linkElement(link)}</p>
<p>Kirjaudu järjestelmään nähdäksesi kaikki selvityksen tiedot. Luontotietoportaaliin kirjaudutaan yrityksen yhteiskäyttötunnuksilla.</p>
<p>$DO_NOT_REPLY_MESSAGE</p> 
                """
        )

        fun getReportCreatedEmail(
            reportName: String,
            reportDescription: String,
            link: String
        ) = EmailContent.fromHtml(
            "Uusi luontoselvitys",
            """
<p>Teille on avattu uusi selvitys Espoon Luontotietoportaalissa.</p>
<p>Selvityksen nimi: $reportName</p>
<p>Selvityksen kuvaus: $reportDescription</p>
<p>Linkki selvitykseen: ${linkElement(link)}</p>
<p>Kirjaudu järjestelmään nähdäksesi kaikki selvitystilauksen tiedot ja täydentääksesi selvitystä. Luontotietoportaaliin kirjaudutaan yrityksen yhteiskäyttötunnuksilla.</p>
<p>$DO_NOT_REPLY_MESSAGE</p>
                """
        )

        fun getReportUpdatedEmail(
            reportName: String,
            reportAssignee: String,
            link: String
        ) = EmailContent.fromHtml(
            "Päivitys selvitykseen $reportName",
            """
<p>Tilaamaasi selvitystä $reportName on päivitetty. Pääset tarkastelemaan muutoksia Luontotietoportaalista.</p>
<p>Selvityksen nimi: $reportName</p>
<p>Selvityksen tekijä: $reportAssignee</p>
<p>Linkki selvitykseen: ${linkElement(link)}</p>
"""
        )
    }
}
