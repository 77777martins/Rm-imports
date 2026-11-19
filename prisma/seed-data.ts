/**
 * Dados FICTÍCIOS de demonstração. Nomes, marcas, composições e registros
 * são inventados e não correspondem a medicamentos reais.
 */

type Pack = "BOX" | "BOTTLE" | "TUBE" | "BLISTER" | "JAR" | "SPRAY";

export interface SeedProduct {
  name: string;
  brand: string;
  packaging: Pack;
  color: string;
  price: number; // em reais
  sale?: number;
  stock: number;
  featured?: boolean;
  summary: string;
  presentation: string;
  use: string;
}

export interface SeedCategory {
  name: string;
  slug: string;
  icon: string;
  description: string;
  prefix: string;
  products: SeedProduct[];
}

export const categories: SeedCategory[] = [
  {
    name: "Analgésicos",
    slug: "analgesicos",
    icon: "pill",
    description: "Alívio de dores do dia a dia (produtos fictícios).",
    prefix: "ANL",
    products: [
      { name: "Analgex 500 mg", brand: "Pharmacorp Demo", packaging: "BLISTER", color: "#0284c7", price: 14.9, sale: 11.9, stock: 140, featured: true, summary: "Analgésico fictício para dores leves e moderadas.", presentation: "Cartela com 20 comprimidos", use: "Adulto" },
      { name: "Doralívio Flex", brand: "BioNova", packaging: "BOX", color: "#7c3aed", price: 22.5, stock: 85, summary: "Composição fictícia indicada para tensão muscular.", presentation: "Caixa com 24 comprimidos", use: "Adulto" },
      { name: "Cefaline Rápido", brand: "Vitalis Lab", packaging: "BOX", color: "#dc2626", price: 18.9, sale: 15.5, stock: 60, summary: "Fórmula fictícia de ação rápida para dor de cabeça.", presentation: "Caixa com 16 cápsulas", use: "Adulto" },
      { name: "Musculin Gel", brand: "Curativa", packaging: "TUBE", color: "#ea580c", price: 29.9, stock: 45, featured: true, summary: "Gel de massagem fictício com efeito refrescante.", presentation: "Bisnaga 60 g", use: "Uso tópico — adulto" },
      { name: "Analgex Gotas", brand: "Pharmacorp Demo", packaging: "BOTTLE", color: "#0369a1", price: 16.4, stock: 8, summary: "Versão em gotas do Analgex (fictício).", presentation: "Frasco 20 mL", use: "Adulto" },
      { name: "Relaxo Térmico Spray", brand: "Curativa", packaging: "SPRAY", color: "#b91c1c", price: 34.9, sale: 27.9, stock: 33, summary: "Spray de efeito térmico fictício para alívio local.", presentation: "Spray 85 mL", use: "Uso tópico — adulto" },
      { name: "Dolorfim Duo", brand: "BioNova", packaging: "BLISTER", color: "#4f46e5", price: 12.9, stock: 0, summary: "Associação fictícia em comprimidos revestidos.", presentation: "Cartela com 10 comprimidos", use: "Adulto" },
    ],
  },
  {
    name: "Antitérmicos",
    slug: "antitermicos",
    icon: "thermometer",
    description: "Controle de febre com produtos demonstrativos.",
    prefix: "ATM",
    products: [
      { name: "Febrinol 750 mg", brand: "Vitalis Lab", packaging: "BLISTER", color: "#e11d48", price: 13.5, sale: 10.9, stock: 120, featured: true, summary: "Antitérmico fictício em comprimidos.", presentation: "Cartela com 20 comprimidos", use: "Adulto" },
      { name: "Febrinol Kids Suspensão", brand: "Vitalis Lab", packaging: "BOTTLE", color: "#f43f5e", price: 19.9, stock: 70, summary: "Suspensão oral fictícia sabor morango.", presentation: "Frasco 100 mL", use: "Pediátrico (fictício)" },
      { name: "Termocalm Gotas", brand: "Pharmacorp Demo", packaging: "BOTTLE", color: "#0891b2", price: 15.9, stock: 55, summary: "Gotas fictícias para controle de temperatura.", presentation: "Frasco 15 mL", use: "Adulto e pediátrico (fictício)" },
      { name: "Antifeb Efervescente", brand: "BioNova", packaging: "BOX", color: "#ca8a04", price: 24.9, sale: 19.9, stock: 40, summary: "Comprimido efervescente fictício sabor limão.", presentation: "Caixa com 10 envelopes", use: "Adulto" },
      { name: "Termocalm 500 mg", brand: "Pharmacorp Demo", packaging: "BLISTER", color: "#0e7490", price: 9.9, stock: 200, summary: "Versão em comprimidos do Termocalm (fictício).", presentation: "Cartela com 10 comprimidos", use: "Adulto" },
      { name: "Gripevit Noite", brand: "Vitalis Lab", packaging: "BOX", color: "#1e3a8a", price: 21.9, stock: 6, summary: "Composto fictício para sintomas noturnos.", presentation: "Caixa com 12 cápsulas", use: "Adulto" },
      { name: "Gripevit Dia", brand: "Vitalis Lab", packaging: "BOX", color: "#f59e0b", price: 21.9, stock: 38, summary: "Composto fictício para sintomas diurnos.", presentation: "Caixa com 12 cápsulas", use: "Adulto" },
    ],
  },
  {
    name: "Vitaminas",
    slug: "vitaminas",
    icon: "sun",
    description: "Vitaminas e minerais demonstrativos.",
    prefix: "VIT",
    products: [
      { name: "VitaC 1g Efervescente", brand: "Vitalis Lab", packaging: "BOX", color: "#f97316", price: 18.9, sale: 14.9, stock: 160, featured: true, summary: "Vitamina C fictícia sabor laranja.", presentation: "Tubo com 10 comprimidos", use: "Adulto" },
      { name: "SolarD 2000 UI", brand: "BioNova", packaging: "BOTTLE", color: "#eab308", price: 39.9, sale: 32.9, stock: 90, featured: true, summary: "Vitamina D fictícia em cápsulas softgel.", presentation: "Frasco com 60 cápsulas", use: "Adulto" },
      { name: "Multivita Total A-Z", brand: "Vitalis Lab", packaging: "BOTTLE", color: "#16a34a", price: 49.9, stock: 75, summary: "Polivitamínico fictício completo.", presentation: "Frasco com 60 comprimidos", use: "Adulto" },
      { name: "Complexo B Energia", brand: "PrimeSuplementos", packaging: "BLISTER", color: "#dc2626", price: 24.5, stock: 50, summary: "Complexo B fictício.", presentation: "Cartela com 30 comprimidos", use: "Adulto" },
      { name: "Zinco + Selênio", brand: "BioNova", packaging: "BOTTLE", color: "#64748b", price: 29.9, stock: 9, summary: "Minerais fictícios para a imunidade.", presentation: "Frasco com 30 cápsulas", use: "Adulto" },
      { name: "Ferrovita 14 mg", brand: "Vitalis Lab", packaging: "BOX", color: "#991b1b", price: 27.9, stock: 44, summary: "Suplemento de ferro fictício.", presentation: "Caixa com 30 comprimidos", use: "Adulto" },
      { name: "Ômega Vital 1000", brand: "PrimeSuplementos", packaging: "JAR", color: "#0ea5e9", price: 59.9, sale: 49.9, stock: 62, summary: "Óleo de peixe fictício em cápsulas.", presentation: "Pote com 120 cápsulas", use: "Adulto" },
    ],
  },
  {
    name: "Higiene Pessoal",
    slug: "higiene-pessoal",
    icon: "droplets",
    description: "Cuidados diários para toda a família.",
    prefix: "HIG",
    products: [
      { name: "Sorriso Pro Creme Dental", brand: "Higiplus", packaging: "TUBE", color: "#2563eb", price: 8.9, sale: 6.9, stock: 300, summary: "Creme dental fictício com flúor.", presentation: "Bisnaga 90 g", use: "Adulto" },
      { name: "Enxaguante Fresh Menta", brand: "Higiplus", packaging: "BOTTLE", color: "#059669", price: 19.9, stock: 110, summary: "Enxaguante bucal fictício sem álcool.", presentation: "Frasco 500 mL", use: "Adulto" },
      { name: "Sabonete Líquido Neutro", brand: "DermaPura", packaging: "BOTTLE", color: "#a855f7", price: 16.9, stock: 95, featured: true, summary: "Sabonete fictício pH balanceado.", presentation: "Frasco 250 mL", use: "Adulto" },
      { name: "Desodorante Dry 48h", brand: "Higiplus", packaging: "SPRAY", color: "#0f172a", price: 17.5, sale: 13.9, stock: 130, summary: "Antitranspirante fictício.", presentation: "Aerossol 150 mL", use: "Adulto" },
      { name: "Álcool Gel 70%", brand: "Curativa", packaging: "BOTTLE", color: "#0284c7", price: 9.9, stock: 250, summary: "Higienizador de mãos fictício.", presentation: "Frasco 400 g", use: "Adulto e infantil" },
      { name: "Fio Dental Ultra", brand: "Higiplus", packaging: "BOX", color: "#14b8a6", price: 7.5, stock: 7, summary: "Fio dental fictício encerado.", presentation: "Embalagem 50 m", use: "Adulto" },
      { name: "Shampoo Anticaspa Clean", brand: "DermaPura", packaging: "BOTTLE", color: "#1d4ed8", price: 24.9, stock: 58, summary: "Shampoo fictício de uso diário.", presentation: "Frasco 200 mL", use: "Adulto" },
    ],
  },
  {
    name: "Cuidados com a Pele",
    slug: "cuidados-com-a-pele",
    icon: "sparkles",
    description: "Dermocosméticos demonstrativos.",
    prefix: "DRM",
    products: [
      { name: "Protetor Solar FPS 50", brand: "DermaPura", packaging: "TUBE", color: "#f59e0b", price: 54.9, sale: 44.9, stock: 88, featured: true, summary: "Protetor fictício toque seco.", presentation: "Bisnaga 120 mL", use: "Adulto" },
      { name: "Hidratante Corporal Ureia 10%", brand: "DermaPura", packaging: "JAR", color: "#0ea5e9", price: 39.9, stock: 64, summary: "Creme hidratante fictício para pele seca.", presentation: "Pote 200 g", use: "Adulto" },
      { name: "Sérum Vitamina C 15%", brand: "Lumière Demo", packaging: "BOTTLE", color: "#ea580c", price: 89.9, sale: 74.9, stock: 30, featured: true, summary: "Sérum facial antioxidante fictício.", presentation: "Frasco 30 mL", use: "Adulto" },
      { name: "Gel de Limpeza Facial", brand: "Lumière Demo", packaging: "TUBE", color: "#10b981", price: 44.9, stock: 52, summary: "Gel de limpeza fictício para pele oleosa.", presentation: "Bisnaga 150 g", use: "Adulto" },
      { name: "Água Micelar 5 em 1", brand: "DermaPura", packaging: "BOTTLE", color: "#ec4899", price: 34.9, stock: 70, summary: "Demaquilante fictício.", presentation: "Frasco 200 mL", use: "Adulto" },
      { name: "Pomada Reparadora", brand: "Curativa", packaging: "TUBE", color: "#8b5cf6", price: 26.9, stock: 5, summary: "Pomada fictícia para pele ressecada.", presentation: "Bisnaga 45 g", use: "Adulto e infantil" },
      { name: "Bálsamo Labial FPS 15", brand: "Lumière Demo", packaging: "TUBE", color: "#e11d48", price: 14.9, stock: 140, summary: "Hidratante labial fictício.", presentation: "Bastão 4,5 g", use: "Adulto" },
    ],
  },
  {
    name: "Suplementos",
    slug: "suplementos",
    icon: "dumbbell",
    description: "Suplementação demonstrativa para o dia a dia.",
    prefix: "SUP",
    products: [
      { name: "Whey Isolado Baunilha", brand: "PrimeSuplementos", packaging: "JAR", color: "#78350f", price: 149.9, sale: 129.9, stock: 40, featured: true, summary: "Proteína isolada fictícia.", presentation: "Pote 900 g", use: "Adulto" },
      { name: "Creatina Pura 300 g", brand: "PrimeSuplementos", packaging: "JAR", color: "#1e293b", price: 89.9, stock: 55, summary: "Creatina monohidratada fictícia.", presentation: "Pote 300 g", use: "Adulto" },
      { name: "Colágeno Verisol Plus", brand: "BioNova", packaging: "JAR", color: "#db2777", price: 99.9, sale: 84.9, stock: 36, summary: "Peptídeos de colágeno fictícios.", presentation: "Pote 300 g", use: "Adulto" },
      { name: "Magnésio Dimalato", brand: "BioNova", packaging: "BOTTLE", color: "#7c3aed", price: 44.9, stock: 47, summary: "Magnésio fictício em cápsulas.", presentation: "Frasco com 60 cápsulas", use: "Adulto" },
      { name: "Melatonina Sono+ Gotas", brand: "Vitalis Lab", packaging: "BOTTLE", color: "#312e81", price: 39.9, stock: 4, summary: "Suplemento fictício em gotas.", presentation: "Frasco 20 mL", use: "Adulto" },
      { name: "Probiótico Flora 10B", brand: "BioNova", packaging: "BOX", color: "#16a34a", price: 69.9, stock: 28, summary: "Probiótico fictício em sachês.", presentation: "Caixa com 10 sachês", use: "Adulto" },
      { name: "Barra Proteica Cacau", brand: "PrimeSuplementos", packaging: "BOX", color: "#92400e", price: 59.9, sale: 49.9, stock: 75, summary: "Barras fictícias com 15 g de proteína.", presentation: "Caixa com 12 unidades", use: "Adulto" },
    ],
  },
  {
    name: "Primeiros Socorros",
    slug: "primeiros-socorros",
    icon: "cross",
    description: "Itens demonstrativos para pequenos cuidados.",
    prefix: "PSO",
    products: [
      { name: "Curativos Transparentes", brand: "Curativa", packaging: "BOX", color: "#0d9488", price: 12.9, stock: 180, summary: "Curativos fictícios à prova d'água.", presentation: "Caixa com 40 unidades", use: "Adulto e infantil" },
      { name: "Antisséptico Spray", brand: "Curativa", packaging: "SPRAY", color: "#dc2626", price: 19.9, sale: 16.9, stock: 90, featured: true, summary: "Antisséptico fictício que não arde.", presentation: "Spray 45 mL", use: "Adulto e infantil" },
      { name: "Gaze Estéril 7,5 cm", brand: "Curativa", packaging: "BOX", color: "#475569", price: 8.9, stock: 150, summary: "Compressas de gaze fictícias.", presentation: "Caixa com 10 envelopes", use: "Uso geral" },
      { name: "Atadura Elástica", brand: "Curativa", packaging: "BOX", color: "#b45309", price: 11.5, stock: 66, summary: "Atadura fictícia de crepom.", presentation: "Rolo 10 cm x 1,8 m", use: "Uso geral" },
      { name: "Soro Fisiológico 0,9%", brand: "Pharmacorp Demo", packaging: "BOTTLE", color: "#0284c7", price: 6.9, stock: 220, summary: "Solução fictícia para limpeza.", presentation: "Frasco 250 mL", use: "Uso geral" },
      { name: "Termômetro Digital", brand: "MedTech Demo", packaging: "BOX", color: "#2563eb", price: 29.9, sale: 24.9, stock: 3, summary: "Termômetro fictício com alarme sonoro.", presentation: "1 unidade", use: "Uso geral" },
      { name: "Kit Primeiros Socorros", brand: "Curativa", packaging: "BOX", color: "#b91c1c", price: 79.9, stock: 22, featured: true, summary: "Kit fictício com 25 itens essenciais.", presentation: "Estojo com 25 itens", use: "Uso geral" },
    ],
  },
  {
    name: "Cuidados Infantis",
    slug: "cuidados-infantis",
    icon: "baby",
    description: "Cuidados demonstrativos para bebês e crianças.",
    prefix: "INF",
    products: [
      { name: "Pomada para Assaduras", brand: "Kiddo Care", packaging: "TUBE", color: "#38bdf8", price: 24.9, sale: 19.9, stock: 95, featured: true, summary: "Pomada fictícia com óxido de zinco.", presentation: "Bisnaga 45 g", use: "Infantil (fictício)" },
      { name: "Shampoo Bebê Sem Lágrimas", brand: "Kiddo Care", packaging: "BOTTLE", color: "#facc15", price: 18.9, stock: 80, summary: "Shampoo fictício de fórmula suave.", presentation: "Frasco 200 mL", use: "Infantil" },
      { name: "Lenços Umedecidos", brand: "Kiddo Care", packaging: "BOX", color: "#a78bfa", price: 14.9, stock: 160, summary: "Lenços fictícios sem fragrância.", presentation: "Pacote com 96 unidades", use: "Infantil" },
      { name: "Soro Nasal Infantil", brand: "Pharmacorp Demo", packaging: "SPRAY", color: "#22d3ee", price: 16.9, stock: 70, summary: "Solução nasal fictícia.", presentation: "Spray 30 mL", use: "Infantil (fictício)" },
      { name: "Hidratante Kids", brand: "Kiddo Care", packaging: "BOTTLE", color: "#fb7185", price: 22.9, stock: 2, summary: "Loção hidratante fictícia.", presentation: "Frasco 200 mL", use: "Infantil" },
      { name: "Protetor Solar Kids FPS 60", brand: "DermaPura", packaging: "TUBE", color: "#f97316", price: 59.9, sale: 49.9, stock: 48, summary: "Protetor fictício resistente à água.", presentation: "Bisnaga 120 mL", use: "Infantil" },
      { name: "Vitaminas Kids Gomas", brand: "Vitalis Lab", packaging: "JAR", color: "#84cc16", price: 44.9, stock: 57, summary: "Gomas polivitamínicas fictícias.", presentation: "Pote com 60 gomas", use: "Infantil (fictício)" },
    ],
  },
];

export const customers = [
  "Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Rocha", "Elisa Nunes", "Felipe Araújo",
  "Gabriela Castro", "Henrique Dias", "Isabela Moraes", "João Pedro Alves", "Larissa Teixeira", "Marcos Vieira",
];

export const addresses = [
  { zipCode: "01310-100", street: "Av. Paulista", district: "Bela Vista", city: "São Paulo", state: "SP" },
  { zipCode: "20040-002", street: "Rua da Assembleia", district: "Centro", city: "Rio de Janeiro", state: "RJ" },
  { zipCode: "30130-010", street: "Av. Afonso Pena", district: "Centro", city: "Belo Horizonte", state: "MG" },
  { zipCode: "80010-000", street: "Rua XV de Novembro", district: "Centro", city: "Curitiba", state: "PR" },
  { zipCode: "40020-000", street: "Av. Sete de Setembro", district: "Centro", city: "Salvador", state: "BA" },
  { zipCode: "90010-150", street: "Rua dos Andradas", district: "Centro Histórico", city: "Porto Alegre", state: "RS" },
] as const;
