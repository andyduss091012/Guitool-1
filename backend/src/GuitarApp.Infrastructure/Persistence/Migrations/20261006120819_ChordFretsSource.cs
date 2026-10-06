using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GuitarApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChordFretsSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "frets_source",
                table: "chord_voicings",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "ck_chord_voicings_frets_source",
                table: "chord_voicings",
                sql: "frets_source IS NULL OR (frets IS NOT NULL AND frets_source IN ('authored', 'chords-db'))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_chord_voicings_frets_source",
                table: "chord_voicings");

            migrationBuilder.DropColumn(
                name: "frets_source",
                table: "chord_voicings");
        }
    }
}
