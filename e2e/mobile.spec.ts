import { test, expect, PRODUCTS } from "./fixtures";

test.describe("Mobile", () => {
  test("menu lateral navega para uma categoria", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Vitaminas" }).click();
    await expect(page).toHaveURL(/categoria=vitaminas/);
    await expect(page.getByRole("navigation", { name: "Menu principal" })).toBeHidden();
  });

  test("sem rolagem horizontal e filtros em modal", async ({ page }) => {
    await page.goto("/produtos");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: /Filtros/ }).click();
    await expect(page.getByRole("dialog", { name: "Filtrar produtos" })).toBeVisible();
  });

  test("adicionar ao carrinho atualiza o contador", async ({ page }) => {
    await page.goto(`/produtos/${PRODUCTS.highStockA.slug}`);
    await page.getByRole("button", { name: /Adicionar ao carrinho/ }).click();
    await expect(page.getByRole("link", { name: /Carrinho com 1 item/ })).toBeVisible();
  });
});
