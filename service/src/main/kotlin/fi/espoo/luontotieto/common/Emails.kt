package fi.espoo.luontotieto.common

import org.jsoup.Jsoup
import java.util.UUID

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
        fun getUserCreatedEmail(password: String) =
            EmailContent.fromHtml(
                "Käyttäjä luotu",
                """
<p>Teille on luotu uusi käyttäjä luontotietoportaaliin,</p>
<p>Voitte kirjautua portaaliin osoitteessa luontotietoportaali.fi käyttämällä salasanaa: $password</p>
<p>Olkaa hyvä ja vaihtakaa salasana kirjautumisen jälkeen.</p>
"""
            )

        fun getReportApprovedEmail(reportId: UUID) =
            EmailContent.fromHtml(
                "Luontotietoselvitys on hyväksytty",
                """
<p>Luontotietoselvitys on hyväksytty.</p>
<p>Tiedot on nyt lähetetty ja tallennettu paikkatietokantaan.</p>
<p>Selvityksen löydätte luontotietoportaalista tunnisteella: $reportId .</p> 
                """
            )

        fun getReportCreatedEmail(reportId: UUID) =
            EmailContent.fromHtml(
                "Luontotieto selvityspyyntö",
                """
<p>Teille on luotu uusi luontoselvitys.</p>
<p>Selvityksen löydätte luontotietoportaalista tunnisteella: $reportId .</p> 
                """
            )

        fun getReportUpdatedEmail(reportId: UUID) =
            EmailContent.fromHtml(
                "Luontotietoselvitystä päivitetty",
                """
<p>Luntotietoselvitystä $reportId on päivitetty.</p>
<p>Selvityksen löydätte luontotietoportaalista tunnisteella: $reportId .</p> 
                """
            )
    }
}
