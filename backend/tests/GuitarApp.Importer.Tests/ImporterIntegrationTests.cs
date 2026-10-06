using GuitarApp.Domain.Reference;
using GuitarApp.Importer.Import;
using GuitarApp.Importer.Seed;
using Microsoft.EntityFrameworkCore;

namespace GuitarApp.Importer.Tests;

public class ImporterIntegrationTests : IClassFixture<PostgresFixture>
{
    private readonly PostgresFixture _postgres;

    public ImporterIntegrationTests(PostgresFixture postgres)
    {
        _postgres = postgres;
    }

    private async Task<ImportReport> ImportAsync(SeedData seed, bool dryRun = false)
    {
        await using var db = _postgres.NewContext();
        return await new SeedImporter(db).RunAsync(seed, new ImportOptions(dryRun));
    }

    private async Task MigrateFreshAsync()
    {
        Skip.If(_postgres.ConnectionString is null, _postgres.UnavailableReason);
        await using var db = _postgres.NewContext();
        await db.Database.EnsureDeletedAsync();
        await db.Database.MigrateAsync(); // uses the real migrations, so a missing/outdated migration fails here
    }

    [SkippableFact]
    public async Task First_import_creates_everything_and_second_import_changes_nothing()
    {
        await MigrateFreshAsync();
        var seed = SeedReader.Read(SeedFiles.Directory);

        var first = await ImportAsync(seed);
        first.Errors.Should().BeEmpty();
        first.Saved.Should().BeTrue();
        first.Sections["songs"].Created.Should().Be(20);
        first.Sections["artists"].Created.Should().Be(18);
        first.Sections["chords"].Created.Should().Be(638); // 496 from the CSV library + 142 only chords-db knows
        first.Sections["scales"].Created.Should().Be(2);
        first.Sections["scalePositions"].Created.Should().Be(10);
        first.Sections["musicConcepts"].Created.Should().Be(10);

        var second = await ImportAsync(seed);
        second.Errors.Should().BeEmpty();
        foreach (var (name, section) in second.Sections)
        {
            section.Created.Should().Be(0, $"{name} must not create anything on a re-run");
            section.Updated.Should().Be(0, $"{name} must not update anything on a re-run");
            section.Deleted.Should().Be(0, $"{name} must not delete anything on a re-run");
        }

        await using var db = _postgres.NewContext();
        (await db.Songs.CountAsync()).Should().Be(20);
        (await db.Artists.CountAsync()).Should().Be(18);
        (await db.Chords.CountAsync()).Should().Be(638);
        (await db.ScalePositionNotes.CountAsync()).Should().BeGreaterThan(40);
    }

    [SkippableFact]
    public async Task Library_voicings_are_stored_as_fingers_and_concept_shapes_add_real_frets()
    {
        await MigrateFreshAsync();
        await ImportAsync(SeedReader.Read(SeedFiles.Directory));

        await using var db = _postgres.NewContext();
        var gMajor = await db.Chords.Include(c => c.Voicings).SingleAsync(c => c.Root == "G" && c.Quality == "maj");

        // The library's very first G major entry is the open-G fingering 2,1,0,0,0,3 …
        var open = gMajor.Voicings.Single(v => v.Index == 0);
        open.Fingers.Should().Equal(2, 1, 0, 0, 0, 3);
        // … and the hand-authored "Open" shape supplied the real frets for it.
        open.Frets.Should().Equal(3, 2, 0, 0, 0, 3);
        open.IsPreferred.Should().BeTrue();

        // Everything else in the library has fingers but unknown frets.
        var library = await db.ChordVoicings.CountAsync(v => v.Frets == null);
        library.Should().BeGreaterThan(2000);
        (await db.ChordVoicings.CountAsync(v => v.Fingers == null && v.Frets == null)).Should().Be(0);
    }

