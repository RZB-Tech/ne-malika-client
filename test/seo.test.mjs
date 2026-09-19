import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as ReactQuery from "@tanstack/react-query";

const require = createRequire(import.meta.url);
function load(path, imports = {}, globals = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    fileName: path,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    URL,
    URLSearchParams,
    AbortSignal,
    process: { env: {} },
    ...globals,
    require: (id) => {
      assert.ok(id in imports, `Unexpected import ${id}`);
      return imports[id];
    },
  });
  return exports;
}
const seo = load("../lib/seo.ts");
const catalog = load("../lib/catalog-seo.ts", { "@/lib/seo": seo });

test("pagination validates untrusted query values and preserves filters in links", () => {
  for (const value of [null, "", "-1", "0", "1.5", "Infinity", "1e2", "9007199254740992"])
    assert.equal(catalog.pageNumber(value), 1);
  assert.equal(catalog.pageNumber("2"), 2);
  assert.equal(catalog.pageHref("/category/laptops", 2), "/category/laptops?page=2");
  assert.equal(catalog.pageHref("/", 1, "page=3&q=asus"), "/?q=asus");
});

test("pagination has self canonicals and search can be excluded from indexing", () => {
  const meta = catalog.catalogMetadata("Ноутбуки", "Описание", "/category/laptops", 2);
  assert.equal(meta.alternates.canonical, "https://nemalika.uz/category/laptops?page=2");
  assert.match(meta.title.absolute, /страница 2/);
  assert.equal(meta.openGraph.url, meta.alternates.canonical);
  assert.equal(catalog.catalogMetadata("Поиск", "", "/", 1, true).robots.index, false);
});

const tree = [
  {
    id: 1,
    slug: "peripherals",
    children: [{ id: 2, slug: "gaming", children: [{ id: 3, slug: "mice", children: [] }] }],
  },
  { id: 4, slug: "gaming", children: [] },
];
test("category URLs retain the whole hierarchy and distinguish repeated slugs", () => {
  const entries = catalog.categoryEntries(tree);
  assert.equal(entries.find((e) => e.category.id === 3).href, "/category/peripherals/gaming/mice");
  assert.equal(entries.find((e) => e.category.id === 2).root.id, 1);
  assert.equal(new Set(entries.map((e) => e.href)).size, 4);
});

test("sitemap and category failures are errors, not empty successful catalogues", async () => {
  const api = load(
    "../lib/api/server.ts",
    { "server-only": {} },
    { fetch: async () => ({ ok: false, status: 503 }) },
  );
  await assert.rejects(api.getAllProductIds(), /503/);
  await assert.rejects(api.getAllShopIds(), /503/);
  await assert.rejects(api.getPublicCategories(), /503/);
  const missing = load(
    "../lib/api/server.ts",
    { "server-only": {} },
    { fetch: async () => ({ ok: false, status: 404 }) },
  );
  assert.equal(await missing.getPublicProduct(999), null);
  await assert.rejects(missing.getPublicCategories(), /Required catalogue/);
});

async function productSchema(overrides = {}) {
  const raw = {
    id: 7,
    shopId: 8,
    shopName: "Seller is not the brand",
    name: "Laptop",
    price: "120000",
    state: "new",
    characteristics: [],
    photos: [],
    ratingCount: 0,
    ...overrides,
  };
  const page = load("../app/(site)/product/[id]/page.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/navigation": {
      notFound: () => {
        throw new Error("404");
      },
      permanentRedirect: () => {
        throw new Error("308");
      },
    },
    "@/components/product/product-detail": { ProductDetail: () => null },
    "@/components/product/product-rail": { ProductRail: () => null },
    "@/components/product/track-product-view": { TrackProductView: () => null },
    "@/components/layout/page-container": { PageContainer: () => null },
    "@/lib/api/server": {
      getPublicProduct: async () => raw,
      getPublicShop: async () => null,
      getPublicProducts: async () => ({ data: [] }),
      getPublicCategories: async () => [],
    },
    "@/lib/api/mappers": { mapPublicProductCard: (p) => p, mapShop: (p) => p },
    "@/lib/api/photo": { photoUrl: (p) => p },
    "@/lib/markdown": { markdownToPlainText: (p) => p },
    "@/lib/json-ld": { serializeJsonLd: JSON.stringify },
    "@/lib/seo": seo,
    "@/lib/catalog-seo": catalog,
  });
  const element = await page.default({ params: Promise.resolve({ id: "7" }) });
  return JSON.parse(element.props.children[0].props.dangerouslySetInnerHTML.__html)[0];
}

test("product structured data does not invent brand, MPN or price expiration", async () => {
  const schema = await productSchema();
  assert.equal(schema.brand, undefined);
  assert.equal(schema.mpn, undefined);
  assert.equal(schema.offers.priceValidUntil, undefined);
  assert.equal(schema.offers.price, 120000);
  assert.equal(schema.aggregateRating, undefined);
  const branded = await productSchema({
    characteristics: [
      { key: "Бренд", value: "ASUS" },
      { key: "Модель", value: "X" },
    ],
  });
  assert.equal(branded.brand.name, "ASUS");
  assert.equal(branded.model, "X");
});

