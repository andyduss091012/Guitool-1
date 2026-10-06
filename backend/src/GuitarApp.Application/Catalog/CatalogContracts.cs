using GuitarApp.Application.Common;
using GuitarApp.Domain.Common;

namespace GuitarApp.Application.Catalog;

/// <summary>A song as the API serves it. <see cref="Id"/> is the stable slug (e.g. "song-blackbird") the web app already uses.</summary>
public sealed record SongDto(
    string Id,
    string Title,
    string Artist,
    string ArtistSlug,
    string Genre,
    int Difficulty,
    string? Tuning,
    int? Capo,
    string? KeySignature,
    LocalizedText? PracticeNotes,
    IReadOnlyList<string> Tags);

public sealed record ArtistDto(string Slug, string Name, int SongCount);

public sealed record TuningDto(string Name, string Notes);

/// <summary>All filters are optional and combine with AND. Text search matches song title or artist name, case-insensitively.</summary>
public sealed record SongQuery(string? Search = null, string? ArtistSlug = null, string? Genre = null, int? MinDifficulty = null, int? MaxDifficulty = null, string? Tag = null);

public interface ICatalogQueries
{
    Task<PagedResult<SongDto>> ListSongsAsync(SongQuery query, PageRequest page, CancellationToken ct = default);
    Task<SongDto?> GetSongAsync(string slug, CancellationToken ct = default);
    Task<PagedResult<ArtistDto>> ListArtistsAsync(string? search, PageRequest page, CancellationToken ct = default);
    Task<IReadOnlyList<TuningDto>> ListTuningsAsync(CancellationToken ct = default);
}
