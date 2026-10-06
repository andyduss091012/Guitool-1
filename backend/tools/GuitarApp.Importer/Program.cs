using GuitarApp.Importer.Import;
using GuitarApp.Importer.Seed;
using GuitarApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

// Usage (from the backend folder):
//   dotnet run --project tools/GuitarApp.Importer                   import the seed into the local database
//   dotnet run --project tools/GuitarApp.Importer -- --dry-run      validate + report, write nothing
//   options: --seed <dir>  --connection "<npgsql connection string>"  --report <file>
// Connection string order: --connection, env ConnectionStrings__Postgres, appsettings.Development.json of the API project.

var arguments = Cli.Parse(args);
if (arguments.ShowHelp)
{
    Console.WriteLine("GuitarApp.Importer [--dry-run] [--seed <dir>] [--connection <string>] [--report <file>]");
    return 0;
}

try
{
    var seedDirectory = arguments.SeedDirectory ?? Cli.DefaultSeedDirectory();
    var connectionString = arguments.Connection ?? Cli.ResolveConnectionString();
    var reportPath = arguments.ReportPath ?? Path.Combine(Directory.GetCurrentDirectory(), "import-report.json");

    Console.WriteLine($"Seed folder : {seedDirectory}");
    Console.WriteLine($"Mode        : {(arguments.DryRun ? "dry run (nothing is written)" : "import")}");

    var seed = SeedReader.Read(seedDirectory);

    var dbOptions = new DbContextOptionsBuilder<GuitarAppDbContext>();
    DbContextConfigurator.Configure(dbOptions, connectionString);
    await using var db = new GuitarAppDbContext(dbOptions.Options);

    if (!await db.Database.CanConnectAsync())
    {
        Console.Error.WriteLine("Cannot connect to Postgres. Is `docker compose up -d` running, and is the connection string right?");
        return 2;
    }
    var pending = (await db.Database.GetPendingMigrationsAsync()).ToList();
    if (pending.Count > 0)
    {
        Console.Error.WriteLine($"The database has {pending.Count} pending migration(s) ({string.Join(", ", pending)}).");
        Console.Error.WriteLine("Run: dotnet ef database update -p src/GuitarApp.Infrastructure -s src/GuitarApp.Api");
        return 2;
    }

    var report = await new SeedImporter(db).RunAsync(seed, new ImportOptions(arguments.DryRun));
    report.SeedDirectory = seedDirectory;
    await File.WriteAllTextAsync(reportPath, report.ToJson());

    foreach (var (name, s) in report.Sections.OrderBy(x => x.Key))
        Console.WriteLine($"  {name,-15} seeded {s.Seeded,5}   created {s.Created,5}   updated {s.Updated,5}   deleted {s.Deleted,3}   unchanged {s.Unchanged,5}");
    foreach (var w in report.Warnings) Console.WriteLine($"  warning: {w}");
    foreach (var e in report.Errors) Console.Error.WriteLine($"  ERROR: {e}");
    Console.WriteLine(report.Errors.Count > 0
        ? "Import FAILED — nothing was saved. See the report for details."
        : report.DryRun ? "Dry run OK — nothing was saved." : "Import OK.");
    Console.WriteLine($"Report      : {reportPath}");
    return report.Errors.Count > 0 ? 1 : 0;
}
catch (Exception ex) when (ex is IOException or InvalidDataException or InvalidOperationException)
{
    Console.Error.WriteLine($"Import aborted: {ex.Message}");
    return 2;
}

internal sealed record CliArguments(bool DryRun, string? SeedDirectory, string? Connection, string? ReportPath, bool ShowHelp);

internal static class Cli
{
    public static CliArguments Parse(string[] args)
    {
        bool dry = false, help = false;
        string? seed = null, connection = null, report = null;
        for (var i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--dry-run": dry = true; break;
                case "--help" or "-h": help = true; break;
                case "--seed": seed = Next(args, ref i); break;
                case "--connection": connection = Next(args, ref i); break;
                case "--report": report = Next(args, ref i); break;
                default: throw new InvalidOperationException($"Unknown argument '{args[i]}'. Use --help.");
            }
        }
        return new CliArguments(dry, seed, connection, report, help);
    }

    private static string Next(string[] args, ref int i) =>
        i + 1 < args.Length ? args[++i] : throw new InvalidOperationException($"{args[i]} needs a value.");

    public static string DefaultSeedDirectory()
    {
        var beside = Path.Combine(AppContext.BaseDirectory, "seed");
        return Directory.Exists(beside) ? beside : Path.Combine(Directory.GetCurrentDirectory(), "seed");
    }

    public static string ResolveConnectionString()
    {
        var config = new ConfigurationBuilder();
        var devSettings = FindUpwards("src/GuitarApp.Api/appsettings.Development.json")
                          ?? FindUpwards("backend/src/GuitarApp.Api/appsettings.Development.json");
        if (devSettings is not null) config.AddJsonFile(devSettings, optional: true);
        config.AddEnvironmentVariables(); // ConnectionStrings__Postgres wins over the file

        var value = config.Build().GetConnectionString("Postgres");
        return !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException(
                "No connection string. Pass --connection, set ConnectionStrings__Postgres, or create src/GuitarApp.Api/appsettings.Development.json.");
    }

    private static string? FindUpwards(string relativePath)
    {
        foreach (var start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            for (var dir = new DirectoryInfo(start); dir is not null; dir = dir.Parent)
            {
                var candidate = Path.Combine(dir.FullName, relativePath);
                if (File.Exists(candidate)) return candidate;
            }
        }
        return null;
    }
}
