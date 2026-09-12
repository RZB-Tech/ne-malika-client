import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

// Exercise the real client modules with isolated storage and HTTP adapters.
function loadModule(path, imports) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    process: { env: {} },
    require: (id) => {
      assert.ok(id in imports, `Unexpected dependency: ${id}`);
      return imports[id];
    },
  });
  return exports;
}

function authHarness(post) {
  let token = "expired";
  let writes = 0;
  const axios = {
    create: () => ({ interceptors: { request: { use() {} }, response: { use() {} } } }),
    post,
    isAxiosError: (error) => error.isAxiosError === true,
  };
  const auth = loadModule("../lib/api/mutator.ts", {
    axios: { default: axios },
    "./token-store": {
      getAccessToken: () => token,
      setAuth: (value) => {
        token = value;
        writes++;
      },
      clearAuth: () => {
        token = null;
      },
    },
    "@/lib/i18n/config": { defaultLocale: "ru" },
  });
  return {
    ...auth,
    token: () => token,
    writes: () => writes,
    logout: () => {
      token = null;
    },
  };
}

test("startup, SSE and REST share one refresh request", async () => {
  let requests = 0;
  let resolve;
  const h = authHarness(() => {
    requests++;
    return new Promise((done) => {
      resolve = done;
    });
  });
  const calls = Array.from({ length: 5 }, () => h.refreshAuthSession());
  assert.equal(requests, 1);
  resolve({ data: { accessToken: "fresh", user: { id: 1 } } });
  await Promise.all(calls);
  assert.equal(h.token(), "fresh");
  assert.equal(h.writes(), 1);
});

test("rejected refresh clears expired credentials", async () => {
  const h = authHarness(async () => {
    throw { isAxiosError: true, response: { status: 401 } };
  });
  assert.equal(await h.refreshAuthSession(), null);
  assert.equal(h.token(), null);
});

test("temporary network failure preserves credentials and allows retry", async () => {
  let requests = 0;
  const h = authHarness(async () => {
    if (++requests === 1) throw new Error("offline");
    return { data: { accessToken: "fresh", user: { id: 1 } } };
  });
  assert.equal(await h.refreshAuthSession(), null);
  assert.equal(h.token(), "expired");
  await h.refreshAuthSession();
  assert.equal(h.token(), "fresh");
});

test("a late refresh cannot restore a logged out session", async () => {
  let resolve;
  const h = authHarness(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = h.refreshAuthSession();
  h.logout();
  resolve({ data: { accessToken: "fresh", user: { id: 1 } } });
  assert.equal(await pending, null);
  assert.equal(h.token(), null);
});

test("favorites beyond 200 are retained using API pages of at most 100", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const { fetchAllFavorites } = loadModule("../lib/favorites/fetch-favorites.ts", {
    "@/lib/api/generated/endpoints/me-favorites/me-favorites": {
      favoritesControllerFindMine: async ({ page, limit }, _, requestSignal) => {
        assert.equal(limit, 100);
        assert.equal(requestSignal, signal);
        calls.push(page);
        return {
          data: Array.from({ length: page === 3 ? 5 : 100 }, (_, i) => ({
            id: (page - 1) * 100 + i,
          })),
          meta: { page, limit, total: 205, totalPages: 3 },
        };
      },
    },
  });
  const result = await fetchAllFavorites(signal);
  assert.deepEqual(calls, [1, 2, 3]);
  assert.equal(result.data.length, 205);
  assert.equal(result.data.at(-1).id, 204);
});
