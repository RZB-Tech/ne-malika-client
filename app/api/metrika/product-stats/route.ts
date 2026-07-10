import { NextResponse, type NextRequest } from "next/server";
import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { contactPath } from "@/lib/metrika";

/**
 * Просмотры карточки товара из Яндекс.Метрики.
 *
 * Живёт на сервере Next, а не в браузере: OAuth-токен Метрики даёт доступ ко
 * всем счётчикам аккаунта, отдавать его клиенту нельзя. Клиент шлёт свой
 * Bearer от NestJS — по нему же и проверяется, что товар принадлежит
 * запрашивающему продавцу.
 */

const METRIKA_API = "https://api-metrika.yandex.net/stat/v1/data";
// Хвостовой слэш в переменной окружения превращает путь в `//api/v1/...`, а Nest на такое отвечает 404.
const NEST_API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/+$/, "");

/**
 * Метрика обрабатывает хиты не мгновенно; 5 минут кэша хватает и бережёт квоту.
 * В деве кэш выключен: иначе после клика по кнопке роут ещё пять минут отдаёт
 * ответ, сформированный до него, и проверить изменения невозможно.
 */
const CACHE_SECONDS = process.env.NODE_ENV === "development" ? 0 : 300;

/** Клики и уникальные люди за 30 дней. */
export interface ContactCount {
  clicks: number;
  users: number;
}

export interface ProductStats {
  /** Просмотры карточки за 30 дней. */
  pageviews30d: number;
  /** Просмотры за последние 7 дней. */
  pageviews7d: number;
  /** Уникальные посетители за 30 дней. Не равны сумме по дням — считаются Метрикой. */
  users30d: number;
  /** Просмотры по дням за 30 дней, от старого к новому — для спарклайна. */
  daily: { date: string; pageviews: number }[];
  /**
   * Раскрытия телефона и переходы в Telegram за 30 дней.
   *
   * Считаются как просмотры служебных адресов `/product/{id}/contact/{kind}` —
   * см. `contactPath`. Не через цели: цель — метрика визита, и Метрика засчитала
   * бы клик на одной карточке всем карточкам, открытым в том же визите.
   */
  contacts: Record<"phone" | "telegram", ContactCount>;
}

