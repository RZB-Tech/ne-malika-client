import type { Locale } from "./i18n/config";
import type { WorkScheduleEntry } from "./api/types";

export type Availability = "in_stock" | "out_of_stock" | "on_order";
export type ModerationStatus = "draft" | "moderation" | "published" | "rejected";
export type SellerStatus = "active" | "pending" | "blocked";

export interface Category {
  slug: string;
  name: Record<Locale, string>;
  icon: string; // lucide icon name
  subcategories: { slug: string; name: Record<Locale, string> }[];
}

export interface Store {
  id: string;
  slug: string;
  /** id владельца — известен только у магазинов с бэкенда. */
  ownerId?: number;
  name: string;
  logoHue: number;
  description: string;
  address: string;
  city: string;
  phone: string;
  telegram: string;
  /** Уже собранная строка расписания — для витрин, где сырых данных нет. */
  workingHours: string;
  /** Сырое расписание с бэкенда: подписи дней зависят от языка. */
  workSchedule?: WorkScheduleEntry[];
  rating: number;
  ratingCount: number;
  joined: string; // ISO
  status: SellerStatus;
  storeViews: number;
  // Populated when the store comes from the backend.
  telegramLink?: string;
  photoUrl?: string | null;
  location?: number[] | null;
}

export interface Spec {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  subcategory: string;
  brand: string;
  model: string;
  sku: string;
  /** null — «цена договорная». */
  price: number | null;
  oldPrice?: number;
  description: string;
  specs: Spec[];
  warrantyMonths: number;
  /** Средняя оценка по опубликованным отзывам; 0 — отзывов ещё нет. */
  rating?: number;
  ratingCount?: number;
  availability: Availability;
  quantity: number;
  storeId: string;
  hue: number;
  views: number;
  telegramClicks: number;
  createdAt: string; // ISO
  isNew?: boolean;
  isPromo?: boolean;
  moderation: ModerationStatus;
  hidden?: boolean;
  // Populated when the product comes from the backend (real S3 photos).
  imageUrl?: string | null;
  photoUrls?: string[];
  /** Сырые ключи S3. Личные списки хранят их, а не собранные URL. */
  photoKeys?: string[];
  abolishReason?: string | null;
}

