/**
 * Testes de integração da API (servidor + banco reais).
 * Pré-requisitos: banco com seed aplicado e app rodando.
 *   API_BASE_URL=http://localhost:3000 npm run test:api
 */
import { beforeAll, describe, expect, it } from "vitest";

const BASE = process.env.API_BASE_URL;
const run = BASE ? describe : describe.skip;

class Client {
  jar = new Map<string, string>();
  async req(path: string, init: RequestInit & { json?: unknown } = {}) {
    const headers = new Headers(init.headers);
    if (init.json !== undefined) headers.set("content-type", "application/json");
    headers.set("origin", BASE!);
    if (this.jar.size) headers.set("cookie", [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "));
    const res = await fetch(`${BASE}${path}`, { ...init, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body, redirect: "manual" });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const [k, ...v] = pair.split("=");
      const value = v.join("=");
      if (value) this.jar.set(k, value);
      else this.jar.delete(k);
    }
    const body = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
    return { status: res.status, body };
  }
}

run("API MedFácil", () => {
  const customer = new Client();
  const admin = new Client();
  const email = `teste.${Date.now()}@exemplo.demo`;
  let productId = "";

  beforeAll(async () => {
    const r = await admin.req("/api/auth/login", { method: "POST", json: { email: "admin@medfacil.demo", password: "Admin@12345" } });
    expect(r.status).toBe(200);
  });

  it("catálogo: busca, filtro e paginação", async () => {
    const all = await customer.req("/api/products?pagina=1");
    expect(all.status).toBe(200);
    expect(all.body.total).toBeGreaterThanOrEqual(50);
    expect(all.body.items).toHaveLength(12);
    const vit = await customer.req("/api/products?categoria=vitaminas&ordem=price-asc");
    expect(vit.body.items.every((p: { category: { slug: string } }) => p.category.slug === "vitaminas")).toBe(true);
    const prices = vit.body.items.map((p: { finalPriceCents: number }) => p.finalPriceCents);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    productId = all.body.items.find((p: { stock: number }) => p.stock > 5).id;
  });

  it("bloqueia CSRF (origem externa)", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: "{}" });
    expect(res.status).toBe(403);
  });

  it("rotas protegidas exigem autenticação e papel", async () => {
    expect((await customer.req("/api/account/profile")).status).toBe(401);
    expect((await customer.req("/api/admin/dashboard")).status).toBe(401);
  });

  it("cadastro valida dados e cria sessão", async () => {
    const bad = await customer.req("/api/auth/register", { method: "POST", json: { name: "X", email: "x", password: "1" } });
    expect(bad.status).toBe(422);
    const ok = await customer.req("/api/auth/register", {
      method: "POST",
      json: { name: "Cliente Teste", email, password: "Senha123", confirmPassword: "Senha123", acceptTerms: true },
    });
    expect(ok.status).toBe(201);
    expect(ok.body.user).not.toHaveProperty("passwordHash");
    expect((await customer.req("/api/auth/me")).status).toBe(200);
    expect((await customer.req("/api/admin/dashboard")).status).toBe(403);
  });

  it("orçamento do carrinho usa preço do servidor + cupom + frete", async () => {
    const q = await customer.req("/api/cart/quote", {
      method: "POST",
      json: { items: [{ productId, quantity: 2 }], couponCode: "BEMVINDO10", zipCode: "01310-100" },
    });
    expect(q.status).toBe(200);
    const line = q.body.lines[0];
    expect(q.body.totals.subtotalCents).toBe(line.unitPriceCents * 2);
    expect(q.body.coupon.valid).toBe(true);
    expect(q.body.totals.discountCents).toBe(Math.round(q.body.totals.subtotalCents * 0.1));
    const expired = await customer.req("/api/cart/quote", { method: "POST", json: { items: [{ productId, quantity: 1 }], couponCode: "EXPIRADO5" } });
    expect(expired.body.coupon.valid).toBe(false);
  });

  const address = { zipCode: "01310-100", street: "Av. Paulista", number: "1000", district: "Bela Vista", city: "São Paulo", state: "SP" };

  it("checkout PIX: cria pedido, baixa estoque e confirma pagamento simulado", async () => {
    const before = (await admin.req(`/api/admin/products/${productId}`)).body.product.stock;
    const r = await customer.req("/api/orders", {
      method: "POST",
      json: { items: [{ productId, quantity: 1 }], recipientName: "Cliente Teste", address, payment: { method: "PIX" } },
    });
    expect(r.status).toBe(200);
    expect(r.body.order.status).toBe("PENDING_PAYMENT");
    const after = (await admin.req(`/api/admin/products/${productId}`)).body.product.stock;
    expect(after).toBe(before - 1);
    const paid = await customer.req(`/api/orders/${r.body.order.number}/pix`, { method: "POST" });
    expect(paid.body.order.status).toBe("PAID");
    expect(paid.body.order.statusHistory).toHaveLength(2);
  });

  it("checkout cartão: recusa final 0002 e aprova cartão válido", async () => {
    const card = (last4: string) => ({ method: "CARD", holderName: "CLIENTE TESTE", brand: "visa", last4, token: "tok_demo_abcdefghijklmnop1234", installments: 1 });
    const declined = await customer.req("/api/orders", { method: "POST", json: { items: [{ productId, quantity: 1 }], recipientName: "Cliente", address, payment: card("0002") } });
    expect(declined.status).toBe(402);
    const ok = await customer.req("/api/orders", { method: "POST", json: { items: [{ productId, quantity: 1 }], recipientName: "Cliente", address, payment: card("1111") } });
    expect(ok.body.order.status).toBe("PAID");
  });

  it("não permite comprar acima do estoque", async () => {
    const r = await customer.req("/api/orders", {
      method: "POST",
      json: { items: Array.from({ length: 40 }, () => ({ productId, quantity: 10 })), recipientName: "Cliente", address, payment: { method: "PIX" } },
    });
    expect(r.status).toBe(409);
  });

  it("histórico do cliente e isolamento entre clientes (IDOR)", async () => {
    const mine = await customer.req("/api/account/orders");
    expect(mine.body.total).toBe(2);
    const other = await admin.req("/api/admin/orders?pageSize=20");
    const foreignNumber = other.body.items.find((o: { user: { email: string } }) => o.user.email !== email).number;
    expect((await customer.req(`/api/account/orders/${foreignNumber}`)).status).toBe(404);
  });

  it("admin: altera status com histórico e cancelamento devolve estoque", async () => {
    const orders = await admin.req(`/api/admin/orders?q=${encodeURIComponent(email)}`);
    const pixOrder = orders.body.items.find((o: { paymentMethod: string }) => o.paymentMethod === "PIX");
    const invalid = await admin.req(`/api/admin/orders/${pixOrder.id}`, { method: "PATCH", json: { status: "DELIVERED" } });
    expect(invalid.status).toBe(400);
    const stockBefore = (await admin.req(`/api/admin/products/${productId}`)).body.product.stock;
    const canceled = await admin.req(`/api/admin/orders/${pixOrder.id}`, { method: "PATCH", json: { status: "CANCELED", note: "Teste" } });
    expect(canceled.body.order.status).toBe("CANCELED");
    expect((await admin.req(`/api/admin/products/${productId}`)).body.product.stock).toBe(stockBefore + 1);
  });

  it("admin: CRUD de produto e regra de exclusão", async () => {
    const cats = await admin.req("/api/admin/categories");
    const payload = {
      name: `Produto Teste ${Date.now()}`, sku: `TST-${Date.now() % 100000}`, brand: "Marca Demo", description: "Descrição de teste do produto.",
      categoryId: cats.body.items[0].id, priceCents: 1990, salePriceCents: null, stock: 5, imageUrl: "", packaging: "BOX",
      accentColor: "#16a34a", isActive: true, isFeatured: false, technicalInfo: [{ label: "Uso", value: "Teste" }],
    };
    const created = await admin.req("/api/admin/products", { method: "POST", json: payload });
    expect(created.status).toBe(200);
    const id = created.body.product.id;
    const patched = await admin.req(`/api/admin/products/${id}`, { method: "PATCH", json: { priceCents: 2990, salePriceCents: 2490, stock: 50 } });
    expect(patched.body.product.finalPriceCents).toBe(2490);
    const badSale = await admin.req(`/api/admin/products/${id}`, { method: "PATCH", json: { salePriceCents: 5000 } });
    expect(badSale.status).toBe(400);
    expect((await admin.req(`/api/admin/products/${id}`, { method: "DELETE" })).status).toBe(200);
    expect((await admin.req(`/api/admin/products/${productId}`, { method: "DELETE" })).status).toBe(409);
  });

  it("admin: dashboard agregado", async () => {
    const d = await admin.req("/api/admin/dashboard");
    expect(d.status).toBe(200);
    expect(d.body.daily).toHaveLength(30);
    expect(d.body.totals.products).toBeGreaterThanOrEqual(56);
  });

  it("refresh token rotativo e detecção de reuso", async () => {
    const c = new Client();
    await c.req("/api/auth/login", { method: "POST", json: { email, password: "Senha123" } });
    const stolen = c.jar.get("mf_rt")!;
    const first = await c.req("/api/auth/refresh", { method: "POST" });
    expect(first.status).toBe(200);
    expect(c.jar.get("mf_rt")).not.toBe(stolen);

    // Atacante reapresenta o token antigo → negado e TODAS as sessões revogadas.
    const attacker = new Client();
    attacker.jar.set("mf_rt", stolen);
    expect((await attacker.req("/api/auth/refresh", { method: "POST" })).status).toBe(401);
    expect((await c.req("/api/auth/refresh", { method: "POST" })).status).toBe(401);
  });

  it("recuperação de senha simulada", async () => {
    const r = await customer.req("/api/auth/forgot-password", { method: "POST", json: { email } });
    expect(r.status).toBe(200);
    const token = new URL(r.body.demoResetUrl).searchParams.get("token");
    const reset = await customer.req("/api/auth/reset-password", { method: "POST", json: { token, password: "NovaSenha1", confirmPassword: "NovaSenha1" } });
    expect(reset.status).toBe(200);
    const reuse = await customer.req("/api/auth/reset-password", { method: "POST", json: { token, password: "NovaSenha1", confirmPassword: "NovaSenha1" } });
    expect(reuse.status).toBe(400);
    const login = await new Client().req("/api/auth/login", { method: "POST", json: { email, password: "NovaSenha1" } });
    expect(login.status).toBe(200);
  });
});
