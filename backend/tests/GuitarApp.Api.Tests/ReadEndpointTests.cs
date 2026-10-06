using System.Net;
using System.Net.Http.Json;
using GuitarApp.Application.Catalog;
using GuitarApp.Application.Common;
using GuitarApp.Application.Reference;

namespace GuitarApp.Api.Tests;

public class ReadEndpointTests : IClassFixture<ApiFixture>
{
    private readonly ApiFixture _api;

    public ReadEndpointTests(ApiFixture api)
    {
        _api = api;
    }

    private HttpClient Client()
    {
        Skip.If(_api.UnavailableReason is not null, _api.UnavailableReason);
        return _api.CreateClient();
    }

    private async Task<T> GetAsync<T>(string url)
    {
        var response = await Client().GetAsync(url);
        response.StatusCode.Should().Be(HttpStatusCode.OK, url);
        return (await response.Content.ReadFromJsonAsync<T>())!;
    }

    // ---------- songs ----------

    [SkippableFact]
    public async Task Songs_are_listed_by_title_with_paging()
    {
        var all = await GetAsync<PagedResult<SongDto>>("/api/songs");
        all.TotalCount.Should().Be(3);
        all.Items.Select(s => s.Title).Should().Equal("Blackbird", "Let It Be", "One");

        var first = await GetAsync<PagedResult<SongDto>>("/api/songs?pageSize=2");
        first.Items.Should().HaveCount(2);
        first.TotalPages.Should().Be(2);
        first.HasNextPage.Should().BeTrue();
        (await GetAsync<PagedResult<SongDto>>("/api/songs?pageSize=2&page=2")).Items.Should().ContainSingle().Which.Title.Should().Be("One");
    }

    [SkippableFact]
    public async Task Page_size_is_clamped_instead_of_rejected()
    {
        (await GetAsync<PagedResult<SongDto>>("/api/songs?pageSize=100000")).PageSize.Should().Be(PageRequest.MaxPageSize);
        (await GetAsync<PagedResult<SongDto>>("/api/songs?page=-4&pageSize=0")).Page.Should().Be(1);
    }

    [SkippableTheory]
    [InlineData("search=beat", 2)] // artist name
    [InlineData("search=LET it", 1)] // title, case-insensitive
    [InlineData("search=%25", 0)] // a literal % is not a wildcard
    [InlineData("genre=Metal", 1)]
    [InlineData("artist=the-beatles", 2)]
    [InlineData("minDifficulty=3", 2)]
    [InlineData("maxDifficulty=2", 1)]
    [InlineData("tag=fingerstyle", 1)]
    [InlineData("artist=the-beatles&minDifficulty=3", 1)]
    [InlineData("search=nothing-matches-this", 0)]
    public async Task Song_filters_combine(string query, int expected)
    {
        (await GetAsync<PagedResult<SongDto>>($"/api/songs?{query}")).TotalCount.Should().Be(expected, query);
    }

    [SkippableFact]
    public async Task A_song_is_returned_by_its_slug_with_localized_notes()
    {
        var song = await GetAsync<SongDto>("/api/songs/song-blackbird");
        song.Id.Should().Be("song-blackbird");
        song.Artist.Should().Be("The Beatles");
        song.ArtistSlug.Should().Be("the-beatles");
        song.Tuning.Should().Be("Standard (EADGBE)");
        song.KeySignature.Should().Be("G");
        song.PracticeNotes!.Vi.Should().Be("Mẫu gảy ngón.");
        song.Tags.Should().BeEquivalentTo("fingerstyle", "1960s");
    }

    [SkippableFact]
    public async Task Missing_values_are_omitted_from_the_json()
    {
        var json = await Client().GetStringAsync("/api/songs/song-one");
        json.Should().NotContain("null");
        json.Should().NotContain("\"capo\"");
    }

    [SkippableFact]
    public async Task Unknown_song_is_a_404_problem_response()
    {
        var response = await Client().GetAsync("/api/songs/nope");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
    }

