# 💊 MedFácil — E-commerce farmacêutico (projeto de portfólio)

> **⚠️ Demonstração técnica.** MedFácil é uma loja **fictícia** criada exclusivamente para portfólio.
> Produtos, marcas, registros, informações técnicas, preços, fretes e pagamentos são **simulados**.
> Nada é vendido, nenhum medicamento é dispensado e nenhuma instituição financeira é contatada.

E-commerce full stack com vitrine, catálogo com busca/filtros, carrinho, checkout com PIX e cartão simulados,
área do cliente e painel administrativo completo — com foco em **segurança, arquitetura em camadas e qualidade de produção**.

---

## ✨ Funcionalidades

| Área | Recursos |
|---|---|
| **Loja** | Home com carrossel de banners, ofertas do dia (contador), destaques, mais vendidos, categorias, benefícios, rodapé completo, botão de WhatsApp demonstrativo |
| **Catálogo** | 56 produtos fictícios em 8 categorias · busca com autocomplete · filtros (categoria, preço, promoção, estoque) · 6 ordenações · paginação server-side (URL compartilhável/SEO) |
| **Produto** | Ilustração vetorial da embalagem, preço/promoção/parcelamento, estoque, calculadora de frete, informações técnicas **identificadas como fictícias**, relacionados, JSON-LD |
| **Compra** | Carrinho persistente · preços/estoque **sempre revalidados no servidor** · cupons (%/fixo/frete grátis) · frete fictício por CEP · checkout PIX (QR Code + confirmação simulada) e cartão (aprovação/recusa simuladas, parcelamento) · número do pedido · confirmação |
| **Cliente** | Cadastro, login, logout, recuperação de senha simulada, perfil e endereço, troca de senha, histórico e detalhes dos pedidos com linha do tempo |
| **Admin** | Dashboard (KPIs + gráficos) · CRUD de produtos (preço, estoque, ativação, destaque, informações técnicas, prévia ao vivo) · categorias · pedidos (status com transições válidas, histórico, devolução de estoque no cancelamento) · clientes · configurações (nome, logotipo, cores, contato, frete grátis, banners, cupons) |

---

## 🧱 Stack

- **Next.js 16** (App Router, Route Handlers, `proxy.ts`) · **React 19** · **TypeScript** estrito
- **Tailwind CSS 4** · **Framer Motion** · **Lucide React** · **Recharts** · **Sonner**
- **TanStack React Query** · **Axios** · **React Hook Form** · **Zod 4** (schemas compartilhados front/back)
- **Prisma 7** (driver adapter `pg`) · **PostgreSQL 16**
- **jose** (JWT HS256) · **bcryptjs** · **Zustand** (carrinho)
- **Vitest** (unitários + integração da API) · **Playwright** (E2E executado durante o desenvolvimento)

> **Por que Next.js full stack?** Um único projeto com páginas e API integradas reduz a infraestrutura,
> permite renderizar catálogo/produto no servidor (SEO e performance) e compartilhar validações Zod entre cliente e servidor.

---

## 🗂️ Arquitetura

```
prisma/
  schema.prisma          # Modelo de dados (valores monetários em centavos)
  migrations/            # Migrações versionadas
  seed.ts · seed-data.ts # Dados fictícios determinísticos
src/
  proxy.ts               # Proteção de rotas, renovação de sessão e bloqueio CSRF
  app/
    (store)/             # Loja: home, produtos, carrinho, checkout, conta, auth, pedido
    admin/               # Painel administrativo
    api/                 # Route Handlers REST (finos: validação → serviço)
  server/                # Código exclusivo do servidor ("server-only")
    env.ts               # Variáveis de ambiente validadas com Zod (falha cedo)
    db.ts                # Prisma Client singleton
    http.ts              # Wrapper: rate limit, auth, parse/validação, erros centralizados
    errors.ts · logger.ts · rate-limit.ts
    auth/                # JWT, cookies, sessão, hash de senha
    services/            # Regras de negócio (auth, produtos, pedidos, dashboard...)
  lib/                   # Código compartilhado (puro): validators Zod, pricing, card, utils
  components/            # UI por domínio (ui, layout, product, cart, checkout, admin...)
  hooks/ · stores/ · providers/
tests/                   # Vitest: unitários + integração da API
```

**Fluxo de uma requisição:** `proxy.ts` (CSRF/rotas) → `route.ts` → `handler()` (rate limit → auth → Zod) → `service` → Prisma → resposta JSON padronizada `{ error: { code, message, details } }`.

---

## 🚀 Rodando localmente

### Pré-requisitos
- Node.js **20.19+** (recomendado 22)
- PostgreSQL **14+** (local ou via Docker)

### Passo a passo

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
#   → ajuste DATABASE_URL
#   → gere um segredo forte:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#   → cole em JWT_ACCESS_SECRET

# 3. (Opcional) Subir só o PostgreSQL via Docker
docker compose up -d db

