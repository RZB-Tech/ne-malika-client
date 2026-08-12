import {
  Armchair,
  BatteryCharging,
  Box,
  CircuitBoard,
  Cpu,
  Database,
  Disc,
  Fan,
  Gamepad2,
  HardDrive,
  HardDriveDownload,
  Headphones,
  Keyboard,
  Laptop,
  MemoryStick,
  Microchip,
  Monitor,
  Mouse,
  PcCase,
  Power,
  Printer,
  Server,
  Smartphone,
  Speaker,
  Tablet,
  Usb,
  Webcam,
  Wifi,
  Wrench,
  type AppIcon,
} from "@/components/icons";

/** Ключи — значения поля icon у корневых категорий (см. таблицу categories). */
const map: Record<string, AppIcon> = {
  PcCase,
  Laptop,
  Monitor,
  CircuitBoard,
  Cpu,
  Server,
  MemoryStick,
  HardDrive,
  Database,
  Power,
  Box,
  Keyboard,
  Mouse,
  Headphones,
  Webcam,
  Printer,
  Wifi,
  Gamepad2,
  Fan,
  Wrench,
  Speaker,
  BatteryCharging,
  HardDriveDownload,
  Tablet,
  Smartphone,
  Usb,
  Disc,
  Armchair,
  Microchip,
};

export function CategoryIcon({
  name,
  className,
  strokeWidth,
}: {
  /** Категории из БД могут прийти без иконки — тогда рисуем коробку. */
  name: string | null | undefined;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = (name && map[name]) || Box;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

export function getCategoryIcon(name: string): AppIcon {
  return map[name] ?? Box;
}
