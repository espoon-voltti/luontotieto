FROM eclipse-temurin:17-jammy

COPY ./gradle/ ./gradle/
COPY ./gradlew ./build.gradle.kts
COPY . .
RUN ./gradlew build

ENTRYPOINT ["bash", "migrate.sh"]
