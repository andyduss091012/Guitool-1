using GuitarApp.Domain.Common;

namespace GuitarApp.Domain.Tests;

public class LocalizedTextTests
{
    [Fact]
    public void Get_returns_requested_language_when_present()
    {
        var text = new LocalizedText { En = "Hello", Vi = "Xin chào" };
        text.Get("vi").Should().Be("Xin chào");
    }

    [Theory]
    [InlineData("ja")]
    [InlineData("xx")]
    [InlineData(null)]
    public void Get_falls_back_to_english(string? language)
    {
        var text = new LocalizedText { En = "Hello", Vi = "Xin chào" };
        text.Get(language).Should().Be("Hello");
    }

    [Fact]
    public void FromEnglish_requires_text()
    {
        var act = () => LocalizedText.FromEnglish(" ");
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Records_with_same_values_are_equal() =>
        new LocalizedText { En = "a", Es = "b" }.Should().Be(new LocalizedText { En = "a", Es = "b" });
}
