using GuitarApp.Application.Catalog;
using GuitarApp.Application.Reference;
using GuitarApp.Infrastructure.Persistence;
using GuitarApp.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GuitarApp.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Used only when no connection string is configured, so the app (and tests) can start without a database.</summary>
    public const string PlaceholderConnectionString = "Host=localhost;Port=5432;Database=guitarapp;Username=guitarapp;Password=not-configured";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");
        if (string.IsNullOrWhiteSpace(connectionString)) connectionString = PlaceholderConnectionString;

        services.AddSingleton<TimestampInterceptor>();
        services.AddDbContext<GuitarAppDbContext>((sp, options) =>
        {
            DbContextConfigurator.Configure(options, connectionString);
            options.AddInterceptors(sp.GetRequiredService<TimestampInterceptor>());
        });
        services.AddScoped<ICatalogQueries, CatalogQueries>();
        services.AddScoped<IReferenceQueries, ReferenceQueries>();
        return services;
    }
}
