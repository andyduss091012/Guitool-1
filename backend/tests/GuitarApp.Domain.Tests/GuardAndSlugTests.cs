using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Tests;

public class GuardAndSlugTests
{
    [Theory]
    [InlineData("song-blackbird", true)]
    [InlineData("a", true)]
    [InlineData("technique-alternate-picking", true)]
    [InlineData("Song-Blackbird", false)]
    [InlineData("song--blackbird", false)]
    [InlineData("-song", false)]
    [InlineData("song-", false)]
    [InlineData("song blackbird", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void Slugs_validate_expected_shapes(string? value, bool expected) =>
        Slugs.IsValid(value).Should().Be(expected);

    [Fact]
    public void Slug_longer_than_max_is_invalid() =>
        Slugs.IsValid(new string('a', Slugs.MaxLength + 1)).Should().BeFalse();

    [Fact]
    public void NotBlank_trims_and_returns() =>
        Guard.NotBlank("  hello ", "Field").Should().Be("hello");

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void NotBlank_rejects_empty(string? value)
    {
        var act = () => Guard.NotBlank(value, "Title");
        act.Should().Throw<DomainException>().WithMessage("Title is required.");
    }

    [Fact]
    public void NotBlank_rejects_too_long()
    {
        var act = () => Guard.NotBlank(new string('x', 11), "Name", 10);
        act.Should().Throw<DomainException>().WithMessage("*at most 10*");
    }

    [Fact]
    public void OptionalText_returns_null_for_blank() =>
        Guard.OptionalText("  ", "Key").Should().BeNull();

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void InRange_rejects_out_of_range(int value)
    {
        var act = () => Guard.InRange(value, 1, 5, "Difficulty");
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void InRangeOrNull_passes_null_through() =>
        Guard.InRangeOrNull(null, 1, 5, "X").Should().BeNull();
}
