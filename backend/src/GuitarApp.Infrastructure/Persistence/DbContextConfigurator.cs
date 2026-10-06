using Microsoft.EntityFrameworkCore;

namespace GuitarApp.Infrastructure.Persistence;

/// <summary>One place that decides how the context talks to Postgres (shared by DI and tests).</summary>
public static class DbContextConfigurator
{
    public static DbContextOptionsBuilder Configure(DbContextOptionsBuilder options, string connectionString)
    {
        options.UseNpgsql(connectionString);
        options.UseSnakeCaseNamingConvention();
        return options;
    }
}
