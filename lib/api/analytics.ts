"use client";

import { axiosInstance } from "./mutator";

/**
 * Выгрузка аналитики магазина в CSV.
 *
 * Единственное место, где мы идём мимо сгенерированного хука, и обход
 * умышленный: `customInstance` разбирает любой ответ как JSON, а здесь нужен
 * файл — таблица приехала бы строкой, склеенной по правилам JSON, и
 * `«1 240;15;3»` в ней превратилось бы в неведомо что. Берём тот же
 * axios-инстанс, что и генератор: на нём висят токен, `Accept-Language` и
 * обновление сессии на 401 — то есть выгрузка ведёт себя как остальные запросы
 * кабинета, включая продление протухшего доступа.
 *
 * Ссылкой `<a href="…/export.csv">` то же самое сделать нельзя: браузер не
 * приложит к переходу заголовок `Authorization`, и продавец получил бы 401
 * вместо файла. Отсюда весь дальнейший обряд с blob-ссылкой.
 *
 * Ручка закрыта тарифом MAX — вызывать её имеет смысл только там, где кнопка
 * выгрузки вообще показана.
 */
export async function downloadAnalyticsCsv(days: number): Promise<void> {
  const res = await axiosInstance.get("/api/v1/seller/analytics/export.csv", {
    params: { days },
    responseType: "blob",
  });

  const url = URL.createObjectURL(res.data as Blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = `nemalika-analytics-${days}d.csv`;
    /* Firefox не нажимает ссылку, которой нет в документе. */
    document.body.append(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
