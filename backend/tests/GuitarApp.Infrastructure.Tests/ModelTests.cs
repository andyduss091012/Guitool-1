using GuitarApp.Domain.Music;
using GuitarApp.Domain.Reference;
using GuitarApp.Infrastructure.Persistence;
using GuitarApp.Infrastructure.Persistence.Converters;
using GuitarApp.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace GuitarApp.Infrastructure.Tests;

/// <summary>Offline checks: the EF model is built without ever opening a database connection.</summary>
public class ModelTests
{
    private static GuitarAppDbContext NewContext()
    {
        var builder = new DbContextOptionsBuilder<GuitarAppDbContext>();
        DbContextConfigurator.Configure(builder, DependencyInjection.PlaceholderConnectionString);
        return new GuitarAppDbContext(builder.Options);
    }

    [Theory]
    [InlineData(typeof(Artist), "artists")]
    [InlineData(typeof(Song), "songs")]
    [InlineData(typeof(Tuning), "tunings")]
    [InlineData(typeof(Chord), "chords")]
    [InlineData(typeof(ChordVoicing), "chord_voicings")]
    [InlineData(typeof(ScalePositionNote), "scale_position_notes")]
    public void Entities_map_to_snake_case_tables(Type entity, string table)
    {
        using var db = NewContext();
        db.Model.FindEntityType(entity)!.GetTableName().Should().Be(table);
    }

    [Fact]
    public void Columns_use_snake_case()
    {
        using var db = NewContext();
        var song = db.Model.FindEntityType(typeof(Song))!;
        song.FindProperty(nameof(Song.DurationSeconds))!.GetColumnName().Should().Be("duration_seconds");
        song.FindProperty(nameof(Song.CreatedAt))!.GetColumnName().Should().Be("created_at");
    }

    [Fact]
    public void Slug_and_natural_keys_are_unique_indexes()
    {
        using var db = NewContext();
        HasUniqueIndex(db, typeof(Song), nameof(Song.Slug)).Should().BeTrue();
        HasUniqueIndex(db, typeof(Artist), nameof(Artist.Slug)).Should().BeTrue();
        HasUniqueIndex(db, typeof(Chord), nameof(Chord.Root), nameof(Chord.Quality)).Should().BeTrue();
        HasUniqueIndex(db, typeof(ChordVoicing), nameof(ChordVoicing.ChordId), nameof(ChordVoicing.Index)).Should().BeTrue();
    }

    [Fact]
    public void Localized_text_columns_are_jsonb()
    {
        using var db = NewContext();
        db.Model.FindEntityType(typeof(Scale))!.FindProperty(nameof(Scale.Name))!.GetColumnType().Should().Be("jsonb");
        db.Model.FindEntityType(typeof(Song))!.FindProperty(nameof(Song.Description))!.GetColumnType().Should().Be("jsonb");
    }

    [Fact]
    public void Music_concepts_table_exists_with_jsonb_shapes()
    {
        using var db = NewContext();
        var concept = db.Model.FindEntityType(typeof(MusicConcept))!;
        concept.GetTableName().Should().Be("music_concepts");
        concept.FindProperty(nameof(MusicConcept.ShapesJson))!.GetColumnType().Should().Be("jsonb");
        HasUniqueIndex(db, typeof(MusicConcept), nameof(MusicConcept.Slug)).Should().BeTrue();
    }

    [Fact]
    public void Chord_voicing_frets_and_fingers_are_optional_columns()
    {
        using var db = NewContext();
        var voicing = db.Model.FindEntityType(typeof(ChordVoicing))!;
        voicing.FindProperty(nameof(ChordVoicing.Frets))!.IsNullable.Should().BeTrue();
        voicing.FindProperty(nameof(ChordVoicing.Fingers))!.IsNullable.Should().BeTrue();
    }

    [Fact]
    public void Arrays_use_native_postgres_array_types()
    {
        using var db = NewContext();
        db.Model.FindEntityType(typeof(Song))!.FindProperty(nameof(Song.Tags))!.GetColumnType().Should().Be("text[]");
        db.Model.FindEntityType(typeof(ChordVoicing))!.FindProperty(nameof(ChordVoicing.Frets))!.GetColumnType().Should().Be("integer[]");
    }

    [Fact]
    public void LocalizedText_converter_round_trips_and_omits_missing_languages()
    {
        var original = new LocalizedText { En = "Hello", Vi = "Xin chào", Ja = "こんにちは" };
        var json = LocalizedTextConverter.ToJson(original);
        json.Should().Contain("\"en\":\"Hello\"").And.NotContain("\"zh\"");
        LocalizedTextConverter.FromJson(json).Should().Be(original);
    }

    private static bool HasUniqueIndex(DbContext db, Type entity, params string[] properties) =>
        db.Model.FindEntityType(entity)!.GetIndexes()
            .Any(i => i.IsUnique && i.Properties.Select(p => p.Name).SequenceEqual(properties));
}
