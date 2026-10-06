using GuitarApp.Application.Common;

namespace GuitarApp.Application.Tests;

public class PagingTests
{
    [Fact]
    public void Defaults()
    {
        var request = new PageRequest();
        request.Page.Should().Be(1);
        request.PageSize.Should().Be(PageRequest.DefaultPageSize);
        request.Skip.Should().Be(0);
    }

    [Theory]
    [InlineData(0, 10, 1, 10)]
    [InlineData(-5, 10, 1, 10)]
    [InlineData(3, 0, 3, PageRequest.DefaultPageSize)]
    [InlineData(2, 1000, 2, PageRequest.MaxPageSize)]
    public void Out_of_range_values_are_clamped(int page, int size, int expectedPage, int expectedSize)
    {
        var request = new PageRequest(page, size);
        request.Page.Should().Be(expectedPage);
        request.PageSize.Should().Be(expectedSize);
    }

    [Fact]
    public void Skip_is_offset_of_page() =>
        new PageRequest(3, 20).Skip.Should().Be(40);

    [Theory]
    [InlineData(0, 20, 0)]
    [InlineData(1, 20, 1)]
    [InlineData(20, 20, 1)]
    [InlineData(21, 20, 2)]
    [InlineData(41, 20, 3)]
    public void Total_pages_rounds_up(long total, int pageSize, int expectedPages) =>
        new PagedResult<int>(Array.Empty<int>(), 1, pageSize, total).TotalPages.Should().Be(expectedPages);

    [Fact]
    public void HasNextPage_is_false_on_the_last_page()
    {
        new PagedResult<int>(Array.Empty<int>(), 2, 20, 41).HasNextPage.Should().BeTrue();
        new PagedResult<int>(Array.Empty<int>(), 3, 20, 41).HasNextPage.Should().BeFalse();
    }

    [Fact]
    public void Map_projects_items_and_keeps_paging()
    {
        var source = PagedResult<int>.Create(new[] { 1, 2, 3 }, new PageRequest(2, 3), 9);
        var mapped = source.Map(i => i * 10);
        mapped.Items.Should().Equal(10, 20, 30);
        mapped.Page.Should().Be(2);
        mapped.TotalCount.Should().Be(9);
    }
}
