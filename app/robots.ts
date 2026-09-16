import type { MetadataRoute } from "next";

// Statik export için gerekli.
export const dynamic = "force-static";

/** Site arama motorlarında listelenmez; yalnızca linki bilenler girer. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
