// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar

plugins {
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.flyway)
    alias(libs.plugins.ktlint.gradle)
    alias(libs.plugins.owasp)

    idea
}

java { sourceCompatibility = JavaVersion.VERSION_25 }

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
    api(libs.snakeyaml)
    api(libs.sqlite.jdbc)
    api(libs.commons.jxpath)
    api(libs.eclipse.emf.ecore.xmi)

    api("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-data-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")
    implementation("org.springframework.ws:spring-ws-security") {
        exclude("org.opensaml")
    }

    implementation(libs.httpclient)

    implementation(libs.geotools.geopkg)
    implementation(libs.geotools.epsg.hsql)

    implementation(libs.hikaricp)
    implementation(libs.flyway.core)
    implementation(libs.flyway.database.postgresql)
    implementation(libs.postgresql)
    api(platform(libs.jdbi.bom))
    implementation("org.jdbi:jdbi3-core")
    implementation("org.jdbi:jdbi3-jackson2")
    implementation("org.jdbi:jdbi3-kotlin")
    implementation("org.jdbi:jdbi3-postgres")

    implementation(libs.fuel)
    implementation(libs.fuel.jackson)

    api(platform(libs.jackson.bom))
    implementation("com.fasterxml.jackson.core:jackson-core")
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    api(platform(libs.aws.bom))
    implementation("software.amazon.awssdk:s3")
    implementation("software.amazon.awssdk:ses")

    implementation(libs.tika.core)

    implementation(libs.java.jwt)

    implementation(libs.logstash.logback.encoder)
    implementation(libs.logback.access)
    implementation(libs.kotlin.logging)

    testImplementation(kotlin("test"))
    testImplementation(kotlin("test-junit5"))
    api(platform(libs.junit.bom))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation(libs.playwright)

    implementation(libs.bouncycastle.bcprov)

    api(libs.jsoup)

    implementation(libs.unbescape)

    implementation(libs.okhttp)

    implementation(libs.commons.lang3)
}

tasks.withType<KotlinCompile> {
    compilerOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = JvmTarget.JVM_25
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
            centralEnabled = false
            nodeAuditEnabled = false
            nodeEnabled = false
            nuspecEnabled = false
            ossIndex.apply {
                username = System.getenv("OSS_INDEX_USERNAME")
                password = System.getenv("OSS_INDEX_PASSWORD")
            }
        }
        nvd.apply { apiKey = System.getenv("NVD_API_KEY") }
        suppressionFile = "$projectDir/owasp-suppressions.xml"
    }
}