export const categories: Category[] = [
  { slug: "computers", icon: "PcCase", name: { ru: "Компьютеры", "uz-Latn": "Kompyuterlar", "uz-Cyrl": "Компьютерлар" }, subcategories: [
    { slug: "gaming-pc", name: { ru: "Игровые ПК", "uz-Latn": "O‘yin kompyuterlari", "uz-Cyrl": "Ўйин компьютерлари" } },
    { slug: "office-pc", name: { ru: "Офисные ПК", "uz-Latn": "Ofis kompyuterlari", "uz-Cyrl": "Офис компьютерлари" } },
    { slug: "workstations", name: { ru: "Рабочие станции", "uz-Latn": "Ishchi stansiyalar", "uz-Cyrl": "Ишчи станциялар" } },
  ] },
  { slug: "laptops", icon: "Laptop", name: { ru: "Ноутбуки", "uz-Latn": "Noutbuklar", "uz-Cyrl": "Ноутбуклар" }, subcategories: [
    { slug: "gaming", name: { ru: "Игровые", "uz-Latn": "O‘yin uchun", "uz-Cyrl": "Ўйин учун" } },
    { slug: "ultrabooks", name: { ru: "Ультрабуки", "uz-Latn": "Ultrabuklar", "uz-Cyrl": "Ультрабуклар" } },
    { slug: "business", name: { ru: "Для работы", "uz-Latn": "Ish uchun", "uz-Cyrl": "Иш учун" } },
  ] },
  { slug: "monitors", icon: "Monitor", name: { ru: "Мониторы", "uz-Latn": "Monitorlar", "uz-Cyrl": "Мониторлар" }, subcategories: [
    { slug: "gaming", name: { ru: "Игровые", "uz-Latn": "O‘yin uchun", "uz-Cyrl": "Ўйин учун" } },
    { slug: "office", name: { ru: "Офисные", "uz-Latn": "Ofis uchun", "uz-Cyrl": "Офис учун" } },
    { slug: "pro", name: { ru: "Для дизайна", "uz-Latn": "Dizayn uchun", "uz-Cyrl": "Дизайн учун" } },
  ] },
  { slug: "videocards", icon: "CircuitBoard", name: { ru: "Видеокарты", "uz-Latn": "Videokartalar", "uz-Cyrl": "Видеокарталар" }, subcategories: [
    { slug: "nvidia", name: { ru: "NVIDIA GeForce", "uz-Latn": "NVIDIA GeForce", "uz-Cyrl": "NVIDIA GeForce" } },
    { slug: "amd", name: { ru: "AMD Radeon", "uz-Latn": "AMD Radeon", "uz-Cyrl": "AMD Radeon" } },
  ] },
  { slug: "cpu", icon: "Cpu", name: { ru: "Процессоры", "uz-Latn": "Protsessorlar", "uz-Cyrl": "Процессорлар" }, subcategories: [
    { slug: "intel", name: { ru: "Intel", "uz-Latn": "Intel", "uz-Cyrl": "Intel" } },
    { slug: "amd", name: { ru: "AMD", "uz-Latn": "AMD", "uz-Cyrl": "AMD" } },
  ] },
  { slug: "motherboards", icon: "Server", name: { ru: "Материнские платы", "uz-Latn": "Ona platalar", "uz-Cyrl": "Она платалар" }, subcategories: [
    { slug: "intel", name: { ru: "Под Intel", "uz-Latn": "Intel uchun", "uz-Cyrl": "Intel учун" } },
    { slug: "amd", name: { ru: "Под AMD", "uz-Latn": "AMD uchun", "uz-Cyrl": "AMD учун" } },
  ] },
  { slug: "ram", icon: "MemoryStick", name: { ru: "Оперативная память", "uz-Latn": "Operativ xotira (RAM)", "uz-Cyrl": "Оператив хотира (RAM)" }, subcategories: [
    { slug: "ddr4", name: { ru: "DDR4", "uz-Latn": "DDR4", "uz-Cyrl": "DDR4" } },
    { slug: "ddr5", name: { ru: "DDR5", "uz-Latn": "DDR5", "uz-Cyrl": "DDR5" } },
  ] },
  { slug: "ssd", icon: "HardDrive", name: { ru: "SSD", "uz-Latn": "SSD", "uz-Cyrl": "SSD" }, subcategories: [
    { slug: "nvme", name: { ru: "M.2 NVMe", "uz-Latn": "M.2 NVMe", "uz-Cyrl": "M.2 NVMe" } },
    { slug: "sata", name: { ru: "SATA", "uz-Latn": "SATA", "uz-Cyrl": "SATA" } },
  ] },
  { slug: "hdd", icon: "Database", name: { ru: "HDD", "uz-Latn": "HDD", "uz-Cyrl": "HDD" }, subcategories: [
    { slug: "desktop", name: { ru: "Для ПК", "uz-Latn": "Kompyuter uchun", "uz-Cyrl": "Компьютер учун" } },
    { slug: "nas", name: { ru: "Для NAS", "uz-Latn": "NAS uchun", "uz-Cyrl": "NAS учун" } },
  ] },
  { slug: "psu", icon: "Power", name: { ru: "Блоки питания", "uz-Latn": "Quvvat bloklari", "uz-Cyrl": "Қувват блоклари" }, subcategories: [
    { slug: "atx", name: { ru: "ATX", "uz-Latn": "ATX", "uz-Cyrl": "ATX" } },
    { slug: "sfx", name: { ru: "SFX", "uz-Latn": "SFX", "uz-Cyrl": "SFX" } },
  ] },
  { slug: "cases", icon: "Box", name: { ru: "Корпуса", "uz-Latn": "Korpuslar", "uz-Cyrl": "Корпуслар" }, subcategories: [
    { slug: "midtower", name: { ru: "Mid-Tower", "uz-Latn": "Mid-Tower", "uz-Cyrl": "Mid-Tower" } },
    { slug: "mini", name: { ru: "Mini-ITX", "uz-Latn": "Mini-ITX", "uz-Cyrl": "Mini-ITX" } },
  ] },
  { slug: "keyboards", icon: "Keyboard", name: { ru: "Клавиатуры", "uz-Latn": "Klaviaturalar", "uz-Cyrl": "Клавиатуралар" }, subcategories: [
    { slug: "mechanical", name: { ru: "Механические", "uz-Latn": "Mexanik", "uz-Cyrl": "Механик" } },
    { slug: "membrane", name: { ru: "Мембранные", "uz-Latn": "Membranali", "uz-Cyrl": "Мембранали" } },
  ] },
  { slug: "mice", icon: "Mouse", name: { ru: "Мышки", "uz-Latn": "Sichqonchalar", "uz-Cyrl": "Сичқончалар" }, subcategories: [
    { slug: "gaming", name: { ru: "Игровые", "uz-Latn": "O‘yin uchun", "uz-Cyrl": "Ўйин учун" } },
    { slug: "office", name: { ru: "Офисные", "uz-Latn": "Ofis uchun", "uz-Cyrl": "Офис учун" } },
  ] },
  { slug: "headphones", icon: "Headphones", name: { ru: "Наушники", "uz-Latn": "Quloqchinlar", "uz-Cyrl": "Қулоқчинлар" }, subcategories: [
    { slug: "gaming", name: { ru: "Игровые", "uz-Latn": "O‘yin uchun", "uz-Cyrl": "Ўйин учун" } },
    { slug: "wireless", name: { ru: "Беспроводные", "uz-Latn": "Simsiz", "uz-Cyrl": "Симсиз" } },
  ] },
  { slug: "webcams", icon: "Webcam", name: { ru: "Веб-камеры", "uz-Latn": "Veb-kameralar", "uz-Cyrl": "Веб-камералар" }, subcategories: [
    { slug: "fullhd", name: { ru: "Full HD", "uz-Latn": "Full HD", "uz-Cyrl": "Full HD" } },
    { slug: "4k", name: { ru: "4K", "uz-Latn": "4K", "uz-Cyrl": "4K" } },
  ] },
  { slug: "printers", icon: "Printer", name: { ru: "Принтеры", "uz-Latn": "Printerlar", "uz-Cyrl": "Принтерлар" }, subcategories: [
    { slug: "laser", name: { ru: "Лазерные", "uz-Latn": "Lazerli", "uz-Cyrl": "Лазерли" } },
    { slug: "inkjet", name: { ru: "Струйные", "uz-Latn": "Siyohli", "uz-Cyrl": "Сиёҳли" } },
  ] },
  { slug: "network", icon: "Wifi", name: { ru: "Сетевое оборудование", "uz-Latn": "Tarmoq uskunalari", "uz-Cyrl": "Тармоқ ускуналари" }, subcategories: [
    { slug: "routers", name: { ru: "Роутеры", "uz-Latn": "Routerlar", "uz-Cyrl": "Роутерлар" } },
    { slug: "switches", name: { ru: "Коммутаторы", "uz-Latn": "Kommutatorlar", "uz-Cyrl": "Коммутаторлар" } },
  ] },
  { slug: "gaming", icon: "Gamepad2", name: { ru: "Игровые аксессуары", "uz-Latn": "O‘yin aksessuarlari", "uz-Cyrl": "Ўйин аксессуарлари" }, subcategories: [
    { slug: "gamepads", name: { ru: "Геймпады", "uz-Latn": "Geympadlar", "uz-Cyrl": "Геймпадлар" } },
    { slug: "chairs", name: { ru: "Кресла", "uz-Latn": "Kreslolar", "uz-Cyrl": "Креслолар" } },
  ] },
  { slug: "components", icon: "Fan", name: { ru: "Комплектующие", "uz-Latn": "Butlovchi qismlar", "uz-Cyrl": "Бутловчи қисмлар" }, subcategories: [
    { slug: "cooling", name: { ru: "Охлаждение", "uz-Latn": "Sovutish", "uz-Cyrl": "Совутиш" } },
    { slug: "fans", name: { ru: "Вентиляторы", "uz-Latn": "Ventilyatorlar", "uz-Cyrl": "Вентиляторлар" } },
  ] },
  { slug: "parts", icon: "Wrench", name: { ru: "Запчасти", "uz-Latn": "Ehtiyot qismlar", "uz-Cyrl": "Эҳтиёт қисмлар" }, subcategories: [
    { slug: "cables", name: { ru: "Кабели", "uz-Latn": "Kabellar", "uz-Cyrl": "Кабеллар" } },
    { slug: "batteries", name: { ru: "Аккумуляторы", "uz-Latn": "Akkumulyatorlar", "uz-Cyrl": "Аккумуляторлар" } },
  ] },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
