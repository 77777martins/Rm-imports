import { test, expect, PRODUCTS } from "./fixtures";

test.describe("Vitrine e catálogo", () => {
  test("home exibe identificação de demonstração, banners e vitrines", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("note")).toContainText("Projeto de portfólio");
    await expect(page.getByRole("region", { name: "Promoções" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ofertas do dia" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mais vendidos" })).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("demonstração técnica");
  });

  test("busca com autocomplete leva ao produto", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("combobox", { name: "Buscar produtos" }).first().fill("creme dental");
    const option = page.getByRole("option").filter({ hasText: PRODUCTS.highStockC.name });
    await option.click();
    await expect(page).toHaveURL(new RegExp(`/produtos/${PRODUCTS.highStockC.slug}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(PRODUCTS.highStockC.name);
  });

  test("filtros, ordenação e paginação refletem na URL", async ({ page }) => {
    await page.goto("/produtos");
    await expect(page.getByText(/56 produtos encontrados|\d+ produtos encontrados/)).toBeVisible();
    await page.getByRole("button", { name: "Vitaminas" }).first().click();
    await expect(page).toHaveURL(/categoria=vitaminas/);
    await page.getByLabel("Ordenar por").selectOption("price-asc");
    await expect(page).toHaveURL(/ordem=price-asc/);

    const prices = await page.locator("article").evaluateAll((cards) =>
      cards.map((c) => {
        const txt = [...c.querySelectorAll("span")].map((s) => s.textContent ?? "").find((t) => /^R\$\s?[\d.,]+$/.test(t.trim()) && !t.includes("x"));
        return Number((txt ?? "0").replace(/[^\d,]/g, "").replace(",", "."));
      }),
    );
    expect(prices.length).toBeGreaterThan(0);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    await page.goto("/produtos?pagina=2");
    await expect(page.getByRole("link", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("busca sem resultados mostra estado vazio", async ({ page }) => {
    await page.goto("/produtos?q=produto-que-nao-existe-xyz");
    await expect(page.getByText("Nenhum produto encontrado")).toBeVisible();
  });

  test("página de produto mostra informações técnicas fictícias e calcula frete", async ({ page }) => {
    await page.goto(`/produtos/${PRODUCTS.highStockA.slug}`);
    await expect(page.getByText("Dados FICTÍCIOS para demonstração")).toBeVisible();
    await page.getByRole("textbox", { name: "CEP" }).fill("01310-100");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByText(/Grande São Paulo/)).toBeVisible();
  });

  test("produto inexistente retorna 404 amigável", async ({ page }) => {
    const res = await page.goto("/produtos/nao-existe-123");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Página não encontrada")).toBeVisible();
  });
});
