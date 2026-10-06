import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

function load(path, imports = {}) {
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
    require: (id) => {
      assert.ok(id in imports, `Unexpected import ${id}`);
      return imports[id];
    },
  });
  return exports;
}

const ui = Object.fromEntries(
  [
    "Card",
    "Button",
    "Input",
    "DialogFooter",
    "Field",
    "FieldGroup",
    "FieldLabel",
    "Textarea",
    "Checkbox",
    "Select",
    "SelectContent",
    "SelectGroup",
    "SelectItem",
    "SelectTrigger",
    "SelectValue",
    "PhotoDropzone",
    "PhotoAiDialog",
    "FixDescriptionButton",
    "ProductAutofillButton",
    "CategorySelect",
    "Plus",
    "Send",
    "Trash2",
    "Dialog",
    "DialogContent",
    "DialogDescription",
    "DialogHeader",
    "DialogTitle",
  ].map((name) => [name, name]),
);
const productForm = load("../lib/product-form.ts");
const format = load("../lib/format.ts");
const generated = load("../components/shared/apply-generated.ts", {
  "@/components/seller/photo-dropzone": { MAX_PHOTOS: 10 },
});
const photo = {
  id: "photo-1",
  key: "stored/photo-1",
  url: "data:image/jpeg;base64,AA==",
  name: "Photo",
};

