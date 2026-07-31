import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Media-query — внешний источник состояния, поэтому читаем его через
 * useSyncExternalStore, а не через useEffect + setState: тот вызывал лишний
 * каскад рендеров и запрещён правилом react-hooks/set-state-in-effect.
 */
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    // На сервере ширины нет — считаем десктопом, как и раньше при isMobile === undefined.
    () => false,
  )
}
