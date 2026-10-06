using System.Text.Json;
using GuitarApp.Application.Common;
using GuitarApp.Application.Reference;
using GuitarApp.Domain.Reference;
using GuitarApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GuitarApp.Infrastructure.Queries;

/// <summary>Read-only chord / scale / concept queries (reference data written only by the importer).</summary>
public sealed class ReferenceQueries : IReferenceQueries
{
    private readonly GuitarAppDbContext _db;

    public ReferenceQueries(GuitarAppDbContext db)
    {
        _db = db;
    }

    // ---------- chords ----------

    private static ChordDto ToDto(Chord c, bool fretsOnly) =>
        new(
            c.Id, c.Root, c.Quality, c.Label,
            $"{c.Root}{(c.Quality == "maj" ? "" : c.Quality)}",
            c.Voicings
                .Where(v => !fretsOnly || v.Frets is not null)
                .OrderBy(v => v.Index)
                .Select(v => new ChordVoicingDto(v.Index, v.Frets, v.Fingers, v.BaseFret, v.IsPreferred, v.Label, v.FretsSource))
                .ToList());

    public async Task<PagedResult<ChordDto>> ListChordsAsync(ChordQuery query, PageRequest page, CancellationToken ct = default)
    {
        var chords = _db.Chords.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Root)) chords = chords.Where(c => c.Root == query.Root);
        if (!string.IsNullOrWhiteSpace(query.Quality)) chords = chords.Where(c => c.Quality == query.Quality);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = QueryHelpers.Contains(query.Search);
            chords = chords.Where(c => EF.Functions.ILike(c.Root + c.Quality, pattern) || EF.Functions.ILike(c.Label, pattern));
        }
        if (query.WithFretsOnly) chords = chords.Where(c => c.Voicings.Any(v => v.Frets != null));

        var total = await chords.LongCountAsync(ct);
        var rows = await chords
            .OrderBy(c => c.Root).ThenBy(c => c.Quality)
            .Skip(page.Skip).Take(page.PageSize)
            .Include(c => c.Voicings)
            .ToListAsync(ct);
        return PagedResult<ChordDto>.Create(rows.Select(c => ToDto(c, query.WithFretsOnly)).ToList(), page, total);
    }

    public async Task<IReadOnlyList<ChordDto>> GetChordLibraryAsync(CancellationToken ct = default)
    {
        var rows = await _db.Chords.AsNoTracking()
            .Where(c => c.Voicings.Any(v => v.Frets != null))
            .OrderBy(c => c.Root).ThenBy(c => c.Quality)
            .Include(c => c.Voicings.Where(v => v.Frets != null))
            .ToListAsync(ct);
        return rows.Select(c => ToDto(c, fretsOnly: true)).ToList();
    }

    public async Task<ChordDto?> GetChordAsync(Guid id, CancellationToken ct = default)
    {
        var chord = await _db.Chords.AsNoTracking().Include(c => c.Voicings).FirstOrDefaultAsync(c => c.Id == id, ct);
        return chord is null ? null : ToDto(chord, fretsOnly: false);
    }

    // ---------- scales ----------

    public async Task<IReadOnlyList<ScaleSummaryDto>> ListScalesAsync(CancellationToken ct = default)
    {
        var rows = await _db.Scales.AsNoTracking()
            .OrderBy(s => s.Slug)
            .Select(s => new { s.Slug, s.Name, s.Family, s.Description, s.IntervalPattern, PositionCount = s.Positions.Count() })
            .ToListAsync(ct);
        return rows.Select(r => new ScaleSummaryDto(r.Slug, r.Name, r.Family, r.Description, r.IntervalPattern, r.PositionCount)).ToList();
    }

    public async Task<ScaleDto?> GetScaleAsync(string slug, CancellationToken ct = default)
    {
        var scale = await _db.Scales.AsNoTracking()
            .Include(s => s.Positions).ThenInclude(p => p.Notes)
            .AsSplitQuery()
            .FirstOrDefaultAsync(s => s.Slug == slug, ct);
        if (scale is null) return null;

        var positions = scale.Positions
            .OrderBy(p => p.Index)
            .Select(p => new ScalePositionDto(
                p.Index, p.Label, p.StartFret, p.FretCount,
                p.Notes.OrderBy(n => n.String).ThenBy(n => n.Fret)
                    .Select(n => new ScaleNoteDto(n.String, n.Fret, n.Interval, n.IsRoot, n.Finger)).ToList()))
            .ToList();
        return new ScaleDto(scale.Slug, scale.Name, scale.Family, scale.Description, scale.IntervalPattern, positions);
    }

    // ---------- concepts ----------

    private static ConceptDto ToDto(MusicConcept c)
    {
        using var document = JsonDocument.Parse(c.ShapesJson);
        return new ConceptDto(c.Slug, c.Kind, c.Category, c.Name, c.Aliases, c.Description, document.RootElement.Clone());
    }

    public async Task<IReadOnlyList<ConceptDto>> ListConceptsAsync(string? kind, string? category, CancellationToken ct = default)
    {
        var concepts = _db.MusicConcepts.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(kind)) concepts = concepts.Where(c => c.Kind == kind);
        if (!string.IsNullOrWhiteSpace(category)) concepts = concepts.Where(c => c.Category == category);
        var rows = await concepts.OrderBy(c => c.Slug).ToListAsync(ct);
        return rows.Select(ToDto).ToList();
    }

    public async Task<ConceptDto?> GetConceptAsync(string slug, CancellationToken ct = default)
    {
        var concept = await _db.MusicConcepts.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == slug, ct);
        return concept is null ? null : ToDto(concept);
    }
}