function harness({
  shop = { id: 7, status: "active", restrictedCategoriesEnabled: false },
  embedded = true,
  fail = false,
} = {}) {
  const values = [];
  let cursor = 0;
  let root;
  let nodes;
  const writes = [];
  const errors = [];
  const successes = [];
  const routes = [];
  let closed = 0;
  let invalidated = 0;
  const props = { embedded, onDone: embedded ? () => closed++ : undefined };
  const { AddProductForm } = load("../components/seller/add-product-form.tsx", {
    react: {
      useState: (initial) => {
        const index = cursor++;
        if (!(index in values)) values[index] = typeof initial === "function" ? initial() : initial;
        return [
          values[index],
          (value) => {
            values[index] = typeof value === "function" ? value(values[index]) : value;
          },
        ];
      },
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/navigation": { useRouter: () => ({ push: (path) => routes.push(path) }) },
    "@tanstack/react-query": {
      useQueryClient: () => ({ invalidateQueries: async () => invalidated++ }),
    },
    "@/components/icons": ui,
    sonner: {
      toast: {
        error: (message) => errors.push(message),
        success: (...args) => successes.push(args),
      },
    },
    ...Object.fromEntries(
      ["card", "button", "input", "dialog", "field", "textarea", "checkbox", "select"].map(
        (name) => [`@/components/ui/${name}`, ui],
      ),
    ),
    "./photo-dropzone": ui,
    "@/components/shared/photo-ai-dialog": ui,
    "@/components/shared/fix-description-button": ui,
    "@/components/shared/product-autofill-button": ui,
    "@/components/shared/apply-generated": generated,
    "./category-select": ui,
    "@/components/providers/i18n-provider": { useT: () => ({ t: (key) => key }) },
    "@/lib/api/seller": { useSellerShop: () => ({ shop, isLoading: false }) },
    "@/lib/api/errors": { apiErrorMessage: (error) => error.message },
    "@/lib/api/generated/endpoints/product-cards-seller/product-cards-seller": {
      useSellerProductCardsControllerCreate: () => ({
        mutateAsync: async (args) => {
          if (fail) throw new Error("Create failed");
          writes.push(JSON.parse(JSON.stringify(args)));
        },
      }),
    },
    "@/lib/api/upload": { resolvePhotoKeys: async (photos) => photos.map((p) => p.key) },
    "@/lib/format": format,
    "@/lib/product-form": productForm,
    "@/lib/metrika": { GOALS: { productCreated: "productCreated" }, reachGoal: () => {} },
  });
  function render() {
    cursor = 0;
    root = AddProductForm(props);
    nodes = [];
    function visit(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(visit);
      nodes.push(node);
      visit(node.props?.children);
    }
    visit(root);
    return root;
  }
  function find(type, predicate = () => true) {
    render();
    const node = nodes.find((node) => node.type === type && predicate(node.props));
    assert.ok(node, `Missing ${type}`);
    return node.props;
  }
  function input(id, value) {
    find("Input", (p) => p.id === id).onChange({ target: { value } });
  }
  function fill() {
    input("name", "  Video card  ");
    input("price", "419900");
    find("CategorySelect").onChange(12);
    find("PhotoDropzone").onChange([photo]);
  }
  render();
  return {
    render,
    find,
    input,
    fill,
    writes,
    errors,
    successes,
    routes,
    get nodes() {
      render();
      return nodes;
    },
    get closed() {
      return closed;
    },
    get invalidated() {
      return invalidated;
    },
    submit: () => render().props.onSubmit({ preventDefault() {} }),
  };
}

test("seller creation exposes every field, photo tools and publish immediately without steps", () => {
  for (const embedded of [true, false]) {
    const form = harness({ embedded });
    for (const id of ["name", "price", "brand", "model"]) form.find("Input", (p) => p.id === id);
    for (const type of [
      "Select",
      "CategorySelect",
      "Textarea",
      "PhotoDropzone",
      "ProductAutofillButton",
      "FixDescriptionButton",
      "PhotoAiDialog",
    ])
      form.find(type);
    form.find("Button", (p) => p.type === "submit");
    assert.equal(
      form.nodes.some(
        (n) =>
          n.props["aria-current"] === "step" || n.props["aria-label"] === "seller.add.stepsLabel",
      ),
      false,
    );
    assert.equal(
      form.nodes.some((n) =>
        ["common.next", "common.back", "seller.add.reviewTitle"].includes(n.props.children),
      ),
      false,
    );
    assert.match(form.render().props.className, /min-w-0/);
  }
});

test("single-form submit preserves seller shop, fields, photos and moderation feedback", async () => {
  const form = harness();
  form.fill();
  form.input("brand", " NVIDIA ");
  form.input("model", " RTX 4070 ");
  form.find("Textarea").onChange({ target: { value: " Description " } });
  form.find("Select").onValueChange("old");
  form
    .find("Input", (p) => p["aria-label"] === "seller.add.specName")
    .onChange({ target: { value: " Memory " } });
  form
    .find("Input", (p) => p["aria-label"] === "seller.add.specValue")
    .onChange({ target: { value: " 12 GB " } });
  await form.submit();
  assert.deepEqual(form.writes, [
    {
      shopId: 7,
      data: {
        name: "Video card",
        description: "Description",
        photos: [photo.key],
        price: 419900,
        state: "old",
        categoryId: 12,
        characteristics: [
          { key: "Бренд", value: "NVIDIA" },
          { key: "Модель", value: "RTX 4070" },
          { key: "Memory", value: "12 GB" },
        ],
      },
    },
  ]);
  assert.equal(form.closed, 1);
  assert.equal(form.invalidated, 1);
  assert.equal(form.successes[0][1].description, "seller.add.sentToAi");
});

test("validation still blocks missing required fields, missing shops and abolished shops", async () => {
  const form = harness();
  await form.submit();
  assert.equal(form.errors.at(-1), "seller.add.needNamePrice");
  form.input("name", "Product");
  form.input("price", "100");
  await form.submit();
  assert.equal(form.errors.at(-1), "seller.add.needPhoto");
  form.find("PhotoDropzone").onChange([photo]);
  await form.submit();
  assert.equal(form.errors.at(-1), "seller.add.needCategory");
  assert.equal(form.writes.length, 0);
  const absent = harness({ shop: null });
  await absent.submit();
  assert.equal(absent.errors.at(-1), "seller.add.needShop");
  assert.deepEqual(absent.routes, ["/seller/profile"]);
  const abolished = harness({ shop: { id: 7, status: "abolished" } });
  assert.equal(abolished.find("Button", (p) => p.type === "submit").disabled, true);
  await abolished.submit();
  assert.equal(abolished.errors.at(-1), "seller.add.shopAbolished");
  assert.equal(abolished.writes.length, 0);
});

test("negotiable price, category restrictions and standalone success are preserved", async () => {
  const form = harness({
    embedded: false,
    shop: { id: 9, status: "active", restrictedCategoriesEnabled: true },
  });
  form.fill();
  form.input("price", "");
  form.find("Checkbox").onCheckedChange(true);
  assert.equal(form.find("Input", (p) => p.id === "price").disabled, true);
  assert.equal(form.find("CategorySelect").allowRestricted, true);
  await form.submit();
  assert.equal(form.writes[0].data.price, null);
  assert.equal(form.writes[0].shopId, 9);
  assert.deepEqual(form.routes, ["/seller/products"]);
  assert.equal(harness().find("CategorySelect").allowRestricted, false);
});

test("AI applies and restores all fields in the same form and retains uploaded photo keys", () => {
  const form = harness();
  form.fill();
  const ai = form.find("ProductAutofillButton");
  ai.onApply({
    description: "AI description",
    brand: "AI brand",
    model: "AI model",
    characteristics: [{ key: "Memory", value: "16 GB" }],
    categoryId: 14,
    state: "old",
  });
  assert.equal(form.find("Textarea").value, "AI description");
  assert.equal(form.find("Input", (p) => p.id === "brand").value, "AI brand");
  assert.equal(form.find("Input", (p) => p.id === "model").value, "AI model");
  assert.equal(
    form.find("Input", (p) => p["aria-label"] === "seller.add.specName").value,
    "Memory",
  );
  assert.equal(form.find("CategorySelect").value, 14);
  assert.equal(form.find("Select").value, "old");
  form.find("ProductAutofillButton").onRestore(ai.snapshot);
  assert.equal(form.find("Textarea").value, "");
  assert.equal(form.find("Input", (p) => p.id === "brand").value, "");
  assert.equal(form.find("CategorySelect").value, 12);
  assert.equal(form.find("Select").value, "new");
  form.find("ProductAutofillButton").onPhotoStored(photo.id, "uploaded/photo");
  assert.equal(form.find("PhotoDropzone").photos[0].key, "uploaded/photo");
  form.find("FixDescriptionButton").onResult("Fixed description");
  assert.equal(form.find("Textarea").value, "Fixed description");
  form.find("PhotoDropzone").onPhotoClick(photo);
  assert.equal(form.find("PhotoAiDialog").photo.id, photo.id);
  form.find("PhotoAiDialog").onApply([{ ...photo, id: "generated", key: "generated/photo" }]);
  assert.equal(form.find("PhotoDropzone").photos[0].key, "generated/photo");
});

test("characteristic rows, cancel and failed-submit recovery remain usable", async () => {
  const form = harness({ fail: true });
  form.find("Button", (p) => p.children?.at?.(-1) === "seller.add.addSpec").onClick();
  assert.equal(
    form.nodes.filter((n) => n.type === "Input" && n.props["aria-label"] === "seller.add.specName")
      .length,
    2,
  );
  form.find("Button", (p) => p["aria-label"] === "common.delete").onClick();
  assert.equal(
    form.nodes.filter((n) => n.type === "Input" && n.props["aria-label"] === "seller.add.specName")
      .length,
    1,
  );
  form.fill();
  await form.submit();
  assert.equal(form.errors.at(-1), "Create failed");
  assert.equal(form.closed, 0);
  assert.equal(form.find("Button", (p) => p.type === "submit").disabled, false);
  form.find("Button", (p) => p.children === "common.cancel").onClick();
  assert.equal(form.closed, 1);
});

test("seller dialog matches admin width and keeps vertical-only scrolling", () => {
  const { AddProductDialog } = load("../components/seller/add-product-dialog.tsx", {
    react: { useState: (initial) => [initial, () => {}], useEffect: () => {} },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/components/ui/dialog": ui,
    "@/components/providers/i18n-provider": { useT: () => ({ t: (key) => key }) },
    "./add-product-form": { AddProductForm: "AddProductForm" },
    "./add-product-bus": { onOpenAddProduct: () => () => {} },
  });
  const content = AddProductDialog().props.children;
  assert.match(content.props.className, /sm:max-w-xl/);
  assert.match(content.props.className, /overflow-y-auto/);
  assert.match(content.props.className, /overflow-x-hidden/);
});