# 4. Criar tabelas e gerar o Prisma Client
npx prisma migrate deploy
npx prisma generate

# 5. Popular dados de demonstração
npm run db:seed

# 6. Iniciar
npm run dev
```

Acesse **http://localhost:3000**.

### 🔑 Contas de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@medfacil.demo` | `Admin@12345` |
| Cliente | `cliente@medfacil.demo` | `Cliente@123` |

A tela de login possui botões para preencher essas contas automaticamente.

### 🎟️ Cupons e cartões de teste

| Cupom | Efeito |
|---|---|
| `BEMVINDO10` | 10% de desconto |
| `MENOS20` | R$ 20 off acima de R$ 120 |
| `FRETEGRATIS` | Frete grátis |
| `EXPIRADO5` | Expirado (testa a validação) |

| Cartão | Resultado |
|---|---|
| `4111 1111 1111 1111` | Visa — aprovado |
| `5555 5555 5555 4444` | Mastercard — aprovado |
| `4000 0000 0000 0002` | **Recusado** (qualquer final `0002`) |

Validade futura qualquer (ex.: `12/30`) e CVV `123`.

### Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run typecheck` | Verificação de tipos |
| `npm test` | Testes unitários |
| `npm run test:api` | Testes de integração da API (requer app rodando — ver abaixo) |
| `npm run db:migrate` | Cria/aplica migração em desenvolvimento |
| `npm run db:seed` | Recria os dados de demonstração |
| `npm run db:reset` | Apaga o banco, reaplica migrações e seed |
| `npm run db:studio` | Prisma Studio |

---

## 🧪 Testes

```bash
npm test                 # 18 testes unitários (preço, frete, cupom, cartão, validações, open redirect)

# Integração (14 cenários contra servidor + banco reais)
npm run db:seed
RATE_LIMIT_MULTIPLIER=20 npm run dev        # em outro terminal
API_BASE_URL=http://localhost:3000 npm run test:api
```

Os testes de integração cobrem: catálogo/filtros/ordenação, bloqueio CSRF, autorização por papel, cadastro,
orçamento autoritativo, checkout PIX e cartão (aprovado/recusado), estoque insuficiente, **IDOR**, transições de status
com devolução de estoque, CRUD de produto, dashboard, **rotação e detecção de reuso de refresh token** e recuperação de senha.

### ✅ Checklist de testes manuais

- [ ] Home carrega banners, vitrines e categorias; carrossel troca sozinho e pelos controles
- [ ] Busca mostra sugestões ao digitar 2+ letras; Enter leva ao catálogo filtrado
- [ ] Filtros, ordenação e paginação atualizam a URL e persistem ao recarregar
- [ ] Produto esgotado exibe "Indisponível"; estoque baixo exibe aviso
- [ ] Carrinho persiste após recarregar; quantidade respeita o estoque
- [ ] Cupons válidos/expirados/com mínimo mostram mensagens corretas
- [ ] Frete muda conforme o CEP e zera acima do valor de frete grátis
- [ ] `/checkout` sem login redireciona para `/entrar` e volta após o login
- [ ] PIX: QR Code, copiar código, contador e "Simular pagamento" → status pago
- [ ] Cartão final `0002` é recusado (pedido **não** é criado); cartão válido aprova na hora
- [ ] Pedido aparece em "Meus pedidos" com linha do tempo
- [ ] Recuperação de senha gera link (modo demo) de uso único; após redefinir, sessões antigas caem
- [ ] Cliente acessando `/admin` é redirecionado
- [ ] Admin: criar/editar/excluir produto, edição rápida, ativar/desativar
- [ ] Admin: excluir produto já vendido é bloqueado com mensagem orientando desativar
- [ ] Admin: cancelar pedido devolve o estoque; transições inválidas são bloqueadas
- [ ] Admin: alterar cores/nome da loja reflete imediatamente na vitrine
- [ ] Layout funciona em 360px, tablet e desktop

---

## 🔐 Segurança

