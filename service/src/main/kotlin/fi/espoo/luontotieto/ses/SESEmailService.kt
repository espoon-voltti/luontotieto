// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.ses

import fi.espoo.luontotieto.config.EmailEnv
import mu.KotlinLogging
import org.springframework.stereotype.Service
import software.amazon.awssdk.services.ses.SesClient
import software.amazon.awssdk.services.ses.model.AccountSendingPausedException
import software.amazon.awssdk.services.ses.model.Body
import software.amazon.awssdk.services.ses.model.ConfigurationSetDoesNotExistException
import software.amazon.awssdk.services.ses.model.ConfigurationSetSendingPausedException
import software.amazon.awssdk.services.ses.model.Content
import software.amazon.awssdk.services.ses.model.Destination
import software.amazon.awssdk.services.ses.model.MailFromDomainNotVerifiedException
import software.amazon.awssdk.services.ses.model.Message
import software.amazon.awssdk.services.ses.model.SendEmailRequest

private val logger = KotlinLogging.logger {}

data class Email(
    val toAddress: String,
    val title: String,
    val content: String,
)

@Service
class SESEmailClient(
    private val client: SesClient,
    private val env: EmailEnv
) {
    private val charset = "UTF-8"

    fun send(email: Email) {
        if (!env.enabled)
            {
                logger.info { "Sending email $email.content" }
                return
            }
        val fromAddress = env.senderAddress
        val arn = env.senderArn
        val title = "Luontotietoportaali: ${email.title}"
        val content = email.content
        val toAddress = email.toAddress

        val html =
            """
<!DOCTYPE html>
<html>
<head>
<title>Luontotietoportaali: $title</title>
</head>
<body>
$content
</body>
</html>
"""
        logger.info { "Sending email" }
        try {
            val request =
                SendEmailRequest.builder()
                    .destination(Destination.builder().toAddresses(toAddress).build())
                    .sourceArn(arn)
                    .message(
                        Message.builder()
                            .body(
                                Body.builder()
                                    .html(Content.builder().charset(charset).data(html).build())
                                    .text(
                                        Content.builder()
                                            .charset(charset)
                                            .data(content)
                                            .build()
                                    )
                                    .build()
                            )
                            .subject(
                                Content.builder()
                                    .charset(charset)
                                    .data(title)
                                    .build()
                            )
                            .build()
                    )
                    .source(fromAddress)
                    .build()

            client.sendEmail(request)
            logger.info { "Email sent" }
        } catch (e: Exception) {
            when (e) {
                is MailFromDomainNotVerifiedException,
                is ConfigurationSetDoesNotExistException,
                is ConfigurationSetSendingPausedException,
                is AccountSendingPausedException ->
                    logger.error(e) { "Will not send email : ${e.message}" }
                else -> {
                    logger.error(e) { "Couldn't send email : ${e.message}" }
                    throw e
                }
            }
        }
    }
}
