import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

function load(path, imports) {
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
    require: (id) => {
      assert.ok(id in imports, `Unexpected import ${id}`);
      return imports[id];
    },
  });
  return exports;
}

const banners = load("../lib/api/banners.ts", {
  "./photo": { photoUrl: (key) => key },
});
const past = "2020-01-01T00:00:00.000Z";
const future = "2099-01-01T00:00:00.000Z";

test("only platform banners expire by their own date, including legacy shop banners", () => {
  assert.equal(banners.bannerExpired({ shopId: 7, expiresAt: past }), false);
  assert.equal(banners.bannerExpired({ shopId: 7, expiresAt: future }), false);
  assert.equal(banners.bannerExpired({ shopId: null, expiresAt: past }), true);
  assert.equal(banners.bannerExpired({ expiresAt: past }), true);
  assert.equal(banners.bannerExpired({ shopId: null, expiresAt: future }), false);
  assert.equal(banners.bannerExpired({ shopId: null, expiresAt: null }), false);
});

function formFor(shopId) {
  const writes = [];
  const box = ({ children }) => children;
  const ui = {};
  for (const name of [
    "Dialog",
    "DialogContent",
    "DialogDescription",
    "DialogFooter",
    "DialogHeader",
    "DialogTitle",
    "Button",
    "Input",
    "Label",
    "Switch",
    "ShopPicker",
    "BannerAiPanel",
  ])
    ui[name] = box;
  const endpoint = {
    getAdminBannersControllerFindAllQueryKey: () => ["banners"],
    getAdminShopBannersControllerListQueryKey: () => ["shop-banners"],
    useAdminBannersControllerCreate: () => ({ mutateAsync: async (args) => writes.push(args) }),
    useAdminBannersControllerUpdate: () => ({ mutateAsync: async (args) => writes.push(args) }),
  };
  const { BannerFormDialog } = load("../components/admin/banner-form-dialog.tsx", {
    react: {
      useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
      useRef: (initial) => ({ current: initial }),
      useEffect: () => {},
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@tanstack/react-query": { useQueryClient: () => ({ invalidateQueries: async () => {} }) },
    sonner: { toast: { error: assert.fail, success: () => {} } },
    "@/components/icons": { Copy: box, ImagePlus: box },
    "@/components/ui/dialog": ui,
    "@/components/ui/button": ui,
    "@/components/ui/input": ui,
    "@/components/ui/label": ui,
    "@/components/ui/switch": ui,
    "@/components/admin/shop-picker": ui,
    "@/components/providers/i18n-provider": { useT: () => ({ t: (key) => key }) },
    "@/lib/i18n/config": { localeNames: { ru: "Русский", "uz-Latn": "O‘zbekcha" } },
    "@/lib/api/banners": banners,
    "@/components/seller/banner-ai-panel": ui,
    "@/lib/api/errors": { apiErrorMessage: (error) => error.message },
    "@/lib/api/photo": { photoUrl: (key) => key },
    "@/lib/api/upload": {
      uploadPhoto: () => assert.fail("Existing images must not be uploaded again"),
    },
    "@/lib/api/generated/endpoints/banners-admin/banners-admin": endpoint,
  });
  const root = BannerFormDialog({
    target: {
      id: 1,
      shopId,
      title: "Shop banner",
      expiresAt: past,
      photoRu: "ru",
      photoUzLatn: "uz",
    },
    shops: [{ id: 7, name: "Store" }],
    onOpenChange: () => {},
  });
  const content = root.props.children;
  const body = content.props.children;
  const form = body.type(body.props);
  const nodes = [];
  function visit(node) {
    if (node == null || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    nodes.push(node);
    visit(node.props?.children);
  }
  visit(form);
  return { form, content, nodes, writes };
}

test("shop banner dialog hides the independent date and clears it on save", async () => {
  const { form, nodes, writes } = formFor(7);
  assert.equal(
    nodes.some((node) => node.props?.id === "banner-expiry"),
    false,
  );
  assert.ok(nodes.some((node) => node.props?.children === "seller.banner.subscriptionHint"));
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(writes[0].data.expiresAt, null);
  assert.equal(writes[0].data.shopId, 7);
});

test("platform banner dialog keeps the independent date and saves it", async () => {
  const { form, nodes, writes } = formFor(null);
  const expiry = nodes.find((node) => node.props?.id === "banner-expiry");
  assert.ok(expiry);
  assert.equal(expiry.props.value, banners.expiryToInput(past));
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(writes[0].data.expiresAt, banners.expiryFromInput(expiry.props.value));
  assert.equal(writes[0].data.shopId, null);
});

test("dialog constrains its grid child and keeps only vertical scrolling", () => {
  const { content, form } = formFor(7);
  assert.match(content.props.className, /overflow-x-hidden/);
  assert.match(content.props.className, /overflow-y-auto/);
  assert.match(form.props.className, /min-w-0/);
});

test("MAX duration explanation exists in every supported locale", () => {
  for (const locale of ["ru", "uz-latn", "uz-cyrl"]) {
    const messages = JSON.parse(
      readFileSync(new URL(`../lib/i18n/locales/${locale}.json`, import.meta.url), "utf8"),
    );
    assert.match(messages.seller.banner.subscriptionHint, /MAX/);
  }
});
