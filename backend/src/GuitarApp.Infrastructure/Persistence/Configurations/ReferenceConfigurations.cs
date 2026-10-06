using GuitarApp.Domain.Reference;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuitarApp.Infrastructure.Persistence.Configurations;

internal sealed class ChordConfiguration : IEntityTypeConfiguration<Chord>
{
    public void Configure(EntityTypeBuilder<Chord> builder)
    {
        builder.ToTable("chords");
        builder.ConfigureEntity();
        builder.Property(x => x.Root).HasMaxLength(3).IsRequired();
        builder.Property(x => x.Quality).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Label).HasMaxLength(80).IsRequired();
        builder.HasIndex(x => new { x.Root, x.Quality }).IsUnique();
        builder.HasMany(x => x.Voicings).WithOne().HasForeignKey(v => v.ChordId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.Voicings).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class ChordVoicingConfiguration : IEntityTypeConfiguration<ChordVoicing>
{
    public void Configure(EntityTypeBuilder<ChordVoicing> builder)
    {
        builder.ToTable("chord_voicings", t =>
        {
            t.HasCheckConstraint("ck_chord_voicings_frets_len", "frets IS NULL OR cardinality(frets) = 6");
            t.HasCheckConstraint("ck_chord_voicings_fingers_len", "fingers IS NULL OR cardinality(fingers) = 6");
            t.HasCheckConstraint("ck_chord_voicings_known", "frets IS NOT NULL OR fingers IS NOT NULL");
            t.HasCheckConstraint("ck_chord_voicings_index", "\"index\" >= 0");
            t.HasCheckConstraint("ck_chord_voicings_frets_source", "frets_source IS NULL OR (frets IS NOT NULL AND frets_source IN ('authored', 'chords-db'))");
        });
        builder.ConfigureEntity();
        builder.Property(x => x.Frets).HasColumnType("integer[]");
        builder.Property(x => x.Fingers).HasColumnType("integer[]");
        builder.Property(x => x.Label).HasMaxLength(60);
        builder.Property(x => x.FretsSource).HasMaxLength(20);
        builder.HasIndex(x => new { x.ChordId, x.Index }).IsUnique();
    }
}

internal sealed class MusicConceptConfiguration : IEntityTypeConfiguration<MusicConcept>
{
    public void Configure(EntityTypeBuilder<MusicConcept> builder)
    {
        builder.ToTable("music_concepts", t =>
        {
            t.HasCheckConstraint("ck_music_concepts_slug", $"slug ~ {ConfigurationExtensions.SlugRegex}");
            t.HasCheckConstraint("ck_music_concepts_kind", "kind IN ('chord', 'scale')");
        });
        builder.ConfigureEntity();
        builder.Property(x => x.Slug).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Kind).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(60).IsRequired();
        builder.Property(x => x.Name).AsLocalizedJson().IsRequired();
        builder.Property(x => x.Aliases).HasColumnType("text[]");
        builder.Property(x => x.Description).AsLocalizedJson().IsRequired();
        builder.Property(x => x.ShapesJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.Kind);
    }
}

internal sealed class ScaleConfiguration : IEntityTypeConfiguration<Scale>
{
    public void Configure(EntityTypeBuilder<Scale> builder)
    {
        builder.ToTable("scales", t => t.HasCheckConstraint("ck_scales_slug", $"slug ~ {ConfigurationExtensions.SlugRegex}"));
        builder.ConfigureEntity();
        builder.Property(x => x.Slug).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Name).AsLocalizedJson().IsRequired();
        builder.Property(x => x.Family).HasMaxLength(60).IsRequired();
        builder.Property(x => x.Description).AsLocalizedJson();
        builder.Property(x => x.IntervalPattern).HasColumnType("text[]");
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.Family);
        builder.HasMany(x => x.Positions).WithOne().HasForeignKey(p => p.ScaleId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.Positions).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class ScalePositionConfiguration : IEntityTypeConfiguration<ScalePosition>
{
    public void Configure(EntityTypeBuilder<ScalePosition> builder)
    {
        builder.ToTable("scale_positions", t =>
        {
            t.HasCheckConstraint("ck_scale_positions_start_fret", "start_fret BETWEEN 0 AND 24");
            t.HasCheckConstraint("ck_scale_positions_fret_count", "fret_count BETWEEN 1 AND 24");
        });
        builder.ConfigureEntity();
        builder.Property(x => x.Label).HasMaxLength(60).IsRequired();
        builder.HasIndex(x => new { x.ScaleId, x.Index }).IsUnique();
        builder.HasMany(x => x.Notes).WithOne().HasForeignKey(n => n.ScalePositionId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.Notes).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class ScalePositionNoteConfiguration : IEntityTypeConfiguration<ScalePositionNote>
{
    public void Configure(EntityTypeBuilder<ScalePositionNote> builder)
    {
        builder.ToTable("scale_position_notes", t =>
        {
            t.HasCheckConstraint("ck_scale_position_notes_string", "string BETWEEN 1 AND 6");
            t.HasCheckConstraint("ck_scale_position_notes_fret", "fret BETWEEN 0 AND 24");
        });
        builder.ConfigureEntity();
        builder.Property(x => x.Interval).HasMaxLength(8);
        builder.HasIndex(x => new { x.ScalePositionId, x.String, x.Fret }).IsUnique();
    }
}

internal sealed class TechniqueConfiguration : IEntityTypeConfiguration<Technique>
{
    public void Configure(EntityTypeBuilder<Technique> builder)
    {
        builder.ToTable("techniques", t => t.HasCheckConstraint("ck_techniques_slug", $"slug ~ {ConfigurationExtensions.SlugRegex}"));
        builder.ConfigureEntity();
        builder.Property(x => x.Slug).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Name).AsLocalizedJson().IsRequired();
        builder.Property(x => x.Description).AsLocalizedJson();
        builder.HasIndex(x => x.Slug).IsUnique();
    }
}