    [SkippableFact]
    public async Task ChordsDb_voicings_are_imported_with_provenance_and_never_duplicate_a_chord_shape()
    {
        await MigrateFreshAsync();
        var seed = SeedReader.Read(SeedFiles.Directory);
        await ImportAsync(seed);

        await using var db = _postgres.NewContext();
        var chords = await db.Chords.Include(c => c.Voicings).ToListAsync();

        // Provenance: frets are always attributed, and only fingers-only rows lack a source.
        var voicings = chords.SelectMany(c => c.Voicings).ToList();
        voicings.Where(v => v.Frets is not null).Should().OnlyContain(v => v.FretsSource != null);
        voicings.Where(v => v.Frets is null).Should().OnlyContain(v => v.FretsSource == null);

        // No chord lists the same frets twice.
        foreach (var chord in chords)
        {
            var seen = chord.Voicings.Where(v => v.Frets is not null).Select(v => string.Join(',', v.Frets!)).ToList();
            seen.Should().OnlyHaveUniqueItems($"{chord.Root}{chord.Quality}");
        }

        // Every dataset voicing is present for every enharmonic spelling of its key.
        var byKey = chords.ToDictionary(c => (c.Root, c.Quality));
        foreach (var source in seed.ChordsDb!.Chords)
        foreach (var root in seed.ChordsDb.RootToKey.Where(kv => kv.Value == source.Key).Select(kv => kv.Key))
        foreach (var v in source.Voicings)
        {
            byKey[(root, source.Quality)].Voicings.Should().Contain(x => x.Frets != null && x.Frets.SequenceEqual(v.Frets), $"{root} {source.Quality} {string.Join(',', v.Frets)}");
        }

        // Hand-authored shapes keep their provenance even though chords-db has the very same frets (open C and open G).
        var cMajor = byKey[("C", "maj")].Voicings.Single(v => v.Frets != null && v.Frets.SequenceEqual(new[] { -1, 3, 2, 0, 1, 0 }));
        cMajor.FretsSource.Should().Be(FretsSources.Authored); // the hand-authored "Open" C shape has identical frets
        var gMajor = byKey[("G", "maj")].Voicings.Single(v => v.Frets != null && v.Frets.SequenceEqual(new[] { 3, 2, 0, 0, 0, 3 }));
        gMajor.FretsSource.Should().Be(FretsSources.Authored);
        (await db.ChordVoicings.CountAsync(v => v.FretsSource == FretsSources.ChordsDb)).Should().BeGreaterThan(1500);
    }

    [SkippableFact]
    public async Task Changed_seed_values_are_updated_not_duplicated()
    {
        await MigrateFreshAsync();
        var seed = SeedReader.Read(SeedFiles.Directory);
        await ImportAsync(seed);

        var changed = seed with
        {
            Songs = seed.Songs.Select(s => s.Slug == "song-blackbird" ? s with { Title = "Blackbird (edited)", Difficulty = 5 } : s).ToList(),
        };
        var report = await ImportAsync(changed);

        report.Sections["songs"].Updated.Should().Be(1);
        report.Sections["songs"].Created.Should().Be(0);
        await using var db = _postgres.NewContext();
        (await db.Songs.CountAsync()).Should().Be(20);
        (await db.Songs.SingleAsync(s => s.Slug == "song-blackbird")).Title.Should().Be("Blackbird (edited)");
    }

    [SkippableFact]
    public async Task Dry_run_and_invalid_seed_write_nothing()
    {
        await MigrateFreshAsync();
        var seed = SeedReader.Read(SeedFiles.Directory);

        var dry = await ImportAsync(seed, dryRun: true);
        dry.Saved.Should().BeFalse();
        dry.Sections["songs"].Created.Should().Be(20);

        var broken = seed with { Songs = seed.Songs.Append(seed.Songs[0] with { Slug = "song-bad", ArtistSlug = "no-such-artist" }).ToList() };
        var failed = await ImportAsync(broken);
        failed.Errors.Should().ContainSingle().Which.Should().Contain("no-such-artist");
        failed.Saved.Should().BeFalse();

        await using var db = _postgres.NewContext();
        (await db.Songs.CountAsync()).Should().Be(0);
        (await db.Chords.CountAsync()).Should().Be(0);
    }
}
