import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

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
const initial = {
  data: [{ id: 123, name: "Product" }],
  meta: { page: 1, totalPages: 4, total: 80 },
};

test("each full home render creates a fresh shuffle and passes exactly its seed/data to hydration", async () => {
  let requestReady = false;
  let sequence = 0;
  const requests = [];
  const { default: HomePage } = load("../app/(site)/page.tsx", {
    react: { Suspense: "Suspense" },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/navigation": { notFound: assert.fail, permanentRedirect: assert.fail },
    "next/server": {
      connection: async () => {
        requestReady = true;
      },
    },
    "@/components/home/banner-carousel": { BannerCarousel: "BannerCarousel" },
    "@/components/catalog/catalog-view": { CatalogView: "CatalogView" },
    "@/lib/api/server": {
      getPublicProducts: async (params) => {
        requests.push(params);
        return initial;
      },
      getBanners: async () => [],
    },
    "@/lib/json-ld": { serializeJsonLd: JSON.stringify },
    "@/lib/seo": seo,
    "@/lib/catalog-seo": catalog,
    "@/lib/catalog-seed": {
      randomCatalogSeed: () => {
        assert.ok(requestReady);
        requestReady = false;
        return `seed000${++sequence}`;
      },
    },
  });
  const one = await HomePage({ searchParams: Promise.resolve({}) });
  const two = await HomePage({ searchParams: Promise.resolve({}) });
  assert.equal(requests[0].sort, "random");
  assert.equal(requests[1].sort, "random");
  assert.notEqual(requests[0].seed, requests[1].seed);
  for (const [index, tree] of [one, two].entries()) {
    const view = tree.props.children.find((node) => node?.type === "Suspense").props.children;
    assert.equal(view.props.initialSeed, requests[index].seed);
    assert.equal(view.props.initialData, initial);
  }
  await HomePage({ searchParams: Promise.resolve({ q: "laptop" }) });
  assert.equal(requests[2].sort, "newest");
  assert.equal(requests[2].seed, undefined);
});

test("random catalogue requests bypass shared cache while deterministic listings retain caching", async () => {
  const calls = [];
  const api = load(
    "../lib/api/server.ts",
    { "server-only": {} },
    {
      fetch: async (url, options) => {
        calls.push({ url: new URL(url), options });
        return { ok: true, json: async () => initial };
      },
    },
  );
  await api.getPublicProducts({ sort: "random", seed: "seed0001", page: 2 });
  await api.getPublicProducts({ sort: "newest", category: "laptops" });
  assert.equal(calls[0].url.searchParams.get("sort"), "random");
  assert.equal(calls[0].url.searchParams.get("seed"), "seed0001");
  assert.equal(calls[0].url.searchParams.get("page"), "2");
  assert.equal(calls[0].options.cache, "no-store");
  assert.equal(calls[0].options.next, undefined);
  assert.equal(calls[1].options.next.revalidate, 60);
});

function viewHarness() {
  const state = [];
  let cursor = 0;
  let config;
  let page = 1;
  let filters = { q: "", category: null, subCategoryId: null, setCategory: () => {} };
  const requests = [];
  const ui = Object.fromEntries(
    [
      "Loader2",
      "RefreshCw",
      "SearchX",
      "TriangleAlert",
      "X",
      "Button",
      "PageContainer",
      "StatusPanel",
      "ProductCard",
      "ProductGrid",
      "ProductGridSkeleton",
      "PaginationLinks",
    ].map((name) => [name, name]),
  );
  const { CatalogView } = load("../components/catalog/catalog-view.tsx", {
    react: {
      useState: (initialValue) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initialValue;
        return [
          state[index],
          (value) => {
            state[index] = typeof value === "function" ? value(state[index]) : value;
          },
        ];
      },
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      useRef: () => ({ current: null }),
      useEffect: () => {},
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@tanstack/react-query": {
      useInfiniteQuery: (options) => {
        config = options;
        return { data: options.initialData, fetchNextPage: () => {}, refetch: () => {} };
      },
    },
    "@/components/icons": ui,
    "@/components/ui/button": ui,
    "@/components/layout/page-container": ui,
    "@/components/shared/status-panel": ui,
    "@/components/product/product-card": ui,
    "@/components/product/product-grid": ui,
    "./use-catalog-filters": { useCatalogFilters: () => filters },
    "@/components/providers/i18n-provider": { useT: () => ({ t: (key) => key, locale: "ru" }) },
    "@/lib/api/categories": { useCategories: () => ({ roots: [] }), findCategory: () => undefined },
    "@/lib/api/generated/endpoints/product-cards-public/product-cards-public": {
      productCardsControllerFindAll: async (params) => {
        requests.push(params);
        return initial;
      },
    },
    "@/lib/api/mappers": { mapPublicProductCard: (p) => p },
    "next/navigation": { useSearchParams: () => new URLSearchParams(`page=${page}`) },
    "@/lib/catalog-seo": catalog,
    "./pagination-links": ui,
    "@/lib/analytics": { visitorId: () => undefined },
  });
  return {
    requests,
    render: (props = {}) => {
      cursor = 0;
      CatalogView(props);
      return config;
    },
    setPage: (value) => {
      page = value;
    },
    setFilters: (value) => {
      filters = { ...filters, ...value };
    },
  };
}

test("hydration and every infinite-scroll page use one seed, not newest or per-page shuffles", async () => {
  const view = viewHarness();
  const config = view.render({ initialData: initial, initialSeed: "seed0001" });
  assert.equal(config.initialData.pages[0], initial);
  assert.equal(config.queryKey[2].sort, "random");
  await config.queryFn({ pageParam: 1 });
  await config.queryFn({ pageParam: 2 });
  assert.deepEqual(
    view.requests.map((p) => [p.sort, p.seed, p.page]),
    [
      ["random", "seed0001", 1],
      ["random", "seed0001", 2],
    ],
  );
  const reloaded = viewHarness().render({ initialData: initial, initialSeed: "seed0002" });
  assert.notDeepEqual(config.queryKey, reloaded.queryKey);
});

test("client pagination keeps the visit seed and never mixes initial data from another shuffle", async () => {
  const view = viewHarness();
  view.render({ initialData: initial, initialSeed: "seed0001" });
  view.setPage(2);
  const config = view.render({
    initialData: { ...initial, meta: { ...initial.meta, page: 2 } },
    initialSeed: "seed0002",
  });
  assert.equal(config.initialData, undefined);
  await config.queryFn({ pageParam: 2 });
  assert.equal(view.requests[0].seed, "seed0001");
});

test("search and category results remain deterministic and reuse their matching SSR data", () => {
  const search = viewHarness();
  search.setFilters({ q: "laptop" });
  const searched = search.render({
    initialSeed: "seed0001",
    initialData: initial,
    initialQuery: "laptop",
  });
  assert.equal(searched.queryKey[2].sort, "newest");
  assert.equal(searched.queryKey[2].seed, undefined);
  assert.equal(searched.initialData.pages[0], initial);
  const category = viewHarness().render({ initialData: initial, forcedCategory: "laptops" });
  assert.equal(category.queryKey[2].sort, "newest");
  assert.equal(category.initialData.pages[0], initial);
});

test("generated shuffle seeds satisfy the existing API contract", () => {
  const { randomCatalogSeed } = load("../lib/catalog-seed.ts");
  const seeds = Array.from({ length: 100 }, () => randomCatalogSeed());
  for (const seed of seeds) assert.match(seed, /^[A-Za-z0-9_-]{1,32}$/);
  assert.ok(new Set(seeds).size > 1);
});