test("negotiable/invalid prices and invalid ratings are not advertised as offers or reviews", async () => {
  for (const price of [null, "NaN", "-1"])
    assert.equal((await productSchema({ price })).offers, undefined);
  assert.equal((await productSchema({ ratingCount: 2, ratingAvg: 0 })).aggregateRating, undefined);
  assert.equal(
    (await productSchema({ ratingCount: 2, ratingAvg: 4.5 })).aggregateRating.ratingValue,
    4.5,
  );
});

test("category products and paginated data render on the server without a client fetch", () => {
  const box = ({ children }) => React.createElement("div", null, children);
  const unused = () => null;
  let fetches = 0;
  const { CatalogView } = load("../components/catalog/catalog-view.tsx", {
    react: React,
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@tanstack/react-query": ReactQuery,
    "@/components/icons": {
      Loader2: unused,
      RefreshCw: unused,
      SearchX: unused,
      TriangleAlert: unused,
      X: unused,
    },
    "@/components/ui/button": { Button: box },
    "@/components/layout/page-container": { PageContainer: box },
    "@/components/shared/status-panel": {
      StatusPanel: () => React.createElement("span", null, "EMPTY"),
    },
    "@/components/product/product-card": {
      ProductCard: ({ product }) =>
        React.createElement("a", { href: `/product/${product.id}` }, product.name),
    },
    "@/components/product/product-grid": {
      ProductGrid: box,
      ProductGridSkeleton: () => React.createElement("span", null, "LOADING"),
    },
    "./use-catalog-filters": {
      useCatalogFilters: () => ({
        q: "",
        category: null,
        subCategoryId: null,
        setCategory: unused,
      }),
    },
    "@/components/providers/i18n-provider": { useT: () => ({ t: (key) => key, locale: "ru" }) },
    "@/lib/api/categories": { useCategories: () => ({ roots: [] }), findCategory: unused },
    "@/lib/api/generated/endpoints/product-cards-public/product-cards-public": {
      productCardsControllerFindAll: () => {
        fetches++;
        throw new Error("No client fetch during SSR");
      },
    },
    "@/lib/api/mappers": { mapPublicProductCard: (p) => p },
    "next/navigation": { useSearchParams: () => new URLSearchParams("page=2") },
    "@/lib/catalog-seo": catalog,
    "./pagination-links": {
      PaginationLinks: ({ page }) =>
        React.createElement("a", { href: `?page=${page + 1}` }, "Next"),
    },
    "@/lib/analytics": { visitorId: unused },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const initialData = {
    data: [{ id: 123, name: "Server-rendered laptop" }],
    meta: { page: 2, totalPages: 4, total: 80 },
  };
  const html = renderToString(
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(CatalogView, { initialData, forcedCategory: "laptops" }),
    ),
  );
  assert.match(html, /href="\/product\/123"/);
  assert.match(html, /Server-rendered laptop/);
  assert.match(html, /href="\?page=3"/);
  assert.doesNotMatch(html, /LOADING|EMPTY/);
  assert.equal(fetches, 0);
  client.clear();
});

test("Yandex feed includes later pages and real category IDs without invented vendor/delivery", async () => {
  const calls = [];
  const item = (id) => ({
    id,
    name: "A & B",
    price: "500",
    categoryId: 3,
    description: "",
    photos: [],
    characteristics: [],
    shopName: "Not a manufacturer",
  });
  const route = load("../app/yandex-market.xml/route.ts", {
    "next/server": { connection: async () => {}, NextResponse: Response },
    "@/lib/api/server": {
      getPublicCategories: async () =>
        tree.map((root) => ({
          ...root,
          name: { ru: root.slug },
          children: root.children.map((child) => ({
            ...child,
            name: { ru: child.slug },
            children: child.children.map((leaf) => ({ ...leaf, name: { ru: leaf.slug } })),
          })),
        })),
      getPublicProducts: async ({ page = 1 }) => {
        calls.push(page);
        return { data: [item(page)], meta: { totalPages: 2 } };
      },
    },
    "@/lib/api/photo": { photoUrl: (p) => p },
    "@/lib/catalog-seo": catalog,
    "@/lib/markdown": { markdownToPlainText: (p) => p },
    "@/lib/seo": seo,
  });
  const response = await route.GET();
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [1, 2]);
  assert.match(xml, /offer id="2"/);
  assert.match(xml, /category id="3" parentId="2"/);
  assert.match(xml, /<categoryId>3<\/categoryId>/);
  assert.match(xml, /A &amp; B/);
  assert.doesNotMatch(xml, /<vendor>|<delivery>|<pickup>/);
});
