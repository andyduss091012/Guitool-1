using GuitarApp.Application.Common;
using GuitarApp.Application.Reference;
using Microsoft.AspNetCore.Mvc;

namespace GuitarApp.Api.Controllers;

[Route("api/chords")]
public sealed class ChordsController : ApiControllerBase
{
    private readonly IReferenceQueries _queries;

    public ChordsController(IReferenceQueries queries)
    {
        _queries = queries;
    }

    /// <summary>
    /// Chords, filtered and paged. <c>root</c> and <c>quality</c> are exact (e.g. root=A#, quality=m7); <c>search</c> matches the
    /// symbol or label. <c>withFrets=true</c> returns only voicings with real frets.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<ChordDto>>> List(
        [FromQuery] string? root, [FromQuery] string? quality, [FromQuery] string? search, [FromQuery] bool withFrets = false,
        [FromQuery] int page = 1, [FromQuery] int pageSize = PageRequest.DefaultPageSize, CancellationToken ct = default) =>
        Ok(await _queries.ListChordsAsync(new ChordQuery(root, quality, search, withFrets), new PageRequest(page, pageSize), ct));

    /// <summary>The whole chord library in one response: every chord with at least one real-fret voicing (what the web app's chord browser needs).</summary>
    [HttpGet("library")]
    public async Task<ActionResult<IReadOnlyList<ChordDto>>> Library(CancellationToken ct) => Ok(await _queries.GetChordLibraryAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ChordDto>> Get(Guid id, CancellationToken ct)
    {
        var chord = await _queries.GetChordAsync(id, ct);
        return chord is null ? NotFoundProblem($"No chord with id '{id}'.") : Ok(chord);
    }
}

[Route("api/scales")]
public sealed class ScalesController : ApiControllerBase
{
    private readonly IReferenceQueries _queries;

    public ScalesController(IReferenceQueries queries)
    {
        _queries = queries;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ScaleSummaryDto>>> List(CancellationToken ct) => Ok(await _queries.ListScalesAsync(ct));

    [HttpGet("{slug}")]
    public async Task<ActionResult<ScaleDto>> Get(string slug, CancellationToken ct)
    {
        var scale = await _queries.GetScaleAsync(slug, ct);
        return scale is null ? NotFoundProblem($"No scale with id '{slug}'.") : Ok(scale);
    }
}

[Route("api/concepts")]
public sealed class ConceptsController : ApiControllerBase
{
    private readonly IReferenceQueries _queries;

    public ConceptsController(IReferenceQueries queries)
    {
        _queries = queries;
    }

    /// <summary>Teaching concepts (chords, scales) with their shape documents. <c>kind</c> = chord | scale.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ConceptDto>>> List([FromQuery] string? kind, [FromQuery] string? category, CancellationToken ct) =>
        Ok(await _queries.ListConceptsAsync(kind, category, ct));

    [HttpGet("{slug}")]
    public async Task<ActionResult<ConceptDto>> Get(string slug, CancellationToken ct)
    {
        var concept = await _queries.GetConceptAsync(slug, ct);
        return concept is null ? NotFoundProblem($"No concept with id '{slug}'.") : Ok(concept);
    }
}
