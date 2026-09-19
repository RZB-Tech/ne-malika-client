import assert from "node:assert/strict";
import test from "node:test";

const base = process.env.SEO_TEST_BASE_URL;
const options = { skip: !base, timeout: 90000 };
async function page(path) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    headers: { "User-Agent": "Googlebot" },
  });
  return { response, html: await response.text() };
}
const links = (html) =>
  [
    ...html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").matchAll(/href="(\/product\/\d+)"/g),
  ].map((m) => m[1]);

test(
  "catalogue is rendered without JS and later pages have different products/canonicals",
  options,
  async () => {
    const [one, two] = await Promise.all([page("/"), page("/?page=2")]);
    assert.equal(one.response.status, 200);
    assert.equal(two.response.status, 200);
    assert.ok(links(one.html).length > 0);
    assert.ok(links(two.html).length > 0);
    assert.notDeepEqual(links(one.html), links(two.html));
    assert.match(one.html, /href="\/\?page=2"/);
    assert.match(two.html, /rel="canonical" href="https:\/\/nemalika.uz\/\?page=2"/);
    assert.match(one.html, /<h1\b/);
  },
);

test("categories render server products, and directory includes IT services", options, async () => {
  const [category, directory] = await Promise.all([page("/category/laptops"), page("/category")]);
  assert.equal(category.response.status, 200);
  assert.ok(links(category.html).length > 0);
  assert.equal(directory.response.status, 200);
  assert.match(directory.html, /href="\/category\/services/);
});

test("search is noindex and legacy category filters redirect", options, async () => {
  const search = await page("/?q=asus");
  assert.equal(search.response.status, 200);
  assert.match(search.html, /name="robots" content="noindex, follow"/);
  const legacy = await page("/?category=laptops");
  assert.equal(legacy.response.status, 308);
  assert.equal(legacy.response.headers.get("location"), "/category/laptops");
});

test(
  "unknown categories and out-of-range pages do not become soft-404 catalogue pages",
  options,
  async () => {
    for (const path of [
      "/category/this-category-does-not-exist",
      "/?page=999999",
      "/product/1.5",
    ]) {
      const result = await page(path);
      // Next streaming can send status 200 after headers; the noindex signal is required then.
      assert.ok(
        result.response.status === 404 ||
          (result.response.status === 200 && /name="robots" content="noindex"/.test(result.html)),
        path,
      );
    }
  },
);

test(
  "sitemap, robots, social image and private-route robots header are present",
  options,
  async () => {
    const [sitemap, robots, account, social] = await Promise.all([
      page("/sitemap.xml"),
      page("/robots.txt"),
      page("/account"),
      fetch(new URL("/social-image", base)),
    ]);
    assert.equal(sitemap.response.status, 200);
    assert.match(sitemap.html, /https:\/\/nemalika.uz\/category\/services/);
    assert.match(robots.html, /Sitemap: https:\/\/nemalika.uz\/sitemap.xml/);
    assert.match(account.response.headers.get("x-robots-tag"), /noindex/);
    assert.equal(social.status, 200);
    assert.match(social.headers.get("content-type"), /image\/png/);
  },
);
