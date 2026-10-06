using GuitarApp.Domain.Common;
using GuitarApp.Domain.Music;

namespace GuitarApp.Domain.Tests;

public class MusicEntityTests
{
    private static readonly Guid ArtistId = Guid.NewGuid();

    [Fact]
    public void Song_create_sets_fields_and_generates_id()
    {
        var song = Song.Create("song-blackbird", " Blackbird ", ArtistId, "Rock", 4, capo: 0, tags: new[] { "fingerstyle", "Fingerstyle", " ", "beatles" });
        song.Id.Should().NotBe(Guid.Empty);
        song.Title.Should().Be("Blackbird");
        song.Tags.Should().Equal("fingerstyle", "beatles");
        song.Capo.Should().Be(0);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void Song_difficulty_must_be_1_to_5(int difficulty)
    {
        var act = () => Song.Create("song-x", "X", ArtistId, "Rock", difficulty);
        act.Should().Throw<DomainException>().WithMessage("Difficulty*");
    }

    [Fact]
    public void Song_requires_valid_slug()
    {
        var act = () => Song.Create("Not A Slug", "X", ArtistId, "Rock", 3);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Song_requires_artist()
    {
        var act = () => Song.Create("song-x", "X", Guid.Empty, "Rock", 3);
        act.Should().Throw<DomainException>().WithMessage("Artist*");
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(13)]
    public void Song_capo_range(int capo)
    {
        var act = () => Song.Create("song-x", "X", ArtistId, "Rock", 3, capo: capo);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Artist_create_validates_name_and_slug()
    {
        Artist.Create("The Beatles", "the-beatles").Slug.Should().Be("the-beatles");
        var act = () => Artist.Create("", "x");
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Tuning_requires_six_notes()
    {
        Tuning.Create("Standard (EADGBE)", "E  A D G B E").Notes.Should().Be("E A D G B E");
        var act = () => Tuning.Create("Bad", "E A D");
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Updates_overwrite_everything_but_the_slug()
    {
        var song = Song.Create("song-x", "X", ArtistId, "Rock", 3, tags: new[] { "a" });
        var newArtist = Guid.NewGuid();
        song.Update("Y", newArtist, "Folk", 5, capo: 2, tags: new[] { "b", "c" });
        song.Slug.Should().Be("song-x");
        song.Title.Should().Be("Y");
        song.ArtistId.Should().Be(newArtist);
        song.Capo.Should().Be(2);
        song.Tags.Should().Equal("b", "c");

        var artist = Artist.Create("A", "a");
        artist.Update("B");
        artist.Name.Should().Be("B");
        var tuning = Tuning.Create("T", "E A D G B E");
        tuning.Update("T2", "D A D G B E");
        tuning.Notes.Should().Be("D A D G B E");
    }

    [Fact]
    public void Album_year_range()
    {
        var act = () => Album.Create(ArtistId, "Abbey Road", 1800);
        act.Should().Throw<DomainException>();
    }
}
