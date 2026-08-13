FROM gradle:9.5.1-jdk21 AS build

WORKDIR /app
COPY . .
RUN ./gradlew clean bootJar --no-daemon

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /app/build/libs/wedit-server-0.0.1-SNAPSHOT.jar app.jar

CMD ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
