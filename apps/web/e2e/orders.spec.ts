import { test, expect } from "@playwright/test"

test.describe("Orders page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/orders")
  })

  test("loads and displays orders table", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible()
    await expect(page.getByRole("table")).toBeVisible()

    // Should have at least one row in the table body
    const rows = page.locator("table tbody tr")
    await expect(rows.first()).toBeVisible()
  })

  test("search filters results", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search by name or ID...")
    await searchInput.fill("nonexistent-order-xyz")

    // Wait for the debounced URL update
    await page.waitForURL(/search=nonexistent-order-xyz/)

    // Should show empty state
    await expect(page.getByText("No orders found")).toBeVisible()
  })

  test("search clears and shows all results again", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search by name or ID...")

    await searchInput.fill("nonexistent-order-xyz")
    await page.waitForURL(/search=nonexistent-order-xyz/)
    await expect(page.getByText("No orders found")).toBeVisible()

    await searchInput.clear()
    await page.waitForURL((url) => !url.searchParams.has("search"))

    await expect(page.getByRole("table")).toBeVisible()
  })

  test("status filter narrows results", async ({ page }) => {
    // Get initial row count
    const initialRows = await page.locator("table tbody tr").count()

    // Select "New" status filter
    await page.getByRole("combobox").click()
    await page.getByRole("option", { name: "New" }).click()

    await page.waitForURL(/status=New/)

    // Filtered rows should be fewer or equal
    const filteredRows = await page.locator("table tbody tr").count()
    expect(filteredRows).toBeLessThanOrEqual(initialRows)

    // All visible status badges should be "New"
    const badges = page.locator("table tbody tr [data-slot='badge']")
    const badgeCount = await badges.count()
    for (let i = 0; i < badgeCount; i++) {
      await expect(badges.nth(i)).toHaveText("New")
    }
  })

  test("sort toggles between newest and oldest first", async ({ page }) => {
    // Default sort is "Newest first"
    await expect(page.getByRole("button", { name: /Newest first/ })).toBeVisible()

    // Click to toggle
    await page.getByRole("button", { name: /Newest first/ }).click()
    await expect(page.getByRole("button", { name: /Oldest first/ })).toBeVisible()

    // Click again to go back
    await page.getByRole("button", { name: /Oldest first/ }).click()
    await expect(page.getByRole("button", { name: /Newest first/ })).toBeVisible()
  })

  test("pagination navigates between pages", async ({ page }) => {
    // Should show pagination with "Showing" text
    const showingText = page.getByText(/Showing/)
    await expect(showingText).toBeVisible()

    // Click page 2
    const page2Button = page.getByRole("button", { name: "2", exact: true })
    if (await page2Button.isVisible()) {
      await page2Button.click()
      await page.waitForURL(/page=2/)
      await expect(page.getByText(/Showing/)).toBeVisible()
    }
  })
})
