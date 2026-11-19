import { test, expect, loginAs, PRODUCTS } from "./fixtures";
import type { Page } from "@playwright/test";

async function addToCart(page: Page, slug: string, extra = 0) {
  await page.goto(`/produtos/${slug}`);
  for (let i = 0; i < extra; i++) await page.getByRole("button", { name: "Aumentar quantidade" }).click();
  await page.getByRole("button", { name: /Adicionar ao carrinho/ }).click();
  await expect(page.getByRole("button", { name: /Adicionado/ })).toBeVisible();
}

async function fillAddress(page: Page) {
  await expect(page.getByLabel("Destinatário")).not.toHaveValue("");
  await page.getByRole("textbox", { name: /^CEP/ }).fill("01310-100");
  await page.getByLabel("Rua / Avenida").fill("Av. Paulista");
  await page.getByRole("textbox", { name: /^Número/ }).fill("1000");
  await page.getByLabel("Bairro").fill("Bela Vista");
  await page.getByLabel("Cidade").fill("São Paulo");
}

test.describe("Fluxo de compra", () => {
  test("checkout exige login e retorna ao checkout após entrar", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/entrar\?next=/);
    await page.getByRole("button", { name: "Cliente" }).click();
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test("carrinho: quantidades, cupom válido/expirado e frete", async ({ page }) => {
    await addToCart(page, PRODUCTS.highStockA.slug, 1);
    await page.goto("/carrinho");
    await expect(page.getByText("Resumo do pedido")).toBeVisible();

    await page.getByRole("textbox", { name: "Cupom de desconto" }).fill("EXPIRADO5");
    await page.getByRole("button", { name: "Aplicar", exact: true }).click();
    await expect(page.getByText("Cupom expirado.")).toBeVisible();

    await page.getByRole("textbox", { name: "Cupom de desconto" }).fill("BEMVINDO10");
    await page.getByRole("button", { name: "Aplicar", exact: true }).click();
    await expect(page.getByText(/Desconto/)).toBeVisible();

    await page.getByRole("textbox", { name: "CEP" }).fill("90010-150");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByText("Rio Grande do Sul")).toBeVisible();

    await page.getByRole("button", { name: `Remover ${PRODUCTS.highStockA.name}` }).click();
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
  });

  test("compra via PIX com confirmação simulada", async ({ page }) => {
    await loginAs(page, "customer");
    await addToCart(page, PRODUCTS.highStockB.slug);
    await page.goto("/checkout");
    await fillAddress(page);
    await page.getByRole("button", { name: /Gerar PIX/ }).click();

    await expect(page).toHaveURL(/\/pedido\/MF-\d{8}-[A-Z0-9]{6}$/);
    await expect(page.getByRole("heading", { name: /Falta só o pagamento/ })).toBeVisible();
    await expect(page.getByRole("img", { name: "QR Code PIX fictício" })).toBeVisible();
    await page.getByRole("button", { name: "Simular pagamento confirmado" }).click();
    await expect(page.getByRole("heading", { name: "Pedido confirmado!" })).toBeVisible();
    await expect(page.getByText("Pagamento aprovado").first()).toBeVisible();
  });

  test("cartão final 0002 é recusado e cartão válido é aprovado", async ({ page }) => {
    await loginAs(page, "customer");
    await addToCart(page, PRODUCTS.highStockC.slug);
    await page.goto("/checkout");
    await fillAddress(page);
    await page.getByText("Cartão de crédito").click();

    await page.getByRole("button", { name: /Recusado/ }).click();
    await page.getByRole("button", { name: /Pagar e confirmar/ }).click();
    await expect(page.getByText(/Cartão recusado/)).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);

    await page.getByRole("button", { name: /Visa aprovado/ }).click();
    await page.getByRole("button", { name: /Pagar e confirmar/ }).click();
    await expect(page.getByRole("heading", { name: "Pedido confirmado!" })).toBeVisible();
    await expect(page.getByText(/visa •••• 1111/i)).toBeVisible();
  });

  test("validação do cartão no cliente", async ({ page }) => {
    await loginAs(page, "customer");
    await addToCart(page, PRODUCTS.highStockA.slug);
    await page.goto("/checkout");
    await fillAddress(page);
    await page.getByText("Cartão de crédito").click();
    await page.getByLabel("Número do cartão").fill("4111 1111 1111 1112");
    await page.getByRole("button", { name: /Pagar e confirmar/ }).click();
    await expect(page.getByText("Número de cartão inválido.")).toBeVisible();
    await expect(page.getByText("Validade inválida (MM/AA).")).toBeVisible();
  });
});
