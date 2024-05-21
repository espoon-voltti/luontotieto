// SPDX-FileCopyrightText: 2017-2021 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.luontotieto.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Lazy
import org.springframework.core.env.Environment

@Configuration
@Lazy
class EnvConfig {
    @Bean fun bucketEnv(env: Environment): BucketEnv = BucketEnv.fromEnvironment(env)

    @Bean fun emailEnv(env: Environment): EmailEnv = EmailEnv.fromEnvironment(env)
}
