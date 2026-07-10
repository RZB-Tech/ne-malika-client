import type { Locale } from "./i18n/config";

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
  name: string;
  logoHue: number;
  description: string;
  address: string;
  city: string;
  phone: string;
  telegram: string;
  workingHours: string;
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
  price: number;
  oldPrice?: number;
  description: string;
  specs: Spec[];
  warrantyMonths: number;
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
  abolishReason?: string | null;
}

export const cities = [
  "Ташкент",
  "Самарканд",
  "Бухара",
  "Наманган",
  "Андижан",
  "Фергана",
];

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

export const stores: Store[] = [
  { id: "s1", slug: "tehnodom", name: "TechnoDom Store", logoHue: 262, description: "Комплектующие и готовые сборки с гарантией. Работаем с 2016 года, официальная гарантия на всю продукцию.", address: "Ташкент, ул. Амира Темура 15", city: "Ташкент", phone: "+998 90 123 45 67", telegram: "technodom_uz", workingHours: "Пн–Сб 10:00–20:00", rating: 4.8, ratingCount: 342, joined: "2016-03-11", status: "active", storeViews: 18420 },
  { id: "s2", slug: "gigabyte-hub", name: "Gigabyte Hub", logoHue: 200, description: "Специализируемся на видеокартах и материнских платах. Тестируем каждое устройство перед продажей.", address: "Самарканд, ул. Регистан 24", city: "Самарканд", phone: "+998 91 234 56 78", telegram: "gigabyte_hub", workingHours: "Ежедневно 09:00–21:00", rating: 4.6, ratingCount: 208, joined: "2018-07-22", status: "active", storeViews: 12980 },
  { id: "s3", slug: "corerise", name: "CoreRise", logoHue: 150, description: "Игровые ПК на заказ и апгрейд. Бесплатная сборка при покупке комплектующих.", address: "Бухара, ул. Накшбанди 12", city: "Бухара", phone: "+998 93 345 67 89", telegram: "corerise_pc", workingHours: "Пн–Пт 11:00–19:00", rating: 4.9, ratingCount: 156, joined: "2020-01-15", status: "active", storeViews: 9310 },
  { id: "s4", slug: "pixelmart", name: "PixelMart", logoHue: 25, description: "Мониторы, периферия и всё для рабочего места. Помогаем подобрать под задачи.", address: "Наманган, ул. Уйчи 45", city: "Наманган", phone: "+998 94 456 78 90", telegram: "pixelmart_uz", workingHours: "Пн–Сб 10:00–19:00", rating: 4.5, ratingCount: 97, joined: "2019-11-03", status: "active", storeViews: 7640 },
  { id: "s5", slug: "chip-and-co", name: "Chip & Co", logoHue: 310, description: "Процессоры, память и накопители. Оптовые цены, доставка по Узбекистану.", address: "Ташкент, ул. Шота Руставели 90", city: "Ташкент", phone: "+998 95 567 89 01", telegram: "chip_and_co", workingHours: "Пн–Сб 09:30–20:00", rating: 4.7, ratingCount: 271, joined: "2017-05-30", status: "active", storeViews: 14205 },
  { id: "s6", slug: "netpro", name: "NetPro Systems", logoHue: 205, description: "Сетевое оборудование и серверные решения для бизнеса и дома.", address: "Андижан, ул. Бабура 34", city: "Андижан", phone: "+998 97 678 90 12", telegram: "netpro_systems", workingHours: "Пн–Пт 10:00–18:00", rating: 4.4, ratingCount: 64, joined: "2021-02-18", status: "active", storeViews: 4120 },
  { id: "s7", slug: "framestore", name: "FrameStore", logoHue: 340, description: "Периферия для геймеров: клавиатуры, мыши, гарнитуры, кресла.", address: "Фергана, ул. Мустакиллик 17", city: "Фергана", phone: "+998 88 789 01 23", telegram: "framestore_uz", workingHours: "Ежедневно 10:00–22:00", rating: 4.6, ratingCount: 118, joined: "2020-09-09", status: "pending", storeViews: 5330 },
  { id: "s8", slug: "quadro-tech", name: "Quadro Tech", logoHue: 95, description: "Рабочие станции, СХД и профессиональные видеокарты под задачи студий.", address: "Самарканд, ул. Гагарина 5", city: "Самарканд", phone: "+998 99 890 12 34", telegram: "quadro_tech", workingHours: "Пн–Пт 09:00–18:00", rating: 4.9, ratingCount: 41, joined: "2022-04-01", status: "active", storeViews: 3980 },
];

