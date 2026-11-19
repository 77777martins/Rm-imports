import type { MetadataRoute } from "next";

/** Loja fictícia: por padrão bloqueia indexação (ALLOW_INDEXING=true libera). */
export default function robots(): MetadataRoute.Robots {
  const allow = process.env.ALLOW_INDEXING === "true";
  return {
    rules: allow ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/conta", "/checkout", "/pedido"] } : { userAgent: "*", disallow: "/" },
  };
}
