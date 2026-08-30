"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { hit, METRIKA_ID } from "@/lib/metrika";

/**
 * Сниппет счётчика — ровно тот, что выдала Метрика для этого счётчика.
 *
 * Заглушку ym он ставит синхронно, а tag.js тянет асинхронно, поэтому вызовы
 * reachGoal до загрузки не теряются, а копятся. Повторную вставку тега
 * отсекает проверка document.scripts внутри сниппета.
 *
 * Разбор параметров init:
 * - ssr + явные url/referrer — страница отрисована на сервере, и счётчику
 *   нужно взять адрес и источник из переданных значений, а не угадывать;
 * - ecommerce включает приём событий из window.dataLayer (сам массив ниже);
 * - defer здесь намеренно НЕТ: без него init сам считает первый просмотр,
 *   а Pageviews досылает только последующие переходы. С defer:true первый
 *   просмотр не отправил бы никто.
 *
 * id подставляется в инлайновый скрипт, поэтому в lib/metrika.ts он
 * пропущен через проверку «только цифры».
 */
function snippet(id: string): string {
  return `window.dataLayer=window.dataLayer||[];
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j=0;j<e.scripts.length;j++){if(e.scripts[j].src===r){return;}}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,"script","https://mc.yandex.ru/metrika/tag.js?id=${id}","ym");
ym(${id},"init",{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`;
}

/**
 * Досылка просмотров при клиентской навигации.
 *
 * Без этого Метрика видит ровно одну страницу за визит: `ym init` считает
 * только первую загрузку, а дальше Next.js меняет маршрут без перезагрузки
 * документа, и счётчик об этом не узнаёт.
 */
function Pageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Хранит последний отправленный адрес. null на старте — первый проход
  // пропускаем: этот просмотр уже посчитал init, второй hit удвоил бы его.
  const lastUrl = useRef<string | null>(null);

  const query = searchParams.toString();
  const url = query ? `${pathname}?${query}` : pathname;

  useEffect(() => {
    if (lastUrl.current === null) {
      lastUrl.current = url;
      return;
    }
    // Тот же адрес — не просмотр: replace на месте (дебаунс поиска) и
    // двойное монтирование эффектов в dev не должны накручивать статистику.
    if (lastUrl.current === url) return;

    const referer = lastUrl.current;
    lastUrl.current = url;
    hit(url, referer);
  }, [url]);

  return null;
}

/**
 * Тег Метрики и трекинг переходов. Номер по умолчанию зашит в lib/metrika.ts,
 * так что счётчик работает без настройки; ничего не рендерит только когда его
 * выключили явно — NEXT_PUBLIC_YANDEX_METRIKA_ID=0.
 */
export function Metrika() {
  const id = METRIKA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        id="yandex-metrika"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: snippet(id) }}
      />
      {/* Граница только вокруг Pageviews: внутри useSearchParams, и без неё
          статический рендер всей страницы уехал бы в динамический. Тег при
          этом остаётся снаружи — иначе он вместе с Pageviews выпадал бы из
          серверной разметки и не искался бы в исходнике страницы. */}
      <Suspense fallback={null}>
        <Pageviews />
      </Suspense>
      <noscript>
        <div>
          {/* Пиксель для посетителей без JS — next/image здесь неприменим:
              внутри noscript нужен обычный тег без рантайма. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
