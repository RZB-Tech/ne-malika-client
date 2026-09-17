import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Exercise the real client modules with isolated storage and HTTP adapters.
function loadModule(path, imports, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
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
    process: { env: {} },
    ...globals,
    require: (id) => {
      assert.ok(id in imports, `Unexpected dependency: ${id}`);
      return imports[id];
    },
  });
  return exports;
}

function authHarness(post) {
  let token = "expired";
  let session = 0;
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
      getSessionVersion: () => session,
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
      session++;
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
    "@/lib/api/token-store": tokenHarness(),
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

function hooksHarness() {
  const slots = [];
  let index = 0;
  let effects = [];
  const memo = (factory, deps) => {
    const slot = index++;
    if (!slots[slot] || deps.some((value, i) => !Object.is(value, slots[slot].deps[i]))) {
      slots[slot] = { value: factory(), deps };
    }
    return slots[slot].value;
  };
  return {
    react: {
      useMemo: memo,
      useCallback: (fn, deps) => memo(() => fn, deps),
      useState: (init) => [memo(() => typeof init === "function" ? init() : init, []), () => {}],
      useSyncExternalStore: (_, get) => get(),
      useEffect: (effect, deps) => {
        const slot = index++;
        if (!slots[slot] || deps.some((value, i) => !Object.is(value, slots[slot].deps[i]))) {
          effects.push(() => {
            slots[slot]?.cleanup?.();
            slots[slot] = { deps, cleanup: effect() };
          });
        }
      },
    },
    render(fn) {
      index = 0;
      const result = fn();
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
      return result;
    },
    unmount() {
      slots.forEach((slot) => slot.cleanup?.());
    },
  };
}

function tokenHarness() {
  return loadModule("../lib/api/token-store.ts", {});
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

function streamHarness(refresh, fetchStream) {
  const store = tokenHarness();
  store.setAuth("expired", { id: 1 });
  const hooks = hooksHarness();
  const timers = new Map();
  let timerId = 0;
  let invalidations = 0;
  const queryClient = { invalidateQueries: async () => { invalidations++; } };
  const { useChatStream } = loadModule("../lib/api/chat-stream.ts", {
    react: hooks.react,
    "@tanstack/react-query": { useQueryClient: () => queryClient },
    "./token-store": store,
    "./auth": { useAuth: () => ({ user: store.getCurrentUser(), isAuthenticated: true, isHydrated: true }) },
    "./chats": { CHATS_KEY: "/api/v1/chats" },
    "./mutator": { API_BASE_URL: "", refreshAuthSession: () => refresh(store) },
  }, {
    fetch: fetchStream,
    AbortController,
    TextDecoderStream,
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => timers.delete(id),
    document: { visibilityState: "visible", addEventListener() {}, removeEventListener() {} },
    window: { addEventListener() {}, removeEventListener() {} },
  });
  return {
    store,
    timers,
    invalidations: () => invalidations,
    render: () => hooks.render(useChatStream),
    stop: () => hooks.unmount(),
    retry() {
      const [id, fn] = timers.entries().next().value;
      timers.delete(id);
      fn();
    },
  };
}

test("SSE retries after temporary refresh failure", async () => {
  let requests = 0;
  const h = streamHarness(async () => null, async () => {
    requests++;
    return { status: 401 };
  });
  h.render();
  await flush();
  assert.equal(h.timers.size, 1);
  h.retry();
  await flush();
  assert.equal(requests, 2);
  h.stop();
});

test("a new session gets an empty query client even for identical query keys", () => {
  const store = tokenHarness();
  store.setAuth("a", { id: 1 });
  const hooks = hooksHarness();
  const { QueryProvider } = loadModule("../components/providers/query-provider.tsx", {
    react: hooks.react,
    "react/jsx-runtime": { jsx: (type, props, key) => ({ type, props, key }) },
    "@tanstack/react-query": { QueryClient, QueryClientProvider },
    axios: { isAxiosError: () => false },
    "@/lib/api/token-store": store,
  });
  const render = () => hooks.render(() => QueryProvider({ children: null }));
  const first = render();
  const client = first.props.client;
  client.setQueryData(["/api/v1/chats", "unread"], { private: "A" });
  store.setAuth("b", { id: 2 });
  const second = render();
  assert.notEqual(second.props.client, client);
  assert.equal(second.props.client.getQueryData(["/api/v1/chats", "unread"]), undefined);
  store.setAuth("b-refreshed", { id: 2 });
  assert.equal(render().props.client, second.props.client);
  hooks.unmount();
});

test("guest lists sync again after logout and login without duplicating concurrent hooks", async () => {
  const store = tokenHarness();
  store.setAuth("a", { id: 1 });
  const hooks = hooksHarness();
  let local = [{ id: 1 }];
  const batches = [];
  const { useRemoteBackedList } = loadModule("../lib/remote-backed-list.ts", {
    react: hooks.react,
    "@/lib/api/token-store": store,
  });
  const options = {
    listKey: "favorites", enabled: true, user: { id: 1 }, local,
    getLocal: () => local,
    removeLocal: (id) => { local = local.filter((item) => item.id !== id); },
    clearLocal: () => { local = []; },
    fromRemote: (item) => item,
    sync: async (items) => { batches.push(items.map((item) => item.id)); },
    invalidate: async () => {}, removeRemote: async () => {}, clearRemote: async () => {},
  };
  const render = () => hooks.render(() => {
    useRemoteBackedList(options);
    useRemoteBackedList(options);
  });
  render();
  await flush();
  assert.equal(batches.length, 1);
  store.clearAuth();
  options.enabled = false;
  options.user = null;
  render();
  local = [{ id: 2 }];
  store.setAuth("a-again", { id: 1 });
  options.enabled = true;
  options.user = { id: 1 };
  render();
  await flush();
  assert.deepEqual(batches.map((items) => [...items]), [[1], [2]]);
  hooks.unmount();
});

test("remote favorite add is not blocked by a full guest list", async () => {
  const store = tokenHarness();
  store.setAuth("a", { id: 1 });
  let requests = 0;
  const hooks = hooksHarness();
  const local = Array.from({ length: 200 }, (_, id) => ({ id }));
  const { useFavorites } = loadModule("../lib/favorites/use-favorites.ts", {
    react: hooks.react,
    "@tanstack/react-query": {
      useQuery: () => ({ data: { data: [] }, isPending: false }),
      useQueryClient: () => ({ invalidateQueries: async () => {} }),
    },
    "@/lib/api/auth": { useAuth: () => ({ user: { id: 1 }, isAuthenticated: true, isHydrated: true }) },
    "@/lib/api/token-store": store,
    "@/lib/api/generated/endpoints/me-favorites/me-favorites": {
      getFavoritesControllerFindMineQueryKey: () => ["favorites"],
      useFavoritesControllerAdd: () => ({ mutateAsync: async () => { requests++; } }),
      useFavoritesControllerClear: () => ({ mutateAsync: async () => {} }),
      useFavoritesControllerRemove: () => ({ mutateAsync: async () => {} }),
      useFavoritesControllerSync: () => ({ mutateAsync: async () => {} }),
    },
    "@/lib/remote-backed-list": { useRemoteBackedList: () => ({ items: [], isRemote: true }) },
    "./fetch-favorites": { fetchAllFavorites: async () => ({ data: [] }) },
    "./local-favorites": {
      addLocalFavorite: () => false,
      getLocalFavorites: () => local,
      getEmptyFavorites: () => [],
      subscribeLocalFavorites: () => () => {},
      MAX_LOCAL_FAVORITES: 200,
    },
  });
  const favorites = hooks.render(useFavorites);
  assert.equal(await favorites.add({ id: 201 }), true);
  assert.equal(requests, 1);
  assert.equal(favorites.has(1), false);
});
