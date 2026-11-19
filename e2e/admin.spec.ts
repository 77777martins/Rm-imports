import { test, expect, loginAs, uniqueSuffix } from "./fixtures";

test.describe("Painel administrativo", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("dashboard exibe métricas e gráficos", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("Faturamento total")).toBeVisible();
    await expect(page.getByText("Faturamento diário — últimos 30 dias")).toBeVisible();
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
  });

  test("CRUD de produto com edição rápida, desativação e exclusão", async ({ page }) => {
    const id = uniqueSuffix();
    const name = `Produto E2E ${id}`;
    await page.goto("/admin/produtos/novo");
    await page.getByRole("button", { name: /Cadastrar produto/ }).click();
    await expect(page.getByText("Nome deve ter ao menos 3 caracteres.")).toBeVisible();

    await page.getByLabel("Nome", { exact: false }).first().fill(name);
    await page.getByLabel("Código (SKU)").fill(`E2E-${id}`.slice(0, 32));
    await page.getByLabel("Marca").fill("Marca E2E");
    await page.getByLabel("Categoria").selectOption({ index: 1 });
    await page.getByLabel("Descrição").fill("Produto criado pela suíte E2E.");
    await page.getByRole("textbox", { name: /^Preço\s*\*?$/ }).fill("49,90");
    await page.getByLabel("Estoque (demonstrativo)").fill("25");
    await page.getByRole("textbox", { name: "Valor 1" }).fill("Pote 60 cápsulas");
    await page.getByRole("button", { name: /Cadastrar produto/ }).click();
    await expect(page).toHaveURL(/\/admin\/produtos$/);

    await page.getByRole("searchbox", { name: /Buscar por nome/ }).fill(name);
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Edição rápida de ${name}` }).click();
    await page.getByRole("dialog").getByRole("textbox", { name: /^Preço promocional/ }).fill("59,90");
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("O preço promocional deve ser menor que o preço normal.")).toBeVisible();
    await page.getByRole("dialog").getByRole("textbox", { name: /^Preço promocional/ }).fill("39,90");
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Produto atualizado.")).toBeVisible();

    await page.getByRole("switch", { name: `Ativar ${name}` }).click();
    await expect(page.getByText("Produto desativado.")).toBeVisible();

    await page.getByRole("button", { name: `Excluir ${name}` }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText("Produto excluído.")).toBeVisible();
  });

  test("produto já vendido não pode ser excluído", async ({ page }) => {
    await page.goto("/admin/produtos");
    await page.getByRole("searchbox", { name: /Buscar por nome/ }).fill("Whey Isolado");
    await page.getByRole("button", { name: /Excluir Whey Isolado/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText(/possui pedidos vinculados/)).toBeVisible();
  });

  test("categoria: criar e excluir", async ({ page }) => {
    const name = `Categoria ${uniqueSuffix()}`;
    await page.goto("/admin/categorias");
    await page.getByRole("button", { name: /Nova categoria/ }).click();
    await page.getByRole("dialog").getByLabel("Nome").fill(name);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Categoria criada.")).toBeVisible();
    await page.getByRole("button", { name: `Excluir ${name}` }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText("Categoria excluída.")).toBeVisible();
  });

  test("pedido: status avança e fica registrado no histórico", async ({ page }) => {
    await page.goto("/admin/pedidos");
    await page.getByLabel("Filtrar por status").selectOption("PAID");
    await page.getByRole("link", { name: /Ver pedido/ }).first().click();
    const note = `Separação E2E ${uniqueSuffix()}`;
    await page.getByLabel("Novo status").selectOption("PROCESSING");
    await page.getByLabel("Observação").fill(note);
    await page.getByRole("button", { name: "Atualizar status" }).click();
    await expect(page.getByText(/Status alterado/)).toBeVisible();
    await expect(page.getByText(note)).toBeVisible();
  });

  test("clientes: lista e detalhe com histórico", async ({ page }) => {
    await page.goto("/admin/clientes");
    await page.getByRole("link", { name: "Ana Souza", exact: true }).first().click();
    await expect(page.getByText("Histórico de pedidos")).toBeVisible();
  });

  test("configurações: cupom criado/excluído e loja salva", async ({ page }) => {
    const code = `E2E${uniqueSuffix()}`.slice(0, 30);
    await page.goto("/admin/configuracoes");
    await page.getByRole("tab", { name: "Cupons" }).click();
    await page.getByRole("button", { name: /Novo cupom/ }).click();
    await page.getByRole("dialog").getByLabel("Código").fill(code);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Cupom criado.")).toBeVisible();
    await page.getByRole("button", { name: `Excluir ${code}` }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText("Cupom excluído.")).toBeVisible();

    await page.getByRole("tab", { name: "Loja" }).click();
    await page.getByRole("button", { name: /Salvar configurações/ }).click();
    await expect(page.getByText(/Configurações salvas/)).toBeVisible();
  });
});
