/**
 * Address / city suggestions, constrained to Tashkent (Uzbekistan).
 *
 * The marketplace is Tashkent-based, so every lookup is biased — and, where the
 * provider supports it, hard-limited — to the city's bounding box. No results
 * are hardcoded: they come live from the geocoder.
 *
 * Provider is pluggable:
 *  - If `NEXT_PUBLIC_YANDEX_SUGGEST_KEY` is set → Yandex Geosuggest API (preferred).
 *  - Otherwise → keyless OpenStreetMap (Photon), so it works out of the box.
 *
 * To use Yandex, add to `.env.local`:
 *   NEXT_PUBLIC_YANDEX_SUGGEST_KEY=your_key
 * (get one at https://developer.tech.yandex.ru/, "JavaScript API и Геосаджест").
 */

export interface PlaceSuggestion {
  /** Text shown in the dropdown. */
  label: string;
  /** Value written into the field when picked. */
  value: string;
}

export type SuggestKind = "city" | "address";

/** Base city for the whole marketplace. */
export const BASE_CITY = "Ташкент";

/**
 * Tashkent geo bounds.
 *  - `center` / `span` — [lon, lat] window used by Yandex (`ll` + `spn`).
 *  - `bbox` — [minLon, minLat, maxLon, maxLat] used by Photon.
 */
const TASHKENT = {
  center: [69.2401, 41.2995] as const,
  span: [0.36, 0.26] as const,
  bbox: [69.11, 41.16, 69.42, 41.38] as const,
};

const YANDEX_KEY = process.env.NEXT_PUBLIC_YANDEX_SUGGEST_KEY;

export async function suggestPlaces(
  query: string,
  opts: { kind: SuggestKind; city?: string; signal?: AbortSignal },
): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  // Bias address lookups by the base city so streets/houses resolve locally.
  const city = opts.city || BASE_CITY;
  const text = opts.kind === "address" ? `${city}, ${q}` : q;
  try {
    return YANDEX_KEY
      ? await suggestYandex(text, opts)
      : await suggestPhoton(text, opts);
  } catch {
    return [];
  }
}

async function suggestYandex(
  text: string,
  opts: { kind: SuggestKind; signal?: AbortSignal },
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    apikey: YANDEX_KEY!,
    text,
    lang: "ru_RU",
    results: "6",
    types: opts.kind === "city" ? "locality" : "street,house",
    // Restrict suggestions to the Tashkent window.
    ll: TASHKENT.center.join(","),
    spn: TASHKENT.span.join(","),
    strict_bounds: "1",
  });
  const res = await fetch(`https://suggest-maps.yandex.ru/v1/suggest?${params}`, {
    signal: opts.signal,
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results?: { title?: { text?: string }; subtitle?: { text?: string } }[];
  };
  return dedupe(
    (data.results ?? []).map((r) => {
      const title = r.title?.text ?? "";
      const subtitle = r.subtitle?.text ?? "";
      return { label: subtitle ? `${title} — ${subtitle}` : title, value: title };
    }),
  );
}

interface PhotonProps {
  name?: string;
  street?: string;
  housenumber?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
}

async function suggestPhoton(
  text: string,
  opts: { kind: SuggestKind; signal?: AbortSignal },
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: text,
    limit: "6",
    lang: "ru",
    // Bias toward Tashkent centre and clip to its bounding box.
    lat: String(TASHKENT.center[1]),
    lon: String(TASHKENT.center[0]),
    bbox: TASHKENT.bbox.join(","),
  });
  if (opts.kind === "city") params.set("layer", "city");
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    signal: opts.signal,
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: { properties: PhotonProps }[] };
  return dedupe(
    (data.features ?? []).map((f) => photonSuggestion(f.properties, opts.kind)),
  );
}

function photonSuggestion(p: PhotonProps, kind: SuggestKind): PlaceSuggestion {
  if (kind === "city") {
    const name = p.name ?? "";
    return { label: [name, p.state, p.country].filter(Boolean).join(", "), value: name };
  }
  const primary = [p.street ?? p.name, p.housenumber].filter(Boolean).join(", ");
  const context = [p.district, p.city].filter(Boolean).join(", ");
  return {
    label: context && context !== primary ? `${primary} — ${context}` : primary,
    value: primary,
  };
}

function dedupe(items: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    if (!s.value || seen.has(s.value)) return false;
    seen.add(s.value);
    return true;
  });
}
