using GuitarApp.Domain.Common;
using GuitarApp.Domain.Gear;
using GuitarApp.Domain.Reference;

namespace GuitarApp.Domain.Tests;

public class ReferenceEntityTests
{
    [Theory]
    [InlineData("A", true)]
    [InlineData("A#", true)]
    [InlineData("Bb", true)]
    [InlineData("H", false)]
    [InlineData("A##", false)]
    [InlineData("a", false)]
    public void Chord_root_spelling(string root, bool valid)
    {
        var act = () => Chord.Create(root, "maj", "Major");
        if (valid) act.Should().NotThrow(); else act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Voicing_indexes_increment_and_basefret_is_lowest_fretted()
    {
        var chord = Chord.Create("A", "m", "Minor");
        var v0 = chord.AddVoicing(new[] { -1, 0, 2, 2, 1, 0 });
        var v1 = chord.AddVoicing(new[] { 5, 7, 7, 5, 5, 5 }, isPreferred: true, label: "E-shape");
        v0.Index.Should().Be(0);
        v0.BaseFret.Should().Be(1);
        v1.Index.Should().Be(1);
        v1.BaseFret.Should().Be(5);
        v1.ChordId.Should().Be(chord.Id);
        chord.Voicings.Should().HaveCount(2);
    }

    [Fact]
    public void Voicing_may_have_fingers_only_with_unknown_frets()
    {
        var chord = Chord.Create("G", "maj", "Major");
        var voicing = chord.AddVoicing(null, new[] { 2, 1, 0, 0, 0, 3 });
        voicing.Frets.Should().BeNull();
        voicing.BaseFret.Should().BeNull();
        voicing.Fingers.Should().Equal(2, 1, 0, 0, 0, 3);
    }

    [Fact]
    public void Voicing_needs_frets_or_fingers()
    {
        var chord = Chord.Create("G", "maj", "Major");
        var act = () => chord.AddVoicing(null, null);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Voicing_index_must_be_unique_per_chord()
    {
        var chord = Chord.Create("G", "maj", "Major");
        chord.AddVoicingAt(3, null, new[] { 2, 1, 0, 0, 0, 3 });
        var act = () => chord.AddVoicingAt(3, null, new[] { 1, 1, 1, 1, 1, 1 });
        act.Should().Throw<DomainException>();
        chord.AddVoicing(null, new[] { 1, 1, 1, 1, 1, 1 }).Index.Should().Be(4);
    }

    [Fact]
    public void Voicing_SetValues_replaces_content_and_revalidates()
    {
        var chord = Chord.Create("G", "maj", "Major");
        var voicing = chord.AddVoicing(null, new[] { 2, 1, 0, 0, 0, 3 });
        voicing.SetValues(new[] { 3, 2, 0, 0, 0, 3 }, new[] { 2, 1, 0, 0, 0, 3 }, true, "Open");
        voicing.Frets.Should().Equal(3, 2, 0, 0, 0, 3);
        voicing.IsPreferred.Should().BeTrue();
        voicing.BaseFret.Should().Be(2);
        var act = () => voicing.SetValues(new[] { 1, 2, 3 }, null, false, null);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Voicing_records_where_its_frets_came_from()
    {
        var chord = Chord.Create("C", "maj", "Major");
        chord.AddVoicing(null, new[] { 0, 3, 2, 0, 1, 0 }).FretsSource.Should().BeNull("fingers-only data has no frets to attribute");
        chord.AddVoicing(new[] { -1, 3, 2, 0, 1, 0 }).FretsSource.Should().Be(FretsSources.Authored);
        chord.AddVoicing(new[] { 3, 3, 5, 5, 5, 3 }, null, false, null, FretsSources.ChordsDb).FretsSource.Should().Be(FretsSources.ChordsDb);
    }

    [Fact]
    public void Voicing_rejects_an_unknown_frets_source_and_clears_it_when_frets_are_removed()
    {
        var chord = Chord.Create("C", "maj", "Major");
        var act = () => chord.AddVoicing(new[] { -1, 3, 2, 0, 1, 0 }, null, false, null, "made-up");
        act.Should().Throw<DomainException>();

        var voicing = chord.AddVoicing(new[] { -1, 3, 2, 0, 1, 0 }, null, false, null, FretsSources.ChordsDb);
        voicing.SetValues(null, new[] { -1, 3, 2, 0, 1, 0 }, false, null, FretsSources.ChordsDb);
        voicing.Frets.Should().BeNull();
        voicing.FretsSource.Should().BeNull();
    }

    [Fact]
    public void Scale_fingerprint_changes_when_a_note_changes()
    {
        Scale Build(int fret)
        {
            var s = Scale.Create("scale-x", LocalizedText.FromEnglish("X"), "f", new[] { "1" });
            s.AddPosition("Shape 1", 0, 4).AddNote(1, fret, "1", true);
            return s;
        }
        Build(3).PositionsFingerprint().Should().Be(Build(3).PositionsFingerprint());
        Build(3).PositionsFingerprint().Should().NotBe(Build(5).PositionsFingerprint());
    }

    [Fact]
    public void MusicConcept_validates_kind_and_shapes()
    {
        var name = LocalizedText.FromEnglish("CAGED");
        MusicConcept.Create("chord-caged", "chord", "barre", name, name, "[]", new[] { "CAGED system", "caged system" }).Aliases.Should().HaveCount(1);
        var badKind = () => MusicConcept.Create("c-x", "arpeggio", "x", name, name, "[]");
        badKind.Should().Throw<DomainException>();
        var badJson = () => MusicConcept.Create("c-x", "chord", "x", name, name, "{}");
        badJson.Should().Throw<DomainException>();
    }

    [Fact]
    public void Voicing_needs_exactly_six_frets()
    {
        var chord = Chord.Create("E", "maj", "Major");
        var act = () => chord.AddVoicing(new[] { 0, 2, 2, 1, 0 });
        act.Should().Throw<DomainException>();
    }

    [Theory]
    [InlineData(-2)]
    [InlineData(25)]
    public void Voicing_fret_range(int fret)
    {
        var chord = Chord.Create("E", "maj", "Major");
        var act = () => chord.AddVoicing(new[] { 0, 2, 2, 1, 0, fret });
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Voicing_copies_input_array()
    {
        var chord = Chord.Create("E", "maj", "Major");
        var frets = new[] { 0, 2, 2, 1, 0, 0 };
        var voicing = chord.AddVoicing(frets);
        frets[0] = 9;
        voicing.Frets[0].Should().Be(0);
    }

    [Fact]
    public void Voicing_fingers_validated()
    {
        var chord = Chord.Create("E", "maj", "Major");
        var act = () => chord.AddVoicing(new[] { 0, 2, 2, 1, 0, 0 }, new[] { 0, 2, 3, 1, 0, 9 });
        act.Should().Throw<DomainException>();
        chord.AddVoicing(new[] { 0, 2, 2, 1, 0, 0 }, new[] { 0, 2, 3, 1, -1, 0 }).Fingers.Should().Contain(-1);
        act = () => chord.AddVoicing(new[] { 0, 2, 2, 1, 0, 0 }, new[] { 0, 2, 3, 1, 0, 9 });
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Scale_builds_positions_and_notes()
    {
        var scale = Scale.Create("scale-minor-pentatonic", LocalizedText.FromEnglish("Minor pentatonic"), "pentatonic", new[] { "1", "b3", "4", "5", "b7" });
        var position = scale.AddPosition("Shape 1", 5, 4);
        position.AddNote(1, 5, "1", isRoot: true, finger: 1);
        position.AddNote(1, 8, "b3");
        scale.Positions.Should().HaveCount(1);
        position.Index.Should().Be(0);
        position.Notes.Should().HaveCount(2);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(7)]
    public void Scale_note_string_range(int stringNumber)
    {
        var scale = Scale.Create("scale-x", LocalizedText.FromEnglish("X"), "f", new[] { "1" });
        var position = scale.AddPosition("Shape 1", 1, 4);
        var act = () => position.AddNote(stringNumber, 3);
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Scale_needs_intervals()
    {
        var act = () => Scale.Create("scale-x", LocalizedText.FromEnglish("X"), "f", Array.Empty<string>());
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Preset_blocks_get_sequential_order_and_json_object_settings()
    {
        var preset = Preset.Create("preset-clean", "Clean");
        preset.AddBlock(null, "{\"gain\":2}").Order.Should().Be(0);
        preset.AddBlock(null, "{}").Order.Should().Be(1);
        var act = () => preset.AddBlock(null, "[1,2]");
        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Gear_requires_slug_and_name()
    {
        var act = () => Amp.Create("Bad Slug", "Amp");
        act.Should().Throw<DomainException>();
        Effect.Create("fx-delay", "Delay", "delay").Kind.Should().Be("delay");
    }
}
