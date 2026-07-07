import {
  Box,
  CircuitBoard,
  Cpu,
  Database,
  Fan,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  MemoryStick,
  Monitor,
  Mouse,
  PcCase,
  Power,
  Printer,
  Server,
  Webcam,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
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
};

export function CategoryIcon({
  name,
  className,
  strokeWidth,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = map[name] ?? Box;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

export function getCategoryIcon(name: string): LucideIcon {
  return map[name] ?? Box;
}
