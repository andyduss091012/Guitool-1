using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Music;

public sealed class Song : Entity
{
    private Song() { }

    /// <summary>Stable public id, e.g. "song-blackbird". Users' saved progress refers to it.</summary>
    public string Slug { get; private set; } = null!;
    public string Title { get; private set; } = null!;
    public Guid ArtistId { get; private set; }
    public Artist? Artist { get; private set; }
    public Guid? AlbumId { get; private set; }
    public Album? Album { get; private set; }
    public Guid? TuningId { get; private set; }
    public Tuning? Tuning { get; private set; }
    /// <summary>Free-text genre (the app's enum values, e.g. "Rock", "Classical / Fingerstyle").</summary>
    public string Genre { get; private set; } = null!;
    /// <summary>1 (easiest) … 5 (hardest).</summary>
    public int Difficulty { get; private set; }
    public int? Capo { get; private set; }
    public string? Key { get; private set; }
    public int? Bpm { get; private set; }
    public int? Year { get; private set; }
    public int? DurationSeconds { get; private set; }
    public LocalizedText? Description { get; private set; }
    public string? ThumbnailKey { get; private set; }
    public string[] Tags { get; private set; } = Array.Empty<string>();

    public static Song Create(
        string slug,
        string title,
        Guid artistId,
        string genre,
        int difficulty,
        Guid? tuningId = null,
        Guid? albumId = null,
        int? capo = null,
        string? key = null,
        int? bpm = null,
        int? year = null,
        int? durationSeconds = null,
        LocalizedText? description = null,
        IEnumerable<string>? tags = null)
    {
        var song = new Song { Slug = Guard.Slug(slug, "Song slug") };
        song.Update(title, artistId, genre, difficulty, tuningId, albumId, capo, key, bpm, year, durationSeconds, description, tags);
        return song;
    }

    /// <summary>Overwrites everything except the slug (the slug is the stable public id).</summary>
    public void Update(
        string title,
        Guid artistId,
        string genre,
        int difficulty,
        Guid? tuningId = null,
        Guid? albumId = null,
        int? capo = null,
        string? key = null,
        int? bpm = null,
        int? year = null,
        int? durationSeconds = null,
        LocalizedText? description = null,
        IEnumerable<string>? tags = null)
    {
        Title = Guard.NotBlank(title, "Song title", 200);
        ArtistId = Guard.NotEmpty(artistId, "Artist");
        Genre = Guard.NotBlank(genre, "Genre", 60);
        Difficulty = Guard.InRange(difficulty, 1, 5, "Difficulty");
        TuningId = tuningId;
        AlbumId = albumId;
        Capo = Guard.InRangeOrNull(capo, 0, 12, "Capo");
        Key = Guard.OptionalText(key, "Key", 30);
        Bpm = Guard.InRangeOrNull(bpm, 20, 400, "BPM");
        Year = Guard.InRangeOrNull(year, 1900, 2100, "Year");
        DurationSeconds = Guard.InRangeOrNull(durationSeconds, 1, 7200, "Duration (seconds)");
        Description = description;
        Tags = NormalizeTags(tags);
    }

    private static string[] NormalizeTags(IEnumerable<string>? tags) =>
        (tags ?? Array.Empty<string>())
            .Select(t => t?.Trim() ?? string.Empty)
            .Where(t => t.Length > 0)
            .Select(t => t.Length > 60 ? throw new DomainException("A tag must be at most 60 characters.") : t)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
}