    [SkippableFact]
    public async Task Artists_and_tunings_are_listed()
    {
        var artists = await GetAsync<PagedResult<ArtistDto>>("/api/artists");
        artists.Items.Should().Contain(a => a.Slug == "the-beatles" && a.SongCount == 2);
        artists.Items.Should().Contain(a => a.Slug == "metallica" && a.SongCount == 1);
        (await GetAsync<PagedResult<ArtistDto>>("/api/artists?search=metal")).TotalCount.Should().Be(1);

        (await GetAsync<List<TuningDto>>("/api/tunings")).Should().ContainSingle().Which.Name.Should().Be("Standard (EADGBE)");
    }

    // ---------- chords ----------

    [SkippableFact]
    public async Task The_chord_library_only_has_chords_and_voicings_with_real_frets()
    {
        var library = await GetAsync<List<ChordDto>>("/api/chords/library");
        library.Select(c => c.Name).Should().Equal("C", "G"); // A#m7 only has fingers, so it is left out
        library.SelectMany(c => c.Voicings).Should().OnlyContain(v => v.Frets != null);

        var g = library.Single(c => c.Root == "G");
        g.Voicings.Should().ContainSingle().Which.Should().BeEquivalentTo(
            new ChordVoicingDto(1, new[] { 3, 2, 0, 0, 0, 3 }, new[] { 2, 1, 0, 0, 0, 3 }, 2, true, "Open", "authored"));
    }

    [SkippableFact]
    public async Task Chords_can_be_filtered_and_include_finger_only_voicings_unless_asked_not_to()
    {
        var g = (await GetAsync<PagedResult<ChordDto>>("/api/chords?root=G&quality=maj")).Items.Should().ContainSingle().Subject;
        g.Voicings.Should().HaveCount(2);
        g.Voicings.Should().Contain(v => v.Frets == null && v.Fingers != null);

        var fretsOnly = (await GetAsync<PagedResult<ChordDto>>("/api/chords?root=G&quality=maj&withFrets=true")).Items.Single();
        fretsOnly.Voicings.Should().ContainSingle();

        (await GetAsync<PagedResult<ChordDto>>("/api/chords?withFrets=true")).TotalCount.Should().Be(2);
        (await GetAsync<PagedResult<ChordDto>>("/api/chords?quality=m7")).Items.Single().Name.Should().Be("A#m7");
        (await GetAsync<PagedResult<ChordDto>>("/api/chords?search=minor")).TotalCount.Should().Be(1);
    }

    [SkippableFact]
    public async Task A_chord_is_returned_by_id()
    {
        var chord = await GetAsync<ChordDto>($"/api/chords/{_api.GMajorId}");
        chord.Root.Should().Be("G");
        chord.Voicings.Select(v => v.Index).Should().Equal(0, 1);

        (await Client().GetAsync($"/api/chords/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ---------- scales and concepts ----------

    [SkippableFact]
    public async Task Scales_come_with_ordered_positions_and_notes()
    {
        var list = await GetAsync<List<ScaleSummaryDto>>("/api/scales");
        list.Should().ContainSingle().Which.PositionCount.Should().Be(2);

        var scale = await GetAsync<ScaleDto>("/api/scales/scale-minor-pentatonic");
        scale.IntervalPattern.Should().Equal("1", "b3", "4", "5", "b7");
        scale.Positions.Select(p => p.Label).Should().Equal("Position 1", "Position 2");
        scale.Positions[0].Notes.Select(n => n.String).Should().Equal(1, 6); // ordered by string, then fret
        scale.Positions[0].Notes[0].IsRoot.Should().BeTrue();

        (await Client().GetAsync("/api/scales/nope")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Concepts_are_served_with_their_shape_documents()
    {
        var all = await GetAsync<List<ConceptDto>>("/api/concepts");
        all.Should().HaveCount(2);

        var chords = await GetAsync<List<ConceptDto>>("/api/concepts?kind=chord");
        var concept = chords.Should().ContainSingle().Subject;
        concept.Slug.Should().Be("chord-open-g-major");
        concept.Aliases.Should().Equal("G");
        concept.Shapes.GetArrayLength().Should().Be(1);
        concept.Shapes[0].GetProperty("label").GetString().Should().Be("Open");

        (await GetAsync<ConceptDto>("/api/concepts/scale-minor-pentatonic")).Kind.Should().Be("scale");
        (await Client().GetAsync("/api/concepts/nope")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
