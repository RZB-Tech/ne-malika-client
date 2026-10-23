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
    URL,
    process: { env: { NEXT_PUBLIC_API_URL: "https://api.nemalika.uz" } },
    require: (id) => {
      assert.ok(id in imports, `Unexpected import ${id}`);
      return imports[id];
    },
  });
  return exports;
}
const { photoUrl } = load("../lib/api/photo.ts");
const source = {
  id: "source",
  key: "e218d375-8d0d-4508-9d0a-3594a786b3e1",
  url: "https://static.nemalika.uz/expired-source",
  name: "Source",
};
const variant = {
  key: "d50a2d50-e44a-493f-9abd-06a15bf55b6f",
  url: "https://static.nemalika.uz/expired-variant",
};

function harness({ photo = source, history = [], generated = [] } = {}) {
  const state = [],
    refs = [],
    applied = [],
    requests = [];
  let cursor, refCursor, nodes;
  const ui = Object.fromEntries(
    [
      "Dialog",
      "DialogContent",
      "DialogDescription",
      "DialogHeader",
      "DialogTitle",
      "Button",
      "Label",
      "Textarea",
      "Select",
      "SelectContent",
      "SelectItem",
      "SelectTrigger",
      "SelectValue",
      "Check",
      "ImagePlus",
      "Sparkles",
      "Wand2",
      "X",
    ].map((name) => [name, name]),
  );
  const { PhotoAiDialog } = load("../components/shared/photo-ai-dialog.tsx", {
    react: {
      useState: (initial) => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [
          state[index],
          (next) => {
            state[index] = typeof next === "function" ? next(state[index]) : next;
          },
        ];
      },
      useRef: (initial) => {
        const index = refCursor++;
        return (refs[index] ??= { current: initial });
      },
      useMemo: (fn) => fn(),
      useLayoutEffect: (fn) => fn(),
      useEffect: () => {},
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/components/icons": ui,
    sonner: { toast: { error: assert.fail, success: () => {} } },
    ...Object.fromEntries(
      ["dialog", "button", "label", "textarea", "select"].map((name) => [
        `@/components/ui/${name}`,
        ui,
      ]),
    ),
    "@/lib/api/generated/endpoints/image-gen/image-gen": {
      useImageGenControllerDescribe: () => ({}),
      useImageGenControllerGenerate: () => ({
        mutateAsync: async (args) => {
          requests.push(args);
          return generated;
        },
      }),
      useImageGenControllerHistory: () => ({ data: history, refetch: async () => {} }),
      useImageGenControllerBalance: () => ({
        data: { allowed: true, credits: null },
        refetch: async () => {},
      }),
    },
    "@/components/seller/photo-dropzone": {
      storedPhoto: (key, url, name) => ({ id: key, key, url, name }),
    },
    "@/components/providers/i18n-provider": { useT: () => ({ t: (key) => key }) },
    "@/lib/api/errors": { apiErrorMessage: (err) => err.message },
    "@/lib/api/upload": { dataUrlToBlob: assert.fail, uploadPhoto: assert.fail },
    "@/lib/api/photo": { photoUrl },
    "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  });
  const root = PhotoAiDialog({
    photo,
    onClose: () => {},
    onApply: (photos) => applied.push(photos),
  });
  function render() {
    cursor = refCursor = 0;
    nodes = [];
    if (!root) return null;
    const tree = root.type(root.props);
    function visit(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(visit);
      nodes.push(node);
      visit(node.props?.children);
    }
    visit(tree);
    return tree;
  }
  function button(label) {
    render();
    const node = nodes.find(
      (node) =>
        node.type === "Button" &&
        (node.props.children === label || node.props.children?.includes?.(label)),
    );
    assert.ok(node, `Missing button ${label}`);
    return node.props;
  }
  return {
    applied,
    requests,
    render,
    button,
    images: () => {
      render();
      return nodes.filter((node) => node.type === "img").map((node) => node.props);
    },
    pick: (key) => {
      render();
      const node = nodes.find((node) => node.type === "button" && node.key === key);
      assert.ok(node);
      node.props.onClick();
    },
    setPrompt: (value) => {
      render();
      nodes.find((node) => node.props.id === "ai-prompt").props.onChange({ target: { value } });
    },
  };
}

test("saved source and history previews use the working API instead of expired storage URLs", () => {
  const form = harness({ history: [variant] });
  assert.deepEqual(
    form.images().map((image) => image.src),
    [photoUrl(source.key), photoUrl(variant.key)],
  );
  form.pick(variant.key);
  form.button("admin.photoAi.apply").onClick();
  assert.equal(form.applied[0][0].key, variant.key);
  assert.equal(form.applied[0][0].url, photoUrl(variant.key));
  assert.equal(form.requests.length, 0);
});

test("fresh generations, deduplicated history and replacement photos share canonical URLs", async () => {
  const second = {
    key: "d0965c80-7733-48ec-aa64-1654a54bcd7f",
    url: "https://elsewhere.invalid/image",
  };
  const form = harness({ history: [variant], generated: [variant, second] });
  form.setPrompt("Make a product photo");
  await form.button("admin.photoAi.generate").onClick();
  assert.equal(form.requests.length, 1);
  assert.equal(form.images().length, 3);
  assert.equal(form.images()[2].src, photoUrl(second.key));
  form.pick(variant.key);
  form.pick(second.key);
  form.button("admin.photoAi.apply").onClick();
  assert.deepEqual(
    Array.from(form.applied[0], (photo) => photo.url),
    [photoUrl(variant.key), photoUrl(second.key)],
  );
  assert.equal(
    form.requests.length,
    1,
    "Applying generated images must not trigger another paid generation",
  );
});

test("unsaved local photo previews remain local", () => {
  const form = harness({ photo: { ...source, key: undefined, url: "data:image/png;base64,AA==" } });
  assert.equal(form.render().type, "Dialog");
  assert.equal(harness({ photo: null }).render(), null);
});

test("failed previews are not applied and can be retried without paid regeneration", () => {
  const form = harness({ history: [variant] });
  form.pick(variant.key);
  form.images()[1].onError();
  assert.equal(form.button("admin.photoAi.apply").disabled, true);
  form.pick(variant.key);
  assert.equal(form.button("admin.photoAi.apply").disabled, true);
  assert.equal(form.images().length, 1);

  form.button("common.retry").onClick();
  assert.equal(form.images()[1].src, `${photoUrl(variant.key)}?previewRetry=1`);
  form.pick(variant.key);
  form.button("admin.photoAi.apply").onClick();
  assert.equal(form.applied[0][0].url, photoUrl(variant.key));
  assert.equal(form.requests.length, 0);
});