export async function GET(req: NextRequest) {
  const token = process.env.YANDEX_METRIKA_TOKEN;
  const counterId = process.env.YANDEX_METRIKA_COUNTER_ID;
  if (!token || !counterId) {
    return NextResponse.json(
      { error: "Метрика не настроена: нет YANDEX_METRIKA_TOKEN или COUNTER_ID" },
      { status: 501 },
    );
  }

  const productId = positiveInt(req.nextUrl.searchParams.get("productId"));
  const shopId = positiveInt(req.nextUrl.searchParams.get("shopId"));
  if (productId === null || shopId === null) {
    return NextResponse.json({ error: "productId и shopId обязательны" }, { status: 400 });
  }

  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  debug("[metrika] запрос: товар", productId, "магазин", shopId);

  const owns = await sellerOwnsProduct(authorization, shopId, productId);
  if (!owns) {
    debug("[metrika] 403 — товар не принадлежит магазину продавца");
    return NextResponse.json({ error: "Нет доступа к этому товару" }, { status: 403 });
  }

  try {
    const [totals, daily, contacts] = await Promise.all([
      // Уники нельзя складывать по дням, поэтому за totals — отдельный запрос без разбивки.
      metrika(token, {
        ids: counterId,
        metrics: "ym:pv:pageviews,ym:pv:users",
        filters: pathFilter(productId),
        date1: "30daysAgo",
        date2: "today",
      }),
      metrika(token, {
        ids: counterId,
        metrics: "ym:pv:pageviews",
        dimensions: "ym:pv:date",
        filters: pathFilter(productId),
        date1: "30daysAgo",
        date2: "today",
        sort: "ym:pv:date",
        limit: "31",
      }),
      contactCounts(token, counterId, productId),
    ]);

    const [pageviews30d = 0, users30d = 0] = totals.totals ?? [];

    const days = (daily.data ?? []).map((row) => ({
      date: String(row.dimensions[0]?.name ?? ""),
      pageviews: row.metrics[0] ?? 0,
    }));

    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const pageviews7d = days
      .filter((d) => d.date >= sevenDaysAgo)
      .reduce((sum, d) => sum + d.pageviews, 0);

    const stats: ProductStats = {
      pageviews30d,
      users30d,
      pageviews7d,
      daily: days,
      contacts,
    };

    debug("[metrika] итог", { pageviews30d, pageviews7d, users30d, contacts });

    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Метрика недоступна";
    debug("[metrika] 502 —", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * Раскрытия телефона и переходы в Telegram — просмотры служебных адресов.
 *
 * Один запрос на оба: группировка по пути возвращает строку на каждый адрес,
 * по которому был хоть один хит. Адреса без хитов Метрика не вернёт вовсе,
 * поэтому начинаем с нулей и переписываем найденным.
 */
async function contactCounts(
  token: string,
  counterId: string,
  productId: number,
): Promise<ProductStats["contacts"]> {
  const paths: Record<string, "phone" | "telegram"> = {
    [contactPath(productId, "phone")]: "phone",
    [contactPath(productId, "telegram")]: "telegram",
  };

  const data = await metrika(token, {
    ids: counterId,
    metrics: "ym:pv:pageviews,ym:pv:users",
    dimensions: "ym:pv:URLPath",
    filters: Object.keys(paths).map(exactPath).join(" OR "),
    date1: "30daysAgo",
    date2: "today",
    limit: "2",
  });

  const contacts: ProductStats["contacts"] = {
    phone: { clicks: 0, users: 0 },
    telegram: { clicks: 0, users: 0 },
  };

  for (const row of data.data ?? []) {
    const kind = paths[String(row.dimensions[0]?.name ?? "")];
    if (!kind) continue;
    contacts[kind] = { clicks: row.metrics[0] ?? 0, users: row.metrics[1] ?? 0 };
  }

  return contacts;
}

/** Пустой параметр даёт Number(null) === 0, поэтому проверяем и присутствие, и знак. */
function positiveInt(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Товар виден продавцу, только если он есть в списке карточек его магазина. */
async function sellerOwnsProduct(
  authorization: string,
  shopId: number,
  productId: number,
): Promise<boolean> {
  const res = await fetch(
    `${NEST_API}/api/v1/seller/shops/${shopId}/product-cards`,
    { headers: { authorization }, cache: "no-store" },
  );
  if (!res.ok) return false;
  const cards: unknown = await res.json();
  if (!Array.isArray(cards)) return false;
  return cards.some((c) => (c as { id?: number }).id === productId);
}

/** Сравниваем путь точно: иначе /product/1 поймает и /product/12, и /product/1/contact/phone. */
function exactPath(path: string): string {
  return `ym:pv:URLPath=='${path}'`;
}

/** Просмотры самой карточки товара. */
function pathFilter(productId: number): string {
  return exactPath(`/product/${productId}`);
}

interface MetrikaResponse {
  data: { dimensions: { name?: string }[]; metrics: number[] }[];
  totals: number[];
}

/** Только в деве: в проде это спамило бы логи и светило параметры запросов. */
const DEBUG = process.env.NODE_ENV === "development";

/**
 * Пишем и в stdout, и в файл. Обычный `console.log` роута уходит в терминал
 * дев-сервера, а его не всегда видно — например, когда сервер запущен в другом
 * окне. Файл лежит в `.next/`, он уже в .gitignore.
 */
function debug(...parts: unknown[]): void {
  if (!DEBUG) return;

  const line = parts
    .map((p) => (typeof p === "string" ? p : JSON.stringify(p)))
    .join(" ");

  console.log(line);
  void appendFile(
    resolve(process.cwd(), ".next/metrika-debug.log"),
    `${new Date().toISOString()} ${line}\n`,
  ).catch(() => {}); // отладка не повод ронять запрос
}

async function metrika(
  token: string,
  params: Record<string, string>,
): Promise<MetrikaResponse> {
  const url = `${METRIKA_API}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: { Authorization: `OAuth ${token}` },
    ...(CACHE_SECONDS > 0
      ? { next: { revalidate: CACHE_SECONDS } }
      : { cache: "no-store" as const }),
  });

  // Тело читаем один раз и текстом: на ошибке там может лежать не JSON,
  // а `res.json()` в этом случае бросит, спрятав настоящую причину.
  const raw = await res.text();

  debug("[metrika] →", params.metrics, "|", params.filters ?? "без фильтра");
  debug("[metrika] ←", String(res.status), raw);

  if (!res.ok) {
    throw new Error(`Метрика ответила ${res.status}: ${raw.slice(0, 200)}`);
  }

  return JSON.parse(raw) as MetrikaResponse;
}
