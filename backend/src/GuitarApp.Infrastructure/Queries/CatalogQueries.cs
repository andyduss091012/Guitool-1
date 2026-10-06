using GuitarApp.Application.Catalog;
using GuitarApp.Application.Common;
using GuitarApp.Domain.Common;
using GuitarApp.Domain.Music;
using GuitarApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GuitarApp.Infrastructure.Queries;

internal sealed record SongRow(
    string Slug, string Title, string ArtistName, string ArtistSlug, string Genre, int Difficulty,
    string? Tuning, int? Capo, string? Key, LocalizedText? Description, string[] Tags);

/// <summary>Read-only catalog queries. Everything is AsNoTracking and projected, so no entities leave this class.</summary>
public sealed class CatalogQueries : ICatalogQueries
{
    private readonly GuitarAppDbContext _db;

    public CatalogQueries(GuitarAppDbContext db)
    {
        _db = db;
    }

    private static IQueryable<SongRow> Project(IQueryable<Song> songs) =>
        songs.Select(s => new SongRow(
            s.Slug, s.Title, s.Artist!.Name, s.Artist.Slug, s.Genre, s.Difficulty,
            s.Tuning != null ? s.Tuning.Name : null, s.Capo, s.Key, s.Description, s.Tags));

    private static SongDto ToDto(SongRow r) =>
        new(r.Slug, r.Title, r.ArtistName, r.ArtistSlug, r.Genre, r.Difficulty, r.Tuning, r.Capo, r.Key, r.Description, r.Tags);

    public async Task<PagedResult<SongDto>> ListSongsAsync(SongQuery query, PageRequest page, CancellationToken ct = default)
    {
        var songs = _db.Songs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = QueryHelpers.Contains(query.Search);
            songs = songs.Where(s => EF.Functions.ILike(s.Title, pattern) || EF.Functions.ILike(s.Artist!.Name, pattern));
        }
        if (!string.IsNullOrWhiteSpace(query.ArtistSlug)) songs = songs.Where(s => s.Artist!.Slug == query.ArtistSlug);
        if (!string.IsNullOrWhiteSpace(query.Genre)) songs = songs.Where(s => s.Genre == query.Genre);
        if (query.MinDifficulty is { } min) songs = songs.Where(s => s.Difficulty >= min);
        if (query.MaxDifficulty is { } max) songs = songs.Where(s => s.Difficulty <= max);
        if (!string.IsNullOrWhiteSpace(query.Tag))
        {
            var tag = query.Tag.Trim();
            songs = songs.Where(s => s.Tags.Contains(tag));
        }

        var total = await songs.LongCountAsync(ct);
        var rows = await Project(songs.OrderBy(s => s.Title).ThenBy(s => s.Slug).Skip(page.Skip).Take(page.PageSize)).ToListAsync(ct);
        return PagedResult<SongDto>.Create(rows.Select(ToDto).ToList(), page, total);
    }

    public async Task<SongDto?> GetSongAsync(string slug, CancellationToken ct = default)
    {
        var row = await Project(_db.Songs.AsNoTracking().Where(s => s.Slug == slug)).FirstOrDefaultAsync(ct);
        return row is null ? null : ToDto(row);
    }

    public async Task<PagedResult<ArtistDto>> ListArtistsAsync(string? search, PageRequest page, CancellationToken ct = default)
    {
        var artists = _db.Artists.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = QueryHelpers.Contains(search);
            artists = artists.Where(a => EF.Functions.ILike(a.Name, pattern));
        }

        var total = await artists.LongCountAsync(ct);
        var rows = await artists
            .OrderBy(a => a.Name).ThenBy(a => a.Slug)
            .Skip(page.Skip).Take(page.PageSize)
            .Select(a => new ArtistDto(a.Slug, a.Name, _db.Songs.Count(s => s.ArtistId == a.Id)))
            .ToListAsync(ct);
        return PagedResult<ArtistDto>.Create(rows, page, total);
    }

    public async Task<IReadOnlyList<TuningDto>> ListTuningsAsync(CancellationToken ct = default) =>
        await _db.Tunings.AsNoTracking().OrderBy(t => t.Name).Select(t => new TuningDto(t.Name, t.Notes)).ToListAsync(ct);
}
