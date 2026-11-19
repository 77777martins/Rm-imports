/**
 * Seed de demonstração — idempotente (limpa e recria os dados).
 * Executar: npm run db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { OrderStatus } from "../src/generated/prisma/enums";
import { addresses, categories, customers } from "./seed-data";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

// PRNG determinístico: o seed gera sempre os mesmos dados.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261118);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

function slugify(input: string) {
  return input.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@medfacil.demo").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";

  console.log("→ Limpando dados anteriores...");
  await prisma.$transaction([
    prisma.orderStatusHistory.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.user.deleteMany(),
    prisma.storeSettings.deleteMany(),
  ]);

  console.log("→ Configurações da loja e banners...");
  await prisma.storeSettings.create({ data: { id: "store" } });
  await prisma.banner.createMany({
    data: [
      { title: "Semana da Imunidade", subtitle: "Vitaminas fictícias com até 25% OFF. Use o cupom BEMVINDO10 na primeira compra.", ctaLabel: "Ver vitaminas", ctaHref: "/produtos?categoria=vitaminas", colorFrom: "#059669", colorTo: "#0284c7", sortOrder: 1 },
      { title: "Frete grátis acima de R$ 199", subtitle: "Para todo o Brasil — frete 100% simulado, sem custo real.", ctaLabel: "Aproveitar ofertas", ctaHref: "/produtos?promo=1", colorFrom: "#0369a1", colorTo: "#1e40af", sortOrder: 2 },
      { title: "Cuidados com a pele", subtitle: "Protetores e dermocosméticos demonstrativos para todos os tipos de pele.", ctaLabel: "Explorar", ctaHref: "/produtos?categoria=cuidados-com-a-pele", colorFrom: "#0d9488", colorTo: "#16a34a", sortOrder: 3 },
    ],
  });

  console.log("→ Cupons demonstrativos...");
  const now = Date.now();
  const coupons = await Promise.all([
    prisma.coupon.create({ data: { code: "BEMVINDO10", description: "10% de desconto na compra", type: "PERCENT", value: 10 } }),
    prisma.coupon.create({ data: { code: "MENOS20", description: "R$ 20 off em compras acima de R$ 120", type: "FIXED", value: 2000, minSubtotalCents: 12000 } }),
    prisma.coupon.create({ data: { code: "FRETEGRATIS", description: "Frete grátis em qualquer compra", type: "FREE_SHIPPING", value: 0, maxUses: 500 } }),
    prisma.coupon.create({ data: { code: "EXPIRADO5", description: "Cupom expirado (para testes)", type: "PERCENT", value: 5, expiresAt: new Date(now - 86_400_000) } }),
  ]);

  console.log("→ Usuários...");
  const [adminHash, customerHash] = await Promise.all([bcrypt.hash(adminPassword, 12), bcrypt.hash("Cliente@123", 12)]);
  await prisma.user.create({ data: { name: "Administrador Demo", email: adminEmail, passwordHash: adminHash, role: "ADMIN" } });
  const users = [];
  for (const [i, name] of customers.entries()) {
    const addr = addresses[i % addresses.length];
    const email = i === 0 ? "cliente@medfacil.demo" : `${slugify(name).replace(/-/g, ".")}@exemplo.demo`;
    users.push(
      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: customerHash,
          phone: `(11) 9${between(1000, 9999)}-${between(1000, 9999)}`,
          ...addr,
          number: String(between(10, 2000)),
          createdAt: new Date(now - between(10, 90) * 86_400_000),
        },
      }),
    );
  }

  console.log("→ Categorias e produtos...");
  const products: { id: string; name: string; sku: string; finalPriceCents: number }[] = [];
  for (const [ci, cat] of categories.entries()) {
    const category = await prisma.category.create({
      data: { name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description, sortOrder: ci },
    });
    for (const [pi, p] of cat.products.entries()) {
      const priceCents = Math.round(p.price * 100);
      const salePriceCents = p.sale ? Math.round(p.sale * 100) : null;
      const sku = `MF-${cat.prefix}-${String(pi + 1).padStart(3, "0")}`;
      const created = await prisma.product.create({
        data: {
          sku,
          name: p.name,
          slug: slugify(p.name),
          brand: p.brand,
          description: `${p.summary} Produto FICTÍCIO criado exclusivamente para demonstração de portfólio — não possui registro sanitário, não é comercializado e não deve ser utilizado como referência de saúde.`,
          technicalInfo: [
            { label: "Apresentação", value: p.presentation },
            { label: "Uso", value: p.use },
            { label: "Composição", value: "Fórmula fictícia para demonstração" },
            { label: "Registro", value: `DEMO-${between(1000, 9999)}-${pi + 1} (fictício)` },
            { label: "Conservação", value: "Temperatura ambiente (15 °C a 30 °C)" },
          ],
          categoryId: category.id,
          priceCents,
          salePriceCents,
          finalPriceCents: salePriceCents ?? priceCents,
          stock: p.stock,
          packaging: p.packaging,
          accentColor: p.color,
          isFeatured: p.featured ?? false,
          ratingAvg: Math.round((3.8 + rand() * 1.2) * 10) / 10,
          ratingCount: between(4, 380),
          createdAt: new Date(now - between(1, 120) * 86_400_000),
        },
      });
      products.push({ id: created.id, name: created.name, sku, finalPriceCents: created.finalPriceCents });
    }
  }

  console.log("→ Pedidos fictícios com histórico...");
  const flow: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"];
  const sold = new Map<string, number>();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let i = 0; i < 90; i++) {
    const user = pick(users);
    const ageDays = Math.floor(Math.pow(rand(), 1.4) * 45);
    const createdAt = new Date(now - ageDays * 86_400_000 - between(0, 20) * 3_600_000);
    const itemsCount = between(1, 4);
    const chosen = new Map<string, number>();
    while (chosen.size < itemsCount) chosen.set(pick(products).id, between(1, 3));
    const items = [...chosen.entries()].map(([id, qty]) => {
      const p = products.find((x) => x.id === id)!;
      return { productId: id, productName: p.name, productSku: p.sku, unitPriceCents: p.finalPriceCents, quantity: qty, totalCents: p.finalPriceCents * qty };
    });
    const subtotal = items.reduce((s, it) => s + it.totalCents, 0);
    const coupon = rand() < 0.2 && subtotal >= 12000 ? coupons[1] : rand() < 0.15 ? coupons[0] : null;
    const discount = coupon?.type === "PERCENT" ? Math.round(subtotal * coupon.value / 100) : coupon?.type === "FIXED" ? coupon.value : 0;
    const shipping = subtotal - discount >= 19900 ? 0 : pick([990, 1290, 1490, 1790, 2290]);
    const method = rand() < 0.55 ? "PIX" : "CARD";

    // Pedidos antigos tendem a estar entregues; recentes, em andamento.
    const canceled = rand() < 0.07;
    const maxStep = ageDays > 10 ? 4 : ageDays > 5 ? between(2, 4) : ageDays > 1 ? between(1, 3) : between(0, 2);
    const step = method === "CARD" ? Math.max(1, maxStep) : maxStep;
    const finalStatus: OrderStatus = canceled ? "CANCELED" : flow[step];
    const path: OrderStatus[] = canceled ? ["PENDING_PAYMENT", "CANCELED"] : flow.slice(0, step + 1);
    const addr = pick(addresses);
    const number = `MF-${createdAt.toISOString().slice(0, 10).replace(/-/g, "")}-${Array.from({ length: 6 }, () => pick([...alphabet])).join("")}`;

    await prisma.order.create({
      data: {
        number,
        userId: user.id,
        status: finalStatus,
        subtotalCents: subtotal,
        discountCents: discount,
        shippingCents: shipping,
        totalCents: subtotal - discount + shipping,
        couponId: coupon?.id,
        couponCode: coupon?.code,
        paymentMethod: method,
        paymentStatus: finalStatus === "PENDING_PAYMENT" ? "PENDING" : finalStatus === "CANCELED" ? "DECLINED" : "APPROVED",
        cardBrand: method === "CARD" ? pick(["visa", "mastercard", "elo"]) : null,
        cardLast4: method === "CARD" ? String(between(1000, 9999)) : null,
        installments: method === "CARD" ? between(1, 3) : 1,
        pixCode: method === "PIX" ? `00020126DEMO-MEDFACIL-${number}` : null,
        pixExpiresAt: method === "PIX" ? new Date(createdAt.getTime() + 30 * 60_000) : null,
        paidAt: path.includes("PAID") ? new Date(createdAt.getTime() + 600_000) : null,
        shippingName: user.name,
        shippingZipCode: addr.zipCode,
        shippingStreet: addr.street,
        shippingDistrict: addr.district,
        shippingCity: addr.city,
        shippingState: addr.state,
        shippingNumber: String(between(10, 2000)),
        shippingDays: between(2, 9),
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
        statusHistory: {
          create: path.map((s, idx) => ({
            fromStatus: idx === 0 ? null : path[idx - 1],
            toStatus: s,
            note: idx === 0 ? "Pedido criado." : s === "CANCELED" ? "Cancelado por falta de pagamento (simulação)." : null,
            createdAt: new Date(createdAt.getTime() + idx * 8 * 3_600_000),
          })),
        },
      },
    });

    if (!canceled) for (const it of items) sold.set(it.productId, (sold.get(it.productId) ?? 0) + it.quantity);
    if (coupon && !canceled) await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  }

  // soldCount = vendas registradas + histórico fictício anterior
  for (const p of products) {
    await prisma.product.update({ where: { id: p.id }, data: { soldCount: (sold.get(p.id) ?? 0) + between(5, 120) } });
  }

  console.log("\n✔ Seed concluído:");
  console.log(`  ${categories.length} categorias · ${products.length} produtos · ${users.length} clientes · 90 pedidos`);
  console.log(`  Admin:   ${adminEmail} / ${adminPassword}`);
  console.log("  Cliente: cliente@medfacil.demo / Cliente@123\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
