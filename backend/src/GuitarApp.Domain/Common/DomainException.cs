namespace GuitarApp.Domain.Common;

/// <summary>Thrown when a domain invariant is violated. The API maps it to HTTP 400.</summary>
public sealed class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}
