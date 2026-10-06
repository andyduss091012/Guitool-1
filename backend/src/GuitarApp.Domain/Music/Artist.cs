using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Music;

public sealed class Artist : Entity
{
    private readonly List<Song> _songs = new();

    private Artist() { }

    public string Name { get; private set; } = null!;
    public string Slug { get; private set; } = null!;
    /// <summary>Blob key of an optional image (Phase 2+); never a URL.</summary>
    public string? ImageKey { get; private set; }
    public IReadOnlyCollection<Song> Songs => _songs;

    public static Artist Create(string name, string slug, string? imageKey = null)
    {
        var artist = new Artist { Slug = Guard.Slug(slug, "Artist slug") };
        artist.Update(name, imageKey);
        return artist;
    }

    public void Update(string name, string? imageKey = null)
    {
        Name = Guard.NotBlank(name, "Artist name", 200);
        ImageKey = Guard.OptionalText(imageKey, "Artist image key", 300);
    }
}
