using GuitarApp.Importer.Seed;

namespace GuitarApp.Importer.Tests;

/// <summary>Checks the real seed files that ship with the repo against what the export script reported.</summary>
public class SeedReaderTests
{
    private static readonly SeedData Seed = SeedReader.Read(SeedFiles.Directory);

    [Fact]
    public void Record_counts_match_the_export_report()
    {
        Seed.Songs.Should().HaveCount(20);
        Seed.Artists.Should().HaveCount(18);
        Seed.Tunings.Should().HaveCount(1);
        Seed.Chords.Should().HaveCount(496);
        Seed.Chords.Sum(c => c.Voicings.Count).Should().Be(2554);
        Seed.Concepts.Should().HaveCount(10);
        Seed.Concepts.Sum(c => c.Shapes.Count).Should().Be(26);
    }

    [Fact]
    public void Every_song_refers_to_a_known_artist_and_tuning()
    {
        var artists = Seed.Artists.Select(a => a.Slug).ToHashSet();
        var tunings = Seed.Tunings.Select(t => t.Name).ToHashSet();
        foreach (var song in Seed.Songs)
        {
            artists.Should().Contain(song.ArtistSlug);
            if (song.Tuning is not null) tunings.Should().Contain(song.Tuning);
        }
    }

    [Fact]
    public void Slugs_are_unique()
    {
        Seed.Songs.Select(s => s.Slug).Should().OnlyHaveUniqueItems();
        Seed.Artists.Select(s => s.Slug).Should().OnlyHaveUniqueItems();
        Seed.Concepts.Select(s => s.Slug).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void Localized_text_keeps_all_five_languages()
    {
        var notes = Seed.Songs.First(s => s.Slug == "song-blackbird").PracticeNotes!;
        notes.En.Should().NotBeNullOrWhiteSpace();
        notes.Vi.Should().NotBeNullOrWhiteSpace();
        notes.Ja.Should().NotBeNullOrWhiteSpace();
        notes.Zh.Should().NotBeNullOrWhiteSpace();
        notes.Es.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Concept_shapes_json_is_kept_verbatim_as_an_array()
    {
        foreach (var concept in Seed.Concepts) concept.ShapesJson.Should().StartWith("[").And.EndWith("]");
    }

    [Fact]
    public void ChordsDb_seed_is_the_pinned_MIT_dataset()
    {
        var db = Seed.ChordsDb;
        db.Should().NotBeNull("seed/chord-voicings.json is produced by web/scripts/build-chord-voicings.mjs");
        db!.Source.Package.Should().Be("@tombatossals/chords-db");
        db.Source.License.Should().Be("MIT");
        db.Source.GuitarJsonSha256.Should().Be("23731147b3d070fa59b30e79570818a9689f126f76e77b04899d73934ba54d4e");
        db.Chords.Should().HaveCount(396);
        db.Chords.Sum(c => c.Voicings.Count).Should().Be(1575);
        db.RootToKey.Values.Distinct().Should().HaveCount(12);
        db.Chords.Select(c => c.Key).Distinct().Should().BeSubsetOf(db.RootToKey.Values);
    }

    [Fact]
    public void ChordsDb_voicings_are_well_formed()
    {
        foreach (var chord in Seed.ChordsDb!.Chords)
        foreach (var v in chord.Voicings)
        {
            var where = $"{chord.Key} {chord.Quality} {string.Join(',', v.Frets)}";
            v.Frets.Should().HaveCount(6, where);
            v.Fingers.Should().HaveCount(6, where);
            v.Frets.Should().OnlyContain(f => f >= -1 && f <= 24, where);
            v.Fingers.Should().OnlyContain(f => f >= -1 && f <= 4, where);
            for (var s = 0; s < 6; s++) (v.Frets[s] == -1).Should().Be(v.Fingers[s] == -1, $"{where}: muted strings must match");
            v.Frets.Any(f => f >= 0).Should().BeTrue(where);
        }
    }

    [Fact]
    public void ChordsDb_open_C_major_has_real_frets()
    {
        var c = Seed.ChordsDb!.Chords.Single(x => x.Key == "C" && x.Quality == "maj");
        c.Voicings.Should().Contain(v => v.Frets.SequenceEqual(new[] { -1, 3, 2, 0, 1, 0 }));
    }

    [Fact]
    public void Library_values_are_finger_numbers_only()
    {
        // Guards the finding in DECISIONS.md: if this ever fails, the dataset changed and the model must be revisited.
        var values = Seed.Chords.SelectMany(c => c.Voicings).SelectMany(v => v.Frets).Distinct().OrderBy(x => x);
        values.Should().Equal(-1, 0, 1, 2, 3, 4);
    }
}
