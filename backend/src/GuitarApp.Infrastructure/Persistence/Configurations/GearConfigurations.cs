using GuitarApp.Domain.Gear;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GuitarApp.Infrastructure.Persistence.Configurations;

internal sealed class AmpConfiguration : IEntityTypeConfiguration<Amp>
{
    public void Configure(EntityTypeBuilder<Amp> builder)
    {
        builder.ToTable("amps", t => t.HasCheckConstraint("ck_amps_slug", $"slug ~ {ConfigurationExtensions.SlugRegex}"));
        builder.ConfigureEntity();
        builder.Property(x => x.Slug).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Brand).HasMaxLength(120);
        builder.HasIndex(x => x.Slug).IsUnique();
    }
}

internal sealed class EffectConfiguration : IEntityTypeConfiguration<Effect>
{
    public void Configure(EntityTypeBuilder<Effect> builder)
    {
        builder.ToTable("effects", t => t.HasCheckConstraint("ck_effects_slug", $"slug ~ {ConfigurationExtensions.SlugRegex}"));
        builder.ConfigureEntity();
        builder.Property(x => x.Slug).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Kind).HasMaxLength(60).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.Kind);
    }
}

internal sealed class PresetConfiguration : IEntityTypeConfiguration<Preset>
{
    public void Configure(EntityTypeBuilder<Preset> builder)
    {
        builder.ToTable("presets", t => t.HasCheckConstraint("ck_presets_slug", $"slug ~ {ConfigurationExtensions.SlugRegex}"));
        builder.ConfigureEntity();
        builder.Property(x => x.Slug).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasOne<Amp>().WithMany().HasForeignKey(x => x.AmpId).OnDelete(DeleteBehavior.SetNull);
        builder.HasMany(x => x.Blocks).WithOne().HasForeignKey(b => b.PresetId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.Blocks).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

internal sealed class PresetBlockConfiguration : IEntityTypeConfiguration<PresetBlock>
{
    public void Configure(EntityTypeBuilder<PresetBlock> builder)
    {
        builder.ToTable("preset_blocks");
        builder.ConfigureEntity();
        builder.Property(x => x.SettingsJson).HasColumnType("jsonb").IsRequired();
        builder.HasOne<Effect>().WithMany().HasForeignKey(x => x.EffectId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(x => new { x.PresetId, x.Order }).IsUnique();
    }
}
