using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Music;

public sealed class Album : Entity
{
    private Album() { }

    public Guid ArtistId { get; private set; }
    public Artist? Artist { get; private set; }
    public string Title { get; private set; } = null!;
    public int? Year { get; private set; }

    public static Album Create(Guid artistId, string title, int? year = null) => new()
    {
        ArtistId = Guard.NotEmpty(artistId, "Artist"),
        Title = Guard.NotBlank(title, "Album title", 200),
        Year = Guard.InRangeOrNull(year, 1900, 2100, "Album year"),
    };
}
