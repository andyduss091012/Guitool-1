using GuitarApp.Importer.Import;
using GuitarApp.Importer.Seed;

namespace GuitarApp.Importer.Tests;

public class ConceptMapperTests
{
    private static SeedShape Shape(int[]? muted, params SeedPosition[] positions) =>
        new("s", "Shape", 1, 4, positions.ToList(), muted);

    [Fact]
    public void Open_g_shape_derives_frets_with_unlisted_strings_open()
    {
        var shape = Shape(null,
            new SeedPosition(1, 3, "root", 2), new SeedPosition(2, 2, "third", 1), new SeedPosition(6, 3, "root", 3));
        var (frets, fingers, problem) = ConceptMapper.DeriveChordVoicing(shape);
        problem.Should().BeNull();
        frets.Should().Equal(3, 2, 0, 0, 0, 3);
        fingers.Should().Equal(2, 1, 0, 0, 0, 3);
    }

    [Fact]
    public void Muted_strings_become_minus_one_in_both_arrays()
    {
        var shape = Shape(new[] { 1, 2 }, new SeedPosition(3, 5, "root", 1), new SeedPosition(4, 7, "note", 3));
        var (frets, fingers, _) = ConceptMapper.DeriveChordVoicing(shape);
        frets.Should().Equal(-1, -1, 5, 7, 0, 0);
        fingers.Should().Equal(-1, -1, 1, 3, 0, 0);
    }

    [Fact]
    public void Shapes_without_any_finger_data_have_null_fingers()
    {
        var (frets, fingers, _) = ConceptMapper.DeriveChordVoicing(Shape(null, new SeedPosition(2, 3)));
        frets.Should().NotBeNull();
        fingers.Should().BeNull();
    }

    [Fact]
    public void A_string_listed_twice_is_a_problem_not_a_guess()
    {
        var (frets, _, problem) = ConceptMapper.DeriveChordVoicing(Shape(null, new SeedPosition(2, 3), new SeedPosition(2, 5)));
        frets.Should().BeNull();
        problem.Should().Contain("more than once");
    }

    [Fact]
    public void Interval_pattern_is_in_musical_order()
    {
        var shape = Shape(null,
            new SeedPosition(1, 5, Interval: "b7"), new SeedPosition(1, 3, Interval: "1"),
            new SeedPosition(2, 3, Interval: "5"), new SeedPosition(2, 1, Interval: "4"), new SeedPosition(3, 3, Interval: "b3"),
            new SeedPosition(3, 4, Interval: "1"));
        ConceptMapper.IntervalPattern(new[] { shape }).Should().Equal("1", "b3", "4", "5", "b7");
    }

    [Fact]
    public void Every_chord_concept_has_an_explicit_target()
    {
        var seed = SeedReader.Read(SeedFiles.Directory);
        foreach (var concept in seed.Concepts.Where(c => c.Type == "chord"))
            ConceptMapper.ChordConceptTargets.Should().ContainKey(concept.Slug);
    }
}
