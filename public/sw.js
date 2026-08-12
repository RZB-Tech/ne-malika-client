/**
 * Service worker для push-уведомлений.
 *
 * Лежит в public/, поэтому отдаётся как /sw.js — область действия получается
 * весь сайт. Внутри намеренно ничего лишнего: воркер живёт дольше вкладки, и
 * любая логика здесь переживает деплой до момента, пока браузер не заметит
 * новый файл.
 */

self.addEventListener("install", () => {
  // Не ждём закрытия старых вкладок: уведомления должны заработать сразу
  // после того, как человек нажал «Включить».
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    // Сервер всегда шлёт JSON, но чужой push тоже может прийти на этот
    // endpoint — показываем текстом, а не роняем воркер.
    payload = { title: "НеМалика", body: event.data.text() };
  }

  const title = payload.title || "НеМалика";

  // Метку задаёт сервер: у переписки она своя («chat-12»), у рассылки общая.
  // Раньше тег был один на всё, и каждое следующее уведомление молча
  // затирало предыдущее — со стороны это выглядело так, будто уведомления
  // приходят только на первое сообщение.
  //
  // renotify обязателен вместе с тегом: без него замена происходит беззвучно,
  // и новое сообщение в открытом разговоре осталось бы незамеченным.
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: payload.tag || "nemalika-broadcast",
      renotify: true,
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Уже открытую вкладку переиспользуем, а не плодим новые.
        for (const client of clients) {
          if (client.url === target && "focus" in client) return client.focus();
        }
        return self.clients.openWindow(target);
      }),
  );
});
