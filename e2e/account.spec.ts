import { test, expect, loginAs, uniqueSuffix } from "./fixtures";

test.describe("Área do cliente", () => {
  test("cadastro valida campos e cria conta", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("A senha deve ter ao menos 8 caracteres.")).toBeVisible();

    const email = `e2e.${uniqueSuffix().toLowerCase()}@exemplo.demo`;
    await page.getByRole("textbox", { name: "Nome completo" }).fill("Cliente E2E");
    await page.getByRole("textbox", { name: "E-mail" }).fill(email);
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("Senha123");
    await page.getByRole("textbox", { name: "Confirmar senha" }).fill("Senha123");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/conta$/);
    await expect(page.getByText(email)).toBeVisible();
  });

  test("login com senha errada mostra mensagem genérica", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByRole("textbox", { name: "E-mail" }).fill("cliente@medfacil.demo");
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("SenhaErrada1");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  });

  test("recuperação de senha simulada gera link de uso único", async ({ page }) => {
    // Conta própria do teste, para não alterar a senha das contas demo.
    const email = `reset.${uniqueSuffix().toLowerCase()}@exemplo.demo`;
    const origin = new URL(test.info().project.use.baseURL!).origin;
    const created = await page.context().request.post("/api/auth/register", {
      data: { name: "Reset E2E", email, password: "Senha123", confirmPassword: "Senha123", acceptTerms: true },
      headers: { origin },
    });
    expect(created.ok()).toBeTruthy();
    await page.context().request.post("/api/auth/logout", { headers: { origin } });

    await page.goto("/recuperar-senha");
    await page.getByLabel("E-mail cadastrado").fill(email);
    await page.getByRole("button", { name: /Enviar link/ }).click();
    await page.getByRole("link", { name: "Redefinir minha senha" }).click();
    await page.getByRole("textbox", { name: "Nova senha", exact: true }).fill("NovaSenha9");
    await page.getByRole("textbox", { name: "Confirmar nova senha" }).fill("NovaSenha9");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(page).toHaveURL(/\/entrar$/);

    await page.getByRole("textbox", { name: "E-mail" }).fill(email);
    await page.getByRole("textbox", { name: "Senha", exact: true }).fill("NovaSenha9");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/conta$/);
  });

  test("perfil é atualizado e histórico de pedidos abre o detalhe", async ({ page }) => {
    await loginAs(page, "customer");
    await page.goto("/conta");
    // Número diferente a cada execução: o botão só habilita quando há alteração real.
    const phone = `(11) 9${String(Date.now()).slice(-4)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    await page.getByRole("textbox", { name: "Celular" }).fill(phone);
    await page.getByRole("button", { name: /Salvar alterações/ }).click();
    await expect(page.getByText("Dados atualizados com sucesso!")).toBeVisible();

    await page.goto("/conta/pedidos");
    await page.locator('a[href^="/conta/pedidos/MF-"]').first().click();
    await expect(page.getByText("Acompanhamento")).toBeVisible();
    await expect(page.getByText("Itens do pedido")).toBeVisible();
  });

  test("cliente não acessa o painel administrativo", async ({ page }) => {
    await loginAs(page, "customer");
    await page.goto("/admin");
    await expect(page).toHaveURL(/acesso=negado/);
  });
});