| Ameaça | Mitigação |
|---|---|
| Senhas | `bcrypt` (12 rounds); limite de 72 bytes validado; política de senha forte |
| Sessão | JWT de acesso curto (15 min) em cookie **httpOnly + SameSite=Lax + Secure (prod)**; refresh token opaco de 256 bits, **apenas o hash SHA-256 é armazenado**, cookie restrito a `/api/auth` |
| Roubo de refresh token | **Rotação** a cada uso; reapresentar token já usado **revoga todas as sessões** do usuário |
| Enumeração de usuários | Mesma mensagem e tempo constante (hash fictício) no login e na recuperação de senha |
| Autorização | `proxy.ts` + layout + `handler({ auth: "admin" })`; papel de admin **revalidado no banco** |
| IDOR | Pedidos do cliente sempre consultados com `userId` da sessão |
| CSRF | Cookies `SameSite=Lax` + verificação de `Origin`/`Sec-Fetch-Site` em toda mutação + exigência de `Content-Type: application/json` |
| SQL Injection | Prisma (queries parametrizadas); única SQL manual usa *tagged template* |
| XSS | React escapa toda saída; nenhum HTML de usuário renderizado; JSON-LD com `<` escapado; CSP; remoção de caracteres de controle |
| URLs maliciosas | Imagens só `https://` ou caminho interno; links de banner só caminhos internos; `next` validado contra **open redirect** |
| Clickjacking | `X-Frame-Options: DENY` + `frame-ancestors 'none'` |
| Força bruta / abuso | Rate limit por IP e política (auth, reset, checkout, leitura, escrita) com `Retry-After` |
| Integridade de preço | Preço, estoque, cupom e frete **recalculados no servidor**; baixa de estoque por *update condicional* em transação (sem condição de corrida) |
| Dados de cartão | Número completo e CVV **nunca saem do navegador** — apenas bandeira, últimos 4 dígitos e token simulado |
| Segredos | Somente variáveis de ambiente validadas no boot; nada sensível no cliente; logs com **redação automática** de campos sensíveis |
| Headers | CSP, HSTS (prod), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false` |

### ✅ Checklist de segurança para deploy

- [ ] `JWT_ACCESS_SECRET` aleatório (≥ 48 bytes) e exclusivo por ambiente
- [ ] `DEMO_SHOW_RESET_LINK="false"` em ambiente público
- [ ] `RATE_LIMIT_MULTIPLIER=1`
- [ ] Senha do admin do seed alterada (`SEED_ADMIN_PASSWORD`)
- [ ] HTTPS ativo (cookies `Secure` e HSTS dependem disso)
- [ ] `APP_URL` igual ao domínio público (usado na validação de origem)
- [ ] Banco com usuário de privilégios mínimos e backups
- [ ] Aplicação atrás de proxy confiável que sobrescreve `X-Forwarded-For`

---

## ☁️ Deploy

### Opção 1 — Docker Compose (VPS)

```bash
cp .env.example .env          # ajuste JWT_ACCESS_SECRET, APP_URL, senhas
docker compose up -d db
docker compose --profile tools run --rm migrate   # migrações + seed
docker compose up -d --build app
```

Coloque um proxy reverso com HTTPS (Caddy, Nginx + Certbot, Traefik) na frente da porta 3000.
O container roda como usuário sem privilégios e expõe `GET /api/health` para health checks.

### Opção 2 — Vercel + PostgreSQL gerenciado (Neon, Supabase, Railway)

1. Crie o banco e copie a connection string.
2. Importe o repositório na Vercel e configure as variáveis do `.env.example`.
3. Rode as migrações e o seed a partir da sua máquina apontando para o banco de produção:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   DATABASE_URL="postgresql://..." npm run db:seed
   ```
4. Faça o deploy (o script `build` já executa `prisma generate`).

> Em ambientes **serverless/multi-instância**, troque o rate limiter em memória (`src/server/rate-limit.ts`)
> por Redis/Upstash — a interface `rateLimit(key, limit, windowMs)` permanece a mesma.

---

## ⚖️ Decisões técnicas e trade-offs

- **Centavos (`Int`)** para todos os valores monetários — evita erros de ponto flutuante.
- **`finalPriceCents` desnormalizado** e indexado — permite filtrar/ordenar pelo preço efetivo direto no banco.
- **Snapshot de itens e endereço no pedido** — o histórico não muda se o produto ou o perfil forem editados.
- **Exclusão restrita** — produtos/cupons já usados em pedidos não são apagados (preserva histórico); a UI orienta desativar.
- **CSP com `'unsafe-inline'` em scripts** — necessário para a hidratação do Next sem nonce; usar nonce forçaria renderização dinâmica total. Compensado pelas demais camadas de XSS.
- **Rate limit e cache de configurações em memória** — simples e suficiente para instância única; documentado o caminho para Redis.
- **Ilustrações vetoriais geradas por produto** — catálogo visualmente consistente, leve e sem dependência de imagens de terceiros (o admin pode informar uma URL https).
- **Tokenização de cartão simulada no navegador** — reproduz o fluxo real de gateways (PCI-DSS): o servidor nunca recebe o número do cartão.
- **Indexação desativada por padrão** (`ALLOW_INDEXING`) — evita que a loja fictícia seja confundida com uma farmácia real em buscadores.

---

## 🗺️ Próximos passos sugeridos

- Redis para rate limit/cache distribuído e fila de e-mails reais (Resend/SES) na recuperação de senha
- Upload de imagens com armazenamento S3 + validação de MIME/tamanho
- Testes E2E versionados com Playwright no CI (GitHub Actions) e ESLint configurado
- Avaliações de produtos, lista de desejos e notificações de mudança de status
- Auditoria de ações administrativas (quem alterou preço/estoque e quando)
- Observabilidade (Sentry/OpenTelemetry) e logs estruturados centralizados

---

Projeto desenvolvido para fins de portfólio. Nenhum dado real é coletado ou processado.
