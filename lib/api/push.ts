import { axiosInstance } from "./mutator";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function permissionState(): NotificationPermission | null {
  return isPushSupported() ? Notification.permission : null;
}

export async function hasPushSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return Boolean(await reg?.pushManager.getSubscription());
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const registered = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  });
  if (registered.active) return registered;

  return navigator.serviceWorker.ready;
}

export interface PushConfig {
  enabled: boolean;
  publicKey: string | null;
}

export async function fetchPushConfig(): Promise<PushConfig> {
  const { data } = await axiosInstance.get<PushConfig>("/api/v1/push/config");
  return data;
}

export async function subscribeToPush(
  publicKey: string,
  confirmation?: { title: string; body: string },
): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const reg = await registration();
  const existing = await reg.pushManager.getSubscription();
  const subscription =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const json = subscription.toJSON();
  await axiosInstance.post("/api/v1/push/subscribe", {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
    userAgent: navigator.userAgent.slice(0, 300),
  });

  if (confirmation) {
    await reg.showNotification(confirmation.title, {
      body: confirmation.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: "nemalika-push-enabled",
      data: { url: window.location.pathname },
    });
  }

  return "granted";
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;

  const reg = await navigator.serviceWorker.getRegistration("/");
  const subscription = await reg?.pushManager.getSubscription();
  if (!subscription) return;

  const { endpoint } = subscription;
  await subscription.unsubscribe();
  await axiosInstance.delete("/api/v1/push/subscribe", { data: { endpoint } });
}
