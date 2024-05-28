package fi.espoo.luontotieto.common

import java.util.UUID

data class EmailContent(val title: String, val content: String)

class Emails {

    companion object {

        fun getUserCreatedEmail(password: String) =
            EmailContent(
                "Käyttäjä luotu",
                """Teille on luotu uusi käyttäjä luontotietoportaaliin.
                        \nVoitte kirjautua portaaliin osoitteessa luontotietoportaali.fi käyttämällä salasanaa: $password . 
                        \nOlkaa hyvä ja vaihtakaa salasana kirjautumisen jälkeen.
                """.trimMargin()
            )

        fun getReportApprovedEmail(reportId: UUID) =
            EmailContent(
                "Luontotietoselvitys on hyväksytty",
                """Luontotietoselvitys on hyväksytty.
               \nTiedot on nyt lähetetty ja tallennettu paikkatietokantaan. 
               \nSelvityksen löydätte luontotietoportaalista tunnisteella: $reportId . 

                """.trimMargin()
            )

        fun getReportCreatedEmail(reportId: UUID) =
            EmailContent(
                "Luontotieto selvityspyyntö",
                """Teille on luotu uusi luontoselvitys.
              \nSelvityksen löydätte luontotietoportaalista tunnisteella: $reportId . 
                """.trimMargin()
            )
    }
}