function daysAgo(n: number): string {
  const d = new Date("2026-07-07T12:00:00Z");
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

interface Seed {
  name: string;
  cat: string;
  sub: string;
  brand: string;
  model: string;
  price: number;
  oldPrice?: number;
  store: string;
  warranty: number;
  avail: Availability;
  specs: [string, string][];
  desc: string;
  views: number;
  clicks: number;
  age: number;
  hue: number;
  mod?: ModerationStatus;
  hidden?: boolean;
  qty?: number;
  isNew?: boolean;
  isPromo?: boolean;
}

const seeds: Seed[] = [
  { name: "Видеокарта NVIDIA GeForce RTX 4070 Ti 12GB", cat: "videocards", sub: "nvidia", brand: "NVIDIA", model: "RTX 4070 Ti", price: 419900, oldPrice: 459900, store: "s2", warranty: 36, avail: "in_stock", hue: 262, views: 3120, clicks: 742, age: 4, mod: "published",
    desc: "Флагманская видеокарта для игр в 2K и 4K. 12 ГБ GDDR6X, поддержка DLSS 3 и трассировки лучей. Три вентилятора, тихая работа под нагрузкой.",
    specs: [["Объём памяти", "12 ГБ GDDR6X"], ["Шина памяти", "192 бит"], ["Частота Boost", "2610 МГц"], ["Интерфейс", "PCIe 4.0"], ["Питание", "1× 16-pin"], ["Длина", "305 мм"]] },
  { name: "Видеокарта AMD Radeon RX 7800 XT 16GB", cat: "videocards", sub: "amd", brand: "AMD", model: "RX 7800 XT", price: 329900, store: "s2", warranty: 24, avail: "in_stock", hue: 20, views: 1980, clicks: 401, age: 9, mod: "published",
    desc: "16 ГБ памяти для комфортной игры в 2K с запасом. Отличное соотношение цены и производительности, холодная и тихая.",
    specs: [["Объём памяти", "16 ГБ GDDR6"], ["Шина памяти", "256 бит"], ["Частота Boost", "2430 МГц"], ["Интерфейс", "PCIe 4.0"], ["Питание", "2× 8-pin"], ["Длина", "267 мм"]] },
  { name: "Видеокарта NVIDIA GeForce RTX 4060 8GB", cat: "videocards", sub: "nvidia", brand: "NVIDIA", model: "RTX 4060", price: 179900, oldPrice: 199900, store: "s1", warranty: 24, avail: "in_stock", hue: 275, views: 2640, clicks: 588, age: 2, isNew: true, isPromo: true, mod: "published",
    desc: "Оптимальный выбор для Full HD-гейминга. Низкое энергопотребление, компактный размер, DLSS 3.",
    specs: [["Объём памяти", "8 ГБ GDDR6"], ["Шина памяти", "128 бит"], ["Частота Boost", "2460 МГц"], ["Интерфейс", "PCIe 4.0"], ["TDP", "115 Вт"]] },
  { name: "Процессор Intel Core i7-14700K", cat: "cpu", sub: "intel", brand: "Intel", model: "Core i7-14700K", price: 234900, store: "s5", warranty: 36, avail: "in_stock", hue: 210, views: 2210, clicks: 470, age: 6, mod: "published",
    desc: "20 ядер (8P+12E), 28 потоков. Разблокированный множитель для разгона. Идеален для игр и рабочих задач.",
    specs: [["Ядра / потоки", "20 / 28"], ["Базовая частота", "3.4 ГГц"], ["Turbo", "5.6 ГГц"], ["Сокет", "LGA1700"], ["Кэш L3", "33 МБ"], ["TDP", "125 Вт"]] },
  { name: "Процессор AMD Ryzen 7 7800X3D", cat: "cpu", sub: "amd", brand: "AMD", model: "Ryzen 7 7800X3D", price: 264900, oldPrice: 289900, store: "s5", warranty: 36, avail: "in_stock", hue: 15, views: 3480, clicks: 910, age: 3, isPromo: true, mod: "published",
    desc: "Лучший игровой процессор с технологией 3D V-Cache. 96 МБ кэша обеспечивают рекордный FPS в играх.",
    specs: [["Ядра / потоки", "8 / 16"], ["Базовая частота", "4.2 ГГц"], ["Boost", "5.0 ГГц"], ["Сокет", "AM5"], ["Кэш L3", "96 МБ"], ["TDP", "120 Вт"]] },
  { name: "Ноутбук Lenovo Legion 5 Pro 16", cat: "laptops", sub: "gaming", brand: "Lenovo", model: "Legion 5 Pro", price: 749900, oldPrice: 829900, store: "s1", warranty: 24, avail: "in_stock", hue: 262, views: 4210, clicks: 1180, age: 1, isNew: true, isPromo: true, mod: "published",
    desc: "Игровой ноутбук с экраном 16″ 165 Гц. Ryzen 7 и RTX 4070, продуманное охлаждение, металлический корпус.",
    specs: [["Процессор", "AMD Ryzen 7 7745HX"], ["Видеокарта", "RTX 4070 8GB"], ["Экран", "16″ WQXGA 165 Гц"], ["ОЗУ", "16 ГБ DDR5"], ["Накопитель", "1 ТБ NVMe"], ["Вес", "2.5 кг"]] },
  { name: "Ноутбук ASUS ZenBook 14 OLED", cat: "laptops", sub: "ultrabooks", brand: "ASUS", model: "ZenBook 14 OLED", price: 589900, store: "s4", warranty: 24, avail: "in_stock", hue: 200, views: 1670, clicks: 320, age: 8, mod: "published",
    desc: "Лёгкий ультрабук с OLED-экраном и автономностью до 12 часов. Для работы и учёбы в дороге.",
    specs: [["Процессор", "Intel Core Ultra 7"], ["Экран", "14″ OLED 2.8K"], ["ОЗУ", "16 ГБ LPDDR5"], ["Накопитель", "512 ГБ NVMe"], ["Вес", "1.28 кг"], ["Автономность", "до 12 ч"]] },
  { name: "Ноутбук Apple MacBook Air 13 M3", cat: "laptops", sub: "business", brand: "Apple", model: "MacBook Air M3", price: 699900, store: "s1", warranty: 12, avail: "on_order", hue: 240, views: 2890, clicks: 640, age: 12, mod: "published",
    desc: "Тонкий и бесшумный ноутбук на чипе M3. Отличный экран Liquid Retina и целый день работы без розетки.",
    specs: [["Чип", "Apple M3 8-core"], ["Экран", "13.6″ Liquid Retina"], ["ОЗУ", "8 ГБ"], ["Накопитель", "256 ГБ SSD"], ["Вес", "1.24 кг"]] },
  { name: "Монитор Dell UltraSharp U2723QE 27 4K", cat: "monitors", sub: "pro", brand: "Dell", model: "U2723QE", price: 289900, store: "s4", warranty: 36, avail: "in_stock", hue: 205, views: 1240, clicks: 210, age: 7, mod: "published",
    desc: "Профессиональный 27″ 4K IPS Black с точной цветопередачей 100% sRGB. USB-C хаб с зарядкой 90 Вт.",
    specs: [["Диагональ", "27″"], ["Разрешение", "3840×2160"], ["Матрица", "IPS Black"], ["Частота", "60 Гц"], ["Порты", "USB-C 90W, HDMI, DP"], ["Покрытие", "100% sRGB"]] },
  { name: "Монитор Samsung Odyssey G7 32 240Hz", cat: "monitors", sub: "gaming", brand: "Samsung", model: "Odyssey G7", price: 269900, oldPrice: 299900, store: "s4", warranty: 24, avail: "in_stock", hue: 260, views: 1980, clicks: 455, age: 5, isPromo: true, mod: "published",
    desc: "Изогнутый игровой монитор 32″ с частотой 240 Гц и откликом 1 мс. Погружение на максимум.",
    specs: [["Диагональ", "32″ изогнутый 1000R"], ["Разрешение", "2560×1440"], ["Частота", "240 Гц"], ["Отклик", "1 мс"], ["Матрица", "VA"], ["HDR", "HDR600"]] },
  { name: "Монитор LG 24MP400 24 IPS", cat: "monitors", sub: "office", brand: "LG", model: "24MP400", price: 64900, store: "s4", warranty: 24, avail: "in_stock", hue: 340, views: 890, clicks: 120, age: 14, mod: "published",
    desc: "Доступный офисный монитор с IPS-матрицей и тонкими рамками. Комфорт для глаз при долгой работе.",
    specs: [["Диагональ", "24″"], ["Разрешение", "1920×1080"], ["Матрица", "IPS"], ["Частота", "75 Гц"], ["Порты", "HDMI, VGA"]] },
  { name: "Материнская плата ASUS ROG STRIX B650-A", cat: "motherboards", sub: "amd", brand: "ASUS", model: "ROG STRIX B650-A", price: 149900, store: "s2", warranty: 36, avail: "in_stock", hue: 200, views: 940, clicks: 165, age: 10, mod: "published",
    desc: "Плата на сокете AM5 для Ryzen 7000/9000. DDR5, PCIe 5.0, мощная система питания и охлаждения VRM.",
    specs: [["Сокет", "AM5"], ["Чипсет", "B650"], ["Форм-фактор", "ATX"], ["Память", "DDR5 до 6400 МГц"], ["Слоты M.2", "3"], ["Сеть", "2.5G LAN, Wi-Fi 6"]] },
  { name: "Материнская плата MSI PRO Z790-P WIFI", cat: "motherboards", sub: "intel", brand: "MSI", model: "PRO Z790-P", price: 134900, store: "s5", warranty: 36, avail: "in_stock", hue: 15, views: 780, clicks: 130, age: 11, mod: "published",
    desc: "Надёжная плата для процессоров Intel 12/13/14-го поколений. Wi-Fi 6E, четыре слота M.2.",
    specs: [["Сокет", "LGA1700"], ["Чипсет", "Z790"], ["Форм-фактор", "ATX"], ["Память", "DDR5 до 7200 МГц"], ["Слоты M.2", "4"], ["Сеть", "2.5G, Wi-Fi 6E"]] },
  { name: "Оперативная память Kingston Fury Beast 32GB DDR5-6000", cat: "ram", sub: "ddr5", brand: "Kingston", model: "Fury Beast", price: 74900, oldPrice: 84900, store: "s5", warranty: 60, avail: "in_stock", hue: 15, views: 1420, clicks: 290, age: 3, isPromo: true, mod: "published",
    desc: "Комплект 2×16 ГБ DDR5-6000 с низкими таймингами. Профили XMP/EXPO, стильный радиатор.",
    specs: [["Объём", "32 ГБ (2×16)"], ["Тип", "DDR5"], ["Частота", "6000 МГц"], ["Тайминги", "CL36"], ["Профили", "XMP 3.0 / EXPO"]] },
  { name: "Оперативная память Corsair Vengeance 16GB DDR4-3200", cat: "ram", sub: "ddr4", brand: "Corsair", model: "Vengeance LPX", price: 34900, store: "s5", warranty: 60, avail: "in_stock", hue: 55, views: 980, clicks: 160, age: 13, mod: "published",
    desc: "Классический комплект 2×8 ГБ DDR4-3200 для игровых и рабочих сборок. Низкопрофильный радиатор.",
    specs: [["Объём", "16 ГБ (2×8)"], ["Тип", "DDR4"], ["Частота", "3200 МГц"], ["Тайминги", "CL16"], ["Профиль", "XMP 2.0"]] },
  { name: "SSD Samsung 990 PRO 2TB M.2 NVMe", cat: "ssd", sub: "nvme", brand: "Samsung", model: "990 PRO", price: 129900, store: "s5", warranty: 60, avail: "in_stock", hue: 240, views: 2180, clicks: 520, age: 4, mod: "published",
    desc: "Один из самых быстрых NVMe-накопителей PCIe 4.0. Скорость чтения до 7450 МБ/с, надёжность на годы.",
    specs: [["Объём", "2 ТБ"], ["Интерфейс", "PCIe 4.0 ×4"], ["Форм-фактор", "M.2 2280"], ["Чтение", "до 7450 МБ/с"], ["Запись", "до 6900 МБ/с"], ["TBW", "1200 ТБ"]] },
  { name: "SSD Crucial MX500 1TB SATA", cat: "ssd", sub: "sata", brand: "Crucial", model: "MX500", price: 44900, oldPrice: 52900, store: "s1", warranty: 60, avail: "in_stock", hue: 200, views: 1120, clicks: 240, age: 2, isNew: true, isPromo: true, mod: "published",
    desc: "Надёжный SATA SSD 1 ТБ для апгрейда старого ПК или ноутбука. Заметное ускорение системы.",
    specs: [["Объём", "1 ТБ"], ["Интерфейс", "SATA III"], ["Форм-фактор", "2.5″"], ["Чтение", "до 560 МБ/с"], ["Запись", "до 510 МБ/с"]] },
  { name: "Жёсткий диск Seagate IronWolf 4TB NAS", cat: "hdd", sub: "nas", brand: "Seagate", model: "IronWolf", price: 69900, store: "s6", warranty: 36, avail: "in_stock", hue: 205, views: 640, clicks: 88, age: 16, mod: "published",
    desc: "HDD для сетевых хранилищ, рассчитан на работу 24/7. Технология AgileArray для стабильности в NAS.",
    specs: [["Объём", "4 ТБ"], ["Форм-фактор", "3.5″"], ["Скорость", "5900 об/мин"], ["Кэш", "64 МБ"], ["Интерфейс", "SATA III"], ["Назначение", "NAS 24/7"]] },
  { name: "Блок питания Corsair RM850e 850W 80+ Gold", cat: "psu", sub: "atx", brand: "Corsair", model: "RM850e", price: 74900, store: "s1", warranty: 84, avail: "in_stock", hue: 55, views: 1080, clicks: 190, age: 6, mod: "published",
    desc: "Полностью модульный блок питания 850 Вт с сертификатом 80 PLUS Gold. Тихий вентилятор и разъём 12VHPWR.",
    specs: [["Мощность", "850 Вт"], ["Сертификат", "80+ Gold"], ["Модульность", "Полная"], ["Разъёмы", "12VHPWR, ATX 3.0"], ["Вентилятор", "120 мм"], ["Гарантия", "7 лет"]] },
  { name: "Корпус NZXT H5 Flow ATX", cat: "cases", sub: "midtower", brand: "NZXT", model: "H5 Flow", price: 59900, oldPrice: 66900, store: "s3", warranty: 24, avail: "in_stock", hue: 240, views: 1240, clicks: 300, age: 3, isPromo: true, mod: "published",
    desc: "Корпус Mid-Tower с отличной продувкой и закалённым стеклом. Продуманная укладка кабелей.",
    specs: [["Форм-фактор", "Mid-Tower ATX"], ["Материал", "Сталь, стекло"], ["Вентиляторы", "2 в комплекте"], ["Отсеки", "2.5″×3, 3.5″×1"], ["Макс. GPU", "365 мм"], ["Радиатор", "до 280 мм"]] },
  { name: "Клавиатура Keychron K8 Pro механическая", cat: "keyboards", sub: "mechanical", brand: "Keychron", model: "K8 Pro", price: 54900, store: "s7", warranty: 12, avail: "in_stock", hue: 340, views: 1560, clicks: 380, age: 5, mod: "published",
    desc: "Беспроводная механическая клавиатура с hot-swap переключателями и RGB. Совместима с Mac и Windows.",
    specs: [["Тип", "Механическая, hot-swap"], ["Свитчи", "Gateron Brown"], ["Подключение", "Bluetooth / USB-C"], ["Раскладка", "TKL 87 клавиш"], ["Подсветка", "RGB"]] },
  { name: "Мышь Logitech G Pro X Superlight 2", cat: "mice", sub: "gaming", brand: "Logitech", model: "G Pro X Superlight 2", price: 79900, oldPrice: 89900, store: "s7", warranty: 24, avail: "in_stock", hue: 340, views: 2340, clicks: 610, age: 2, isNew: true, isPromo: true, mod: "published",
    desc: "Сверхлёгкая беспроводная мышь 60 г для киберспорта. Сенсор HERO 2 до 32000 DPI, автономность до 95 часов.",
    specs: [["Вес", "60 г"], ["Сенсор", "HERO 2, 32000 DPI"], ["Подключение", "Lightspeed 2.4 ГГц"], ["Кнопки", "5"], ["Автономность", "до 95 ч"]] },
  { name: "Мышь Logitech M185 беспроводная", cat: "mice", sub: "office", brand: "Logitech", model: "M185", price: 6900, store: "s7", warranty: 24, avail: "in_stock", hue: 200, views: 420, clicks: 40, age: 20, mod: "published",
    desc: "Простая и надёжная офисная мышь с USB-приёмником. Работает до года от одной батарейки.",
    specs: [["Тип", "Беспроводная"], ["Подключение", "USB 2.4 ГГц"], ["Разрешение", "1000 DPI"], ["Питание", "1× AA"]] },
  { name: "Наушники HyperX Cloud III игровые", cat: "headphones", sub: "gaming", brand: "HyperX", model: "Cloud III", price: 44900, store: "s7", warranty: 24, avail: "in_stock", hue: 15, views: 1340, clicks: 290, age: 7, mod: "published",
    desc: "Игровая гарнитура с объёмным звуком и памятью формы амбушюр. Съёмный микрофон, металлический каркас.",
    specs: [["Тип", "Проводная, закрытая"], ["Драйверы", "53 мм"], ["Звук", "DTS Headphone:X"], ["Микрофон", "Съёмный, кардиоидный"], ["Подключение", "3.5 мм / USB"]] },
  { name: "Наушники Sony WH-1000XM5 беспроводные", cat: "headphones", sub: "wireless", brand: "Sony", model: "WH-1000XM5", price: 189900, store: "s1", warranty: 12, avail: "on_order", hue: 240, views: 1980, clicks: 410, age: 9, mod: "published",
    desc: "Эталон шумоподавления. Чистый звук, комфорт на весь день и до 30 часов автономности.",
    specs: [["Тип", "Накладные, беспроводные"], ["Шумоподавление", "Адаптивное ANC"], ["Автономность", "до 30 ч"], ["Кодеки", "LDAC, AAC"], ["Быстрая зарядка", "3 мин = 3 ч"]] },
  { name: "Веб-камера Logitech Brio 4K", cat: "webcams", sub: "4k", brand: "Logitech", model: "Brio 4K", price: 89900, store: "s4", warranty: 24, avail: "in_stock", hue: 200, views: 720, clicks: 130, age: 12, mod: "published",
    desc: "Веб-камера 4K с HDR и автофокусом. Отличная картинка для стримов и видеозвонков.",
    specs: [["Разрешение", "4K / 30 fps"], ["Full HD", "1080p / 60 fps"], ["HDR", "Есть"], ["Угол обзора", "90°"], ["Крепление", "Прищепка / штатив"]] },
  { name: "Принтер HP LaserJet M111w лазерный", cat: "printers", sub: "laser", brand: "HP", model: "LaserJet M111w", price: 64900, store: "s4", warranty: 12, avail: "in_stock", hue: 205, views: 540, clicks: 70, age: 15, mod: "published",
    desc: "Компактный чёрно-белый лазерный принтер с Wi-Fi. Быстрая печать документов для дома и офиса.",
    specs: [["Тип", "Лазерный ч/б"], ["Скорость", "20 стр/мин"], ["Разрешение", "600×600 dpi"], ["Подключение", "Wi-Fi, USB"], ["Ресурс", "8000 стр/мес"]] },
  { name: "Роутер ASUS RT-AX58U Wi-Fi 6", cat: "network", sub: "routers", brand: "ASUS", model: "RT-AX58U", price: 54900, store: "s6", warranty: 36, avail: "in_stock", hue: 205, views: 680, clicks: 110, age: 8, mod: "published",
    desc: "Двухдиапазонный роутер Wi-Fi 6 (AX3000) с защитой AiProtection. Стабильная сеть для всей квартиры.",
    specs: [["Стандарт", "Wi-Fi 6 (AX3000)"], ["Диапазоны", "2.4 + 5 ГГц"], ["Порты", "4× Gigabit LAN"], ["Антенны", "4 внешние"], ["Функции", "AiMesh, VPN"]] },
  { name: "Коммутатор TP-Link TL-SG108 8 портов", cat: "network", sub: "switches", brand: "TP-Link", model: "TL-SG108", price: 18900, store: "s6", warranty: 36, avail: "in_stock", hue: 200, views: 340, clicks: 45, age: 18, mod: "published",
    desc: "Неуправляемый гигабитный коммутатор на 8 портов в металлическом корпусе. Просто подключить и работать.",
    specs: [["Порты", "8× Gigabit"], ["Тип", "Неуправляемый"], ["Корпус", "Металл"], ["Пропускная способность", "16 Гбит/с"]] },
  { name: "Игровое кресло Secretlab TITAN Evo", cat: "gaming", sub: "chairs", brand: "Secretlab", model: "TITAN Evo", price: 279900, store: "s7", warranty: 60, avail: "on_order", hue: 340, views: 1120, clicks: 240, age: 6, mod: "published",
    desc: "Эргономичное игровое кресло с встроенной поясничной поддержкой и магнитными подушками. Материал NEO Hybrid.",
    specs: [["Материал", "NEO Hybrid Leatherette"], ["Нагрузка", "до 130 кг"], ["Регулировки", "4D подлокотники"], ["Наклон", "до 165°"], ["Поддержка", "Встроенная поясничная"]] },
  { name: "Геймпад Xbox Wireless Controller", cat: "gaming", sub: "gamepads", brand: "Microsoft", model: "Xbox Controller", price: 34900, store: "s7", warranty: 12, avail: "in_stock", hue: 150, views: 890, clicks: 170, age: 10, mod: "published",
    desc: "Беспроводной геймпад с текстурированными триггерами и кнопкой Share. Работает с ПК, Xbox и смартфоном.",
    specs: [["Подключение", "Bluetooth / USB-C"], ["Совместимость", "PC, Xbox, Mobile"], ["Питание", "2× AA / аккумулятор"], ["Функции", "Кнопка Share"]] },
  { name: "Система жидкостного охлаждения ARCTIC Liquid Freezer III 360", cat: "components", sub: "cooling", brand: "ARCTIC", model: "Liquid Freezer III 360", price: 69900, store: "s3", warranty: 72, avail: "in_stock", hue: 200, views: 760, clicks: 150, age: 5, mod: "published",
    desc: "Топовая СЖО 360 мм для разогнанных процессоров. Отличная эффективность при низком уровне шума.",
    specs: [["Радиатор", "360 мм"], ["Вентиляторы", "3× 120 мм PWM"], ["Сокеты", "LGA1700, AM5"], ["Помпа", "VRM-охлаждение"], ["Гарантия", "6 лет"]] },
  { name: "Готовый ПК CoreRise Gamer RTX 4070", cat: "computers", sub: "gaming-pc", brand: "CoreRise", model: "Gamer RTX 4070", price: 899900, oldPrice: 969900, store: "s3", warranty: 24, avail: "in_stock", hue: 150, views: 3210, clicks: 820, age: 1, isNew: true, isPromo: true, mod: "published",
    desc: "Собранный и протестированный игровой ПК. Ryzen 7 7700 + RTX 4070, 32 ГБ DDR5, NVMe 1 ТБ. Готов к играм из коробки.",
    specs: [["Процессор", "Ryzen 7 7700"], ["Видеокарта", "RTX 4070 12GB"], ["ОЗУ", "32 ГБ DDR5"], ["Накопитель", "1 ТБ NVMe"], ["БП", "750W Gold"], ["ОС", "Windows 11"]] },
  { name: "Рабочая станция Quadro Creator RTX A4000", cat: "computers", sub: "workstations", brand: "Quadro Tech", model: "Creator A4000", price: 1349900, store: "s8", warranty: 36, avail: "on_order", hue: 95, views: 640, clicks: 95, age: 7, mod: "published",
    desc: "Станция для 3D, рендера и монтажа. Профессиональная видеокарта RTX A4000, 64 ГБ ОЗУ и быстрый NVMe.",
    specs: [["Процессор", "Intel Core i9-14900K"], ["Видеокарта", "RTX A4000 16GB"], ["ОЗУ", "64 ГБ DDR5 ECC"], ["Накопитель", "2 ТБ NVMe"], ["БП", "1000W Platinum"]] },
  // moderation / draft / rejected examples (for admin & seller cabinet)
  { name: "Видеокарта NVIDIA GeForce RTX 4080 SUPER 16GB", cat: "videocards", sub: "nvidia", brand: "NVIDIA", model: "RTX 4080 SUPER", price: 649900, store: "s2", warranty: 36, avail: "in_stock", hue: 262, views: 0, clicks: 0, age: 0, isNew: true, mod: "moderation",
    desc: "Мощная видеокарта для 4K-гейминга и работы с нейросетями. 16 ГБ GDDR6X, отличная эффективность.",
    specs: [["Объём памяти", "16 ГБ GDDR6X"], ["Шина", "256 бит"], ["Boost", "2550 МГц"], ["Интерфейс", "PCIe 4.0"]] },
  { name: "Процессор Intel Core i5-14600KF", cat: "cpu", sub: "intel", brand: "Intel", model: "Core i5-14600KF", price: 154900, store: "s5", warranty: 36, avail: "in_stock", hue: 210, views: 0, clicks: 0, age: 0, mod: "moderation",
    desc: "Отличный процессор среднего сегмента для игровых сборок. 14 ядер, разблокированный множитель.",
    specs: [["Ядра / потоки", "14 / 20"], ["Boost", "5.3 ГГц"], ["Сокет", "LGA1700"], ["TDP", "125 Вт"]] },
  { name: "Клавиатура Razer Huntsman V3 Pro", cat: "keyboards", sub: "mechanical", brand: "Razer", model: "Huntsman V3 Pro", price: 119900, store: "s7", warranty: 24, avail: "in_stock", hue: 150, views: 0, clicks: 0, age: 1, mod: "draft", hidden: true,
    desc: "Киберспортивная клавиатура с аналоговыми оптическими свитчами и регулируемой точкой срабатывания.",
    specs: [["Свитчи", "Analog Optical"], ["Функция", "Rapid Trigger"], ["Подсветка", "Chroma RGB"], ["Раскладка", "Full-size"]] },
  { name: "Монитор AOC 27G2 27 144Hz", cat: "monitors", sub: "gaming", brand: "AOC", model: "27G2", price: 99900, store: "s4", warranty: 24, avail: "in_stock", hue: 20, views: 0, clicks: 0, age: 2, mod: "rejected",
    desc: "Игровой монитор 27″ с IPS-матрицей и частотой 144 Гц. Отклонён: требуется загрузить реальные фотографии товара.",
    specs: [["Диагональ", "27″"], ["Разрешение", "1920×1080"], ["Частота", "144 Гц"], ["Матрица", "IPS"]] },
];

let counter = 12340;
export const products: Product[] = seeds.map((s) => {
  const id = String(++counter);
  return {
    id,
    slug: `${s.model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id}`,
    name: s.name,
    categorySlug: s.cat,
    subcategory: s.sub,
    brand: s.brand,
    model: s.model,
    sku: `${s.brand.slice(0, 3).toUpperCase()}-${id}`,
    price: s.price,
    oldPrice: s.oldPrice,
    description: s.desc,
    specs: s.specs.map(([name, value]) => ({ name, value })),
    warrantyMonths: s.warranty,
    availability: s.avail,
    quantity: s.qty ?? (s.avail === "in_stock" ? 3 + (counter % 12) : 0),
    storeId: s.store,
    hue: s.hue,
    views: s.views,
    telegramClicks: s.clicks,
    createdAt: daysAgo(s.age),
    isNew: s.isNew,
    isPromo: s.isPromo,
    moderation: s.mod ?? "published",
    hidden: s.hidden,
  };
});

// ---- selectors -------------------------------------------------------------

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getStore(id: string) {
  return stores.find((s) => s.id === id);
}

export function getStoreBySlug(slug: string) {
  return stores.find((s) => s.slug === slug);
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

/** Publicly visible products (published + not hidden). */
export const publicProducts = products.filter(
  (p) => p.moderation === "published" && !p.hidden,
);

export function productsByStore(storeId: string) {
  return publicProducts.filter((p) => p.storeId === storeId);
}

export function storeProductCount(storeId: string) {
  return productsByStore(storeId).length;
}

export function categoryProductCount(slug: string) {
  return publicProducts.filter((p) => p.categorySlug === slug).length;
}

export const brands = Array.from(
  new Set(products.map((p) => p.brand)),
).sort();

export function categoryName(slug: string, locale: Locale) {
  return getCategory(slug)?.name[locale] ?? slug;
}

// The store operated by the "logged-in" seller in the demo cabinet.
export const CURRENT_STORE_ID = "s1";
