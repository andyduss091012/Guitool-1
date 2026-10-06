using Microsoft.AspNetCore.Mvc;

namespace GuitarApp.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected ObjectResult NotFoundProblem(string what) =>
        Problem(statusCode: StatusCodes.Status404NotFound, title: "Not found", detail: what);
}
