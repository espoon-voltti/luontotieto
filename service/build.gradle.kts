// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar

plugins {
    id("org.springframework.boot") version "3.5.4"
    id("io.spring.dependency-management") version "1.1.5"
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.spring") version "2.1.20"
    id("org.flywaydb.flyway") version "11.1.0"
    id("org.jlleitschuh.gradle.ktlint") version "12.3.0"
    id("org.owasp.dependencycheck") version "12.1.1"

    idea
}

java { sourceCompatibility = JavaVersion.VERSION_21 }

repositories {
    maven { url = uri("https://repo.osgeo.org/repository/release/") }
    mavenCentral()
}

sourceSets {
    register("e2eTest") {
        compileClasspath += main.get().output + test.get().output
        runtimeClasspath += main.get().output + test.get().output
    }
}

val e2eTestImplementation: Configuration by configurations.getting { extendsFrom(configurations.testImplementation.get()) }

configurations["e2eTestRuntimeOnly"].extendsFrom(configurations.testRuntimeOnly.get())

idea { module { testSources = testSources + sourceSets["e2eTest"].kotlin.sourceDirectories } }

ktlint {
    version.set("1.4.1")
}

dependencies {
    api(kotlin("stdlib"))
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // cve fixes
    api("org.yaml:snakeyaml:2.4")
    api("org.xerial:sqlite-jdbc:3.50.3.0")
    api("commons-jxpath:commons-jxpath:1.4.0")
    api("org.eclipse.emf:org.eclipse.emf.ecore.xmi:2.39.0")

    api("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-data-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")
    implementation("org.springframework.ws:spring-ws-security") {
        exclude("org.opensaml")
    }

    implementation("org.apache.httpcomponents:httpclient:4.5.13")

    implementation("org.geotools:gt-geopkg:33.1")
    implementation("org.geotools:gt-epsg-hsql:33.1")

    implementation("com.zaxxer:HikariCP:6.3.0")
    implementation("org.flywaydb:flyway-core:11.9.2")
    implementation("org.flywaydb:flyway-database-postgresql:11.9.2")
    implementation("org.postgresql:postgresql:42.7.3")
    api(platform("org.jdbi:jdbi3-bom:3.49.0"))
    implementation("org.jdbi:jdbi3-core")
    implementation("org.jdbi:jdbi3-jackson2")
    implementation("org.jdbi:jdbi3-kotlin")
    implementation("org.jdbi:jdbi3-postgres")

    implementation("com.github.kittinunf.fuel:fuel:2.3.1")
    implementation("com.github.kittinunf.fuel:fuel-jackson:2.3.1")

    api(platform("com.fasterxml.jackson:jackson-bom:2.19.0"))
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    implementation("software.amazon.awssdk:s3:2.31.36")
    implementation("software.amazon.awssdk:ses:2.31.40")

    implementation("org.apache.tika:tika-core:3.2.0")

    implementation("com.auth0:java-jwt:4.5.0")

    implementation("net.logstash.logback:logstash-logback-encoder:8.1")
    implementation("ch.qos.logback:logback-access:1.5.12")
    implementation("io.github.microutils:kotlin-logging-jvm:3.0.5")

    testImplementation(kotlin("test"))
    testImplementation(kotlin("test-junit5"))
    api(platform("org.junit:junit-bom:5.12.2"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("com.microsoft.playwright:playwright:1.52.0")

    implementation("org.bouncycastle:bcprov-jdk18on:1.80")

    api("org.jsoup:jsoup:1.20.1")

    implementation("org.unbescape:unbescape:1.1.6.RELEASE")

    implementation("com.squareup.okhttp3:okhttp:4.12.0")
}

tasks.withType<KotlinCompile> {
    compilerOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = JvmTarget.JVM_21
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    testClassesDirs = sourceSets["test"].output.classesDirs
    classpath = sourceSets["test"].runtimeClasspath
    outputs.upToDateWhen { false }
}

tasks.getByName<Jar>("jar") { archiveClassifier.set("") }

tasks.getByName<BootJar>("bootJar") { archiveClassifier.set("boot") }

tasks.register("resolveDependencies") {
    description = "Resolves all dependencies"
    doLast {
        configurations
            .matching { it.isCanBeResolved }
            .map {
                val files = it.resolve()
                it.name to files.size
            }.groupBy({ (_, count) -> count }) { (name, _) -> name }
            .forEach { (count, names) ->
                println(
                    "Resolved $count dependency files for configurations: ${names.joinToString(", ")}"
                )
            }
    }
}

tasks {
    bootRun { systemProperty("spring.profiles.active", "local") }

    register("e2eTestDeps", JavaExec::class) {
        group = "build"
        classpath = sourceSets["e2eTest"].runtimeClasspath
        mainClass = "com.microsoft.playwright.CLI"
        args("install-deps")
    }

    register("e2eTest", Test::class) {
        systemProperty("spring.profiles.active", "e2etest")
        useJUnitPlatform()
        group = "verification"
        testClassesDirs = sourceSets["e2eTest"].output.classesDirs
        classpath = sourceSets["e2eTest"].runtimeClasspath
        shouldRunAfter("test")
        outputs.upToDateWhen { false }
    }

    dependencyCheck {
        failBuildOnCVSS = 0.0f
        analyzers.apply {
            assemblyEnabled = false
            nodeAuditEnabled = false
            nodeEnabled = false
            nuspecEnabled = false
        }
        nvd.apply { apiKey = System.getenv("NVD_API_KEY") }
        suppressionFile = "$projectDir/owasp-suppressions.xml"
    }
}
