using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuitarApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "amps",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    brand = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_amps", x => x.id);
                    table.CheckConstraint("ck_amps_slug", "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
                });

            migrationBuilder.CreateTable(
                name: "artists",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    image_key = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_artists", x => x.id);
                    table.CheckConstraint("ck_artists_slug", "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
                });

            migrationBuilder.CreateTable(
                name: "chords",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    root = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    quality = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    label = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_chords", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "effects",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    kind = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_effects", x => x.id);
                    table.CheckConstraint("ck_effects_slug", "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
                });

            migrationBuilder.CreateTable(
                name: "scales",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    name = table.Column<string>(type: "jsonb", nullable: false),
                    family = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    description = table.Column<string>(type: "jsonb", nullable: true),
                    interval_pattern = table.Column<string[]>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_scales", x => x.id);
                    table.CheckConstraint("ck_scales_slug", "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
                });

            migrationBuilder.CreateTable(
                name: "techniques",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    name = table.Column<string>(type: "jsonb", nullable: false),
                    description = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_techniques", x => x.id);
                    table.CheckConstraint("ck_techniques_slug", "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
                });

            migrationBuilder.CreateTable(
                name: "tunings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    notes = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tunings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "presets",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    amp_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_presets", x => x.id);
                    table.CheckConstraint("ck_presets_slug", "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
                    table.ForeignKey(
                        name: "fk_presets_amps_amp_id",
                        column: x => x.amp_id,
                        principalTable: "amps",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "albums",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    artist_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    year = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_albums", x => x.id);
                    table.CheckConstraint("ck_albums_year", "year IS NULL OR year BETWEEN 1900 AND 2100");
                    table.ForeignKey(
                        name: "fk_albums_artists_artist_id",
                        column: x => x.artist_id,
                        principalTable: "artists",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "chord_voicings",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    chord_id = table.Column<Guid>(type: "uuid", nullable: false),
                    index = table.Column<int>(type: "integer", nullable: false),
                    frets = table.Column<int[]>(type: "integer[]", nullable: false),
                    fingers = table.Column<int[]>(type: "integer[]", nullable: true),
                    base_fret = table.Column<int>(type: "integer", nullable: false),
                    is_preferred = table.Column<bool>(type: "boolean", nullable: false),
                    label = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_chord_voicings", x => x.id);
                    table.CheckConstraint("ck_chord_voicings_fingers_len", "fingers IS NULL OR cardinality(fingers) = 6");
                    table.CheckConstraint("ck_chord_voicings_frets_len", "cardinality(frets) = 6");
                    table.CheckConstraint("ck_chord_voicings_index", "\"index\" >= 0");
                    table.ForeignKey(
                        name: "fk_chord_voicings_chords_chord_id",
                        column: x => x.chord_id,
                        principalTable: "chords",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "scale_positions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    scale_id = table.Column<Guid>(type: "uuid", nullable: false),
                    index = table.Column<int>(type: "integer", nullable: false),
                    label = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    start_fret = table.Column<int>(type: "integer", nullable: false),
                    fret_count = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_scale_positions", x => x.id);
                    table.CheckConstraint("ck_scale_positions_fret_count", "fret_count BETWEEN 1 AND 24");
                    table.CheckConstraint("ck_scale_positions_start_fret", "start_fret BETWEEN 0 AND 24");
                    table.ForeignKey(
                        name: "fk_scale_positions_scales_scale_id",
                        column: x => x.scale_id,
                        principalTable: "scales",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "preset_blocks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    preset_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    effect_id = table.Column<Guid>(type: "uuid", nullable: true),
                    settings_json = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_preset_blocks", x => x.id);
                    table.ForeignKey(
                        name: "fk_preset_blocks_effects_effect_id",
                        column: x => x.effect_id,
                        principalTable: "effects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_preset_blocks_presets_preset_id",
                        column: x => x.preset_id,
                        principalTable: "presets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "songs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    artist_id = table.Column<Guid>(type: "uuid", nullable: false),
                    album_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tuning_id = table.Column<Guid>(type: "uuid", nullable: true),
                    genre = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    difficulty = table.Column<int>(type: "integer", nullable: false),
                    capo = table.Column<int>(type: "integer", nullable: true),
                    key = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    bpm = table.Column<int>(type: "integer", nullable: true),
                    year = table.Column<int>(type: "integer", nullable: true),
                    duration_seconds = table.Column<int>(type: "integer", nullable: true),
                    description = table.Column<string>(type: "jsonb", nullable: true),
                    thumbnail_key = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    tags = table.Column<string[]>(type: "text[]", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_songs", x => x.id);
                    table.CheckConstraint("ck_songs_bpm", "bpm IS NULL OR bpm BETWEEN 20 AND 400");
                    table.CheckConstraint("ck_songs_capo", "capo IS NULL OR capo BETWEEN 0 AND 12");
                    table.CheckConstraint("ck_songs_difficulty", "difficulty BETWEEN 1 AND 5");
                    table.CheckConstraint("ck_songs_slug", "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
                    table.ForeignKey(
                        name: "fk_songs_albums_album_id",
                        column: x => x.album_id,
                        principalTable: "albums",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_songs_artists_artist_id",
                        column: x => x.artist_id,
                        principalTable: "artists",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_songs_tunings_tuning_id",
                        column: x => x.tuning_id,
                        principalTable: "tunings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "scale_position_notes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    scale_position_id = table.Column<Guid>(type: "uuid", nullable: false),
                    @string = table.Column<int>(name: "string", type: "integer", nullable: false),
                    fret = table.Column<int>(type: "integer", nullable: false),
                    interval = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    is_root = table.Column<bool>(type: "boolean", nullable: false),
                    finger = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_scale_position_notes", x => x.id);
                    table.CheckConstraint("ck_scale_position_notes_fret", "fret BETWEEN 0 AND 24");
                    table.CheckConstraint("ck_scale_position_notes_string", "string BETWEEN 1 AND 6");
                    table.ForeignKey(
                        name: "fk_scale_position_notes_scale_positions_scale_position_id",
                        column: x => x.scale_position_id,
                        principalTable: "scale_positions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_albums_artist_id_title",
                table: "albums",
                columns: new[] { "artist_id", "title" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_amps_slug",
                table: "amps",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_artists_name",
                table: "artists",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_artists_slug",
                table: "artists",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_chord_voicings_chord_id_index",
                table: "chord_voicings",
                columns: new[] { "chord_id", "index" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_chords_root_quality",
                table: "chords",
                columns: new[] { "root", "quality" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_effects_kind",
                table: "effects",
                column: "kind");

            migrationBuilder.CreateIndex(
                name: "ix_effects_slug",
                table: "effects",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_preset_blocks_effect_id",
                table: "preset_blocks",
                column: "effect_id");

            migrationBuilder.CreateIndex(
                name: "ix_preset_blocks_preset_id_order",
                table: "preset_blocks",
                columns: new[] { "preset_id", "order" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_presets_amp_id",
                table: "presets",
                column: "amp_id");

            migrationBuilder.CreateIndex(
                name: "ix_presets_slug",
                table: "presets",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_scale_position_notes_scale_position_id_string_fret",
                table: "scale_position_notes",
                columns: new[] { "scale_position_id", "string", "fret" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_scale_positions_scale_id_index",
                table: "scale_positions",
                columns: new[] { "scale_id", "index" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_scales_family",
                table: "scales",
                column: "family");

            migrationBuilder.CreateIndex(
                name: "ix_scales_slug",
                table: "scales",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_songs_album_id",
                table: "songs",
                column: "album_id");

            migrationBuilder.CreateIndex(
                name: "ix_songs_artist_id",
                table: "songs",
                column: "artist_id");

            migrationBuilder.CreateIndex(
                name: "ix_songs_difficulty",
                table: "songs",
                column: "difficulty");

            migrationBuilder.CreateIndex(
                name: "ix_songs_genre",
                table: "songs",
                column: "genre");

            migrationBuilder.CreateIndex(
                name: "ix_songs_slug",
                table: "songs",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_songs_tags",
                table: "songs",
                column: "tags")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "ix_songs_tuning_id",
                table: "songs",
                column: "tuning_id");

            migrationBuilder.CreateIndex(
                name: "ix_techniques_slug",
                table: "techniques",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_tunings_name",
                table: "tunings",
                column: "name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chord_voicings");

            migrationBuilder.DropTable(
                name: "preset_blocks");

            migrationBuilder.DropTable(
                name: "scale_position_notes");

            migrationBuilder.DropTable(
                name: "songs");

            migrationBuilder.DropTable(
                name: "techniques");

            migrationBuilder.DropTable(
                name: "chords");

            migrationBuilder.DropTable(
                name: "effects");

            migrationBuilder.DropTable(
                name: "presets");

            migrationBuilder.DropTable(
                name: "scale_positions");

            migrationBuilder.DropTable(
                name: "albums");

            migrationBuilder.DropTable(
                name: "tunings");

            migrationBuilder.DropTable(
                name: "amps");

            migrationBuilder.DropTable(
                name: "scales");

            migrationBuilder.DropTable(
                name: "artists");
        }
    }
}
