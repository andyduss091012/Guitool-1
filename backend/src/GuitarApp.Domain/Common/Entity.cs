namespace GuitarApp.Domain.Common;

/// <summary>
/// Base class for persisted entities. Ids are client-generated (time-ordered UUIDv7);
/// CreatedAt/UpdatedAt are stamped by the persistence layer, never by callers.
/// </summary>
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.CreateVersion7();
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
}
