using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuitarApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChordFingersAndConcepts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_chord_voicings_frets_len",
                table: "chord_voicings");

            migrationBuilder.AlterColumn<int[]>(
                name: "frets",
                table: "chord_voicings",
                type: "integer[]",
                nullable: true,
                oldClrType: typeof(int[]),
                oldType: "integer[]");

            migrationBuilder.AlterColumn<int>(
                name: "base_fret",
                table: "chord_voicings",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "music_concepts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    category = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    name = table.Column<string>(type: "jsonb", nullable: false),
                    aliases = table.Column<string[]>(type: "text[]", nullable: false),
                    description = table.Column<string>(type: "jsonb", nullable: false),
                    shapes_json = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamptz", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_music_concepts", x => x.id);
                    table.CheckConstraint("ck_music_concepts_kind", "kind IN ('chord', 'scale')");
                    table.CheckConstraint("ck_music_concepts_slug", "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'");
                });

            migrationBuilder.AddCheckConstraint(
                name: "ck_chord_voicings_frets_len",
                table: "chord_voicings",
                sql: "frets IS NULL OR cardinality(frets) = 6");

            migrationBuilder.AddCheckConstraint(
                name: "ck_chord_voicings_known",
                table: "chord_voicings",
                sql: "frets IS NOT NULL OR fingers IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "ix_music_concepts_kind",
                table: "music_concepts",
                column: "kind");

            migrationBuilder.CreateIndex(
                name: "ix_music_concepts_slug",
                table: "music_concepts",
                column: "slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "music_concepts");

            migrationBuilder.DropCheckConstraint(
                name: "ck_chord_voicings_frets_len",
                table: "chord_voicings");

            migrationBuilder.DropCheckConstraint(
                name: "ck_chord_voicings_known",
                table: "chord_voicings");

            migrationBuilder.AlterColumn<int[]>(
                name: "frets",
                table: "chord_voicings",
                type: "integer[]",
                nullable: false,
                defaultValue: new int[0],
                oldClrType: typeof(int[]),
                oldType: "integer[]",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "base_fret",
                table: "chord_voicings",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_chord_voicings_frets_len",
                table: "chord_voicings",
                sql: "cardinality(frets) = 6");
        }
    }
}
