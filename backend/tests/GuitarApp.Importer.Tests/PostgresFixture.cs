using GuitarApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace GuitarApp.Importer.Tests;

/// <summary>One throw-away Postgres container per test class. If Docker is not available the tests are skipped, not failed.</summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private PostgreSqlContainer? _container;

    public string? ConnectionString { get; private set; }
    public string? UnavailableReason { get; private set; }

    public async Task InitializeAsync()
    {
        try
        {
            _container = new PostgreSqlBuilder().WithImage("postgres:17").WithDatabase("guitarapp_test").Build();
            await _container.StartAsync();
            ConnectionString = _container.GetConnectionString();
        }
        catch (Exception ex)
        {
            UnavailableReason = $"Docker/Postgres container not available: {ex.Message}";
        }
    }

    public async Task DisposeAsync()
    {
        if (_container is not null) await _container.DisposeAsync();
    }

    public GuitarAppDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<GuitarAppDbContext>();
        DbContextConfigurator.Configure(options, ConnectionString!);
        return new GuitarAppDbContext(options.Options);
    }
}
