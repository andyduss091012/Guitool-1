using GuitarApp.Application.Catalog;
using GuitarApp.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace GuitarApp.Api.Controllers;

[Route("api/songs")]
public sealed class SongsController : ApiControllerBase
{
    private readonly ICatalogQueries _queries;

    public SongsController(ICatalogQueries queries)
    {
        _queries = queries;
    }

    /// <summary>Songs, filtered and paged (default 20 per page, max 100). Sorted by title.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<SongDto>>> List(
        [FromQuery] string? search, [FromQuery] string? artist, [FromQuery] string? genre,
        [FromQuery] int? minDifficulty, [FromQuery] int? maxDifficulty, [FromQuery] string? tag,
        [FromQuery] int page = 1, [FromQuery] int pageSize = PageRequest.DefaultPageSize, CancellationToken ct = default) =>
        Ok(await _queries.ListSongsAsync(new SongQuery(search, artist, genre, minDifficulty, maxDifficulty, tag), new PageRequest(page, pageSize), ct));

    [HttpGet("{slug}")]
    public async Task<ActionResult<SongDto>> Get(string slug, CancellationToken ct)
    {
        var song = await _queries.GetSongAsync(slug, ct);
        return song is null ? NotFoundProblem($"No song with id '{slug}'.") : Ok(song);
    }
}

[Route("api/artists")]
public sealed class ArtistsController : ApiControllerBase
{
    private readonly ICatalogQueries _queries;

    public ArtistsController(ICatalogQueries queries)
    {
        _queries = queries;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ArtistDto>>> List(
        [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = PageRequest.DefaultPageSize, CancellationToken ct = default) =>
        Ok(await _queries.ListArtistsAsync(search, new PageRequest(page, pageSize), ct));
}

[Route("api/tunings")]
public sealed class TuningsController : ApiControllerBase
{
    private readonly ICatalogQueries _queries;

    public TuningsController(ICatalogQueries queries)
    {
        _queries = queries;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TuningDto>>> List(CancellationToken ct) => Ok(await _queries.ListTuningsAsync(ct));
}
