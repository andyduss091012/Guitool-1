using GuitarApp.Infrastructure.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace GuitarApp.Api.Infrastructure;

public sealed class DatabaseHealthCheck : IHealthCheck
{
    private readonly GuitarAppDbContext _db;

    public DatabaseHealthCheck(GuitarAppDbContext db)
    {
        _db = db;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _db.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy("Postgres reachable")
                : HealthCheckResult.Unhealthy("Postgres not reachable");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Postgres check failed", ex);
        }
    }
}
