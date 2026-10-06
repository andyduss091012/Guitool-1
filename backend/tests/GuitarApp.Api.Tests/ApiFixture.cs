using GuitarApp.Domain.Common;
using GuitarApp.Domain.Music;
using GuitarApp.Domain.Reference;
using GuitarApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Testcontainers.PostgreSql;

namespace GuitarApp.Api.Tests;

/// <summary>
/// Starts a throw-away Postgres, applies the real migrations, loads a small known data set through the domain
/// factories and hosts the real API against it. If Docker is not available the tests are skipped, not failed.
/// </summary>
public sealed class ApiFixture : IAsyncLifetime
{
    private const string ConnectionStringVariable = "ConnectionStrings__Postgres";

    private PostgreSqlContainer? _container;
    private WebApplicationFactory<Program>? _factory;
    private string? _previousConnectionString;

    public string? UnavailableReason { get; private set; }
    public Guid GMajorId { get; private set; }

    public HttpClient CreateClient() => _factory!.CreateClient();

    public async Task InitializeAsync()
    {
        try
        {
            _container = new PostgreSqlBuilder().WithImage("postgres:17").WithDatabase("guitarapp_api_test").Build();
            await _container.StartAsync();
            var connectionString = _container.GetConnectionString();

            var options = new DbContextOptionsBuilder<GuitarAppDbContext>();
            DbContextConfigurator.Configure(options, connectionString);
            await using (var db = new GuitarAppDbContext(options.Options))
            {
                await db.Database.MigrateAsync();
                GMajorId = await SeedAsync(db);
            }

            // Program reads the connection string while it builds the host, so an environment variable is the reliable way to supply it.
            _previousConnectionString = Environment.GetEnvironmentVariable(ConnectionStringVariable);
            Environment.SetEnvironmentVariable(ConnectionStringVariable, connectionString);
            _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.UseEnvironment("Testing"));
        }
        catch (Exception ex)
        {
            UnavailableReason = $"Docker/Postgres container not available: {ex.Message}";
        }
    }

    public async Task DisposeAsync()
    {
        if (_factory is not null) await _factory.DisposeAsync();
        Environment.SetEnvironmentVariable(ConnectionStringVariable, _previousConnectionString);
        if (_container is not null) await _container.DisposeAsync();
    }

    /// <summary>Small, fixed data set the tests assert against. Returns the id of the G major chord.</summary>
    private static async Task<Guid> SeedAsync(GuitarAppDbContext db)
    {
        var beatles = Artist.Create("The Beatles", "the-beatles");
        var metallica = Artist.Create("Metallica", "metallica");
        var standard = Tuning.Create("Standard (EADGBE)", "E A D G B E");
        db.AddRange(beatles, metallica, standard);

        db.Songs.AddRange(
            Song.Create("song-blackbird", "Blackbird", beatles.Id, "Folk", 3, standard.Id, null, null, "G", null, null, null,
                new LocalizedText { En = "Fingerstyle picking pattern.", Vi = "Mẫu gảy ngón." }, new[] { "fingerstyle", "1960s" }),
            Song.Create("song-let-it-be", "Let It Be", beatles.Id, "Pop", 2, standard.Id, null, null, "C", null, null, null,
                new LocalizedText { En = "Four open chords." }, new[] { "beginner" }),
            Song.Create("song-one", "One", metallica.Id, "Metal", 4, null, null, null, null, null, null, null,
                new LocalizedText { En = "Dotted rhythms." }, new[] { "metal" }));

        var gMajor = Chord.Create("G", "maj", "Major");
        gMajor.AddVoicing(null, new[] { 2, 1, 0, 0, 0, 3 }); // finger-only legacy voicing
        gMajor.AddVoicing(new[] { 3, 2, 0, 0, 0, 3 }, new[] { 2, 1, 0, 0, 0, 3 }, true, "Open", FretsSources.Authored);
        var cMajor = Chord.Create("C", "maj", "Major");
        cMajor.AddVoicing(new[] { -1, 3, 2, 0, 1, 0 }, new[] { -1, 3, 2, 0, 1, 0 }, false, null, FretsSources.ChordsDb);
        var fingersOnly = Chord.Create("A#", "m7", "Minor 7th");
        fingersOnly.AddVoicing(null, new[] { -1, 1, 3, 1, 2, 1 });
        db.Chords.AddRange(gMajor, cMajor, fingersOnly);

        var scale = Scale.Create("scale-minor-pentatonic", new LocalizedText { En = "Minor pentatonic" }, "pentatonic", new[] { "1", "b3", "4", "5", "b7" }, new LocalizedText { En = "Five-note scale." });
        var position = scale.AddPosition("Position 1", 5, 4);
        position.AddNote(6, 7, "4", false, 3);
        position.AddNote(1, 5, "1", true, 1);
        scale.AddPosition("Position 2", 7, 4).AddNote(1, 8, "b3", false, 1);
        db.Scales.Add(scale);

        db.MusicConcepts.AddRange(
            MusicConcept.Create("chord-open-g-major", MusicConcept.ChordKind, "open", new LocalizedText { En = "G major (open)" }, new LocalizedText { En = "Open G." }, "[{\"id\":\"open\",\"label\":\"Open\"}]", new[] { "G" }),
            MusicConcept.Create("scale-minor-pentatonic", MusicConcept.ScaleKind, "pentatonic", new LocalizedText { En = "Minor pentatonic" }, new LocalizedText { En = "Scale." }, "[]", Array.Empty<string>()));

        await db.SaveChangesAsync();
        return gMajor.Id;
    }
}
