using System.Text.Json;
using GuitarApp.Application.Common;
using GuitarApp.Domain.Common;

namespace GuitarApp.Application.Reference;

/// <summary>
/// One way to play a chord. Frets are ABSOLUTE (low E first; -1 muted, 0 open) and may be null for finger-only legacy data;
/// <see cref="FretsSource"/> says where they came from ("authored" or "chords-db").
/// </summary>
public sealed record ChordVoicingDto(int Index, int[]? Frets, int[]? Fingers, int? BaseFret, bool IsPreferred, string? Label, string? FretsSource);

public sealed record ChordDto(Guid Id, string Root, string Quality, string Label, string Name, IReadOnlyList<ChordVoicingDto> Voicings);

/// <summary>Filters combine with AND. <see cref="WithFretsOnly"/> hides finger-only voicings (and chords left with none).</summary>
public sealed record ChordQuery(string? Root = null, string? Quality = null, string? Search = null, bool WithFretsOnly = false);

public sealed record ScaleSummaryDto(string Slug, LocalizedText Name, string Family, LocalizedText? Description, IReadOnlyList<string> IntervalPattern, int PositionCount);

public sealed record ScaleNoteDto(int String, int Fret, string? Interval, bool IsRoot, int? Finger);

public sealed record ScalePositionDto(int Index, string Label, int StartFret, int FretCount, IReadOnlyList<ScaleNoteDto> Notes);

public sealed record ScaleDto(string Slug, LocalizedText Name, string Family, LocalizedText? Description, IReadOnlyList<string> IntervalPattern, IReadOnlyList<ScalePositionDto> Positions);

/// <summary>A teaching concept document; <see cref="Shapes"/> is the frontend's FretShape[] exactly as authored.</summary>
public sealed record ConceptDto(string Slug, string Kind, string Category, LocalizedText Name, IReadOnlyList<string> Aliases, LocalizedText Description, JsonElement Shapes);

public interface IReferenceQueries
{
    Task<PagedResult<ChordDto>> ListChordsAsync(ChordQuery query, PageRequest page, CancellationToken ct = default);
    /// <summary>Every chord that has at least one voicing with real frets, voicings with frets only. Bounded reference data (a few hundred chords).</summary>
    Task<IReadOnlyList<ChordDto>> GetChordLibraryAsync(CancellationToken ct = default);
    Task<ChordDto?> GetChordAsync(Guid id, CancellationToken ct = default);

    Task<IReadOnlyList<ScaleSummaryDto>> ListScalesAsync(CancellationToken ct = default);
    Task<ScaleDto?> GetScaleAsync(string slug, CancellationToken ct = default);

    Task<IReadOnlyList<ConceptDto>> ListConceptsAsync(string? kind, string? category, CancellationToken ct = default);
    Task<ConceptDto?> GetConceptAsync(string slug, CancellationToken ct = default);
}
