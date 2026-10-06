# Builds the API image. Build context is the backend/ folder (see ../docker-compose.yml).
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (separate layer, cached until a .csproj changes). nuget.config pins nuget.org only.
COPY Directory.Build.props nuget.config ./
COPY src/GuitarApp.Domain/GuitarApp.Domain.csproj src/GuitarApp.Domain/
COPY src/GuitarApp.Application/GuitarApp.Application.csproj src/GuitarApp.Application/
COPY src/GuitarApp.Infrastructure/GuitarApp.Infrastructure.csproj src/GuitarApp.Infrastructure/
COPY src/GuitarApp.Api/GuitarApp.Api.csproj src/GuitarApp.Api/
RUN dotnet restore src/GuitarApp.Api/GuitarApp.Api.csproj

COPY src/ src/
RUN dotnet publish src/GuitarApp.Api/GuitarApp.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "GuitarApp.Api.dll"]
