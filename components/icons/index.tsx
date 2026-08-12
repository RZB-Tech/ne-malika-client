import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Alert02Icon,
  AiBrain01Icon,
  AlertCircleIcon,
  Analytics01Icon,
  ArmchairIcon,
  ArrowDownRight01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  BalanceScaleIcon,
  BanIcon,
  BatteryCharging01Icon,
  Calendar03Icon,
  Call02Icon,
  Cancel01Icon,
  CancelCircleIcon,
  ChampionIcon,
  CheckmarkCircle02Icon,
  // Шевроны переименованы: под этими же именами их ждут заготовки shadcn/ui,
  // и без псевдонима имя столкнулось бы с экспортом ниже.
  ChevronDownIcon as ChevronDownSrc,
  ChevronLeftIcon as ChevronLeftSrc,
  ChevronRightIcon as ChevronRightSrc,
  ChevronUpIcon as ChevronUpSrc,
  ChipIcon,
  CircuitBoardIcon,
  Clock01Icon,
  CloudIcon,
  Coins01Icon,
  ComputerDesk01Icon,
  ComputerIcon,
  ComputerVideoIcon,
  CpuIcon,
  DashboardSquare01Icon,
  Database01Icon,
  Delete02Icon,
  DiscIcon,
  EyeIcon,
  Fan01Icon,
  FavouriteIcon,
  Flag02Icon,
  GamepadIcon,
  GridIcon,
  HandshakeIcon,
  HardDriveDownloadIcon,
  HardDriveIcon,
  HeadphonesIcon,
  HistoryIcon,
  Home01Icon,
  ImageAdd01Icon,
  InformationCircleIcon,
  KeyboardIcon,
  LaptopIcon,
  LinkSquare02Icon,
  Loading03Icon,
  Location01Icon,
  Logout01Icon,
  MagicWand01Icon,
  Menu01Icon,
  Message01Icon,
  MessageAdd01Icon,
  MinusSignIcon,
  Moon02Icon,
  MoreHorizontalIcon,
  Mouse01Icon,
  Notification01Icon,
  NotificationOff01Icon,
  Package01Icon,
  PencilEdit02Icon,
  PlusSignCircleIcon,
  PlusSignIcon,
  PowerIcon,
  PrinterIcon,
  RamMemoryIcon,
  Refresh01Icon,
  Rotate01Icon,
  Search01Icon,
  SearchRemoveIcon,
  SentIcon,
  ServerStack01Icon,
  Setting07Icon,
  Shield01Icon,
  ShieldBanIcon,
  ShoppingBasket01Icon,
  SidebarLeft01Icon,
  SmartPhone01Icon,
  SparklesIcon,
  SpeakerIcon,
  StarIcon,
  Store01Icon,
  Sun03Icon,
  Tablet01Icon,
  Tag01Icon,
  Tick02Icon,
  TruckIcon,
  Undo02Icon,
  Upload01Icon,
  UsbIcon,
  UserBlock01Icon,
  UserGroupIcon,
  UserIcon,
  Wallet01Icon,
  Wifi01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

/**
 * Единственный источник значков в проекте.
 *
 * Внутри — Hugeicons; наружу — привычные имена, поэтому в компонентах меняется
 * только строка импорта, а разметка остаётся прежней: `<Search className="size-4" />`.
 *
 * Зачем прослойка: набор значков — вещь сменная. Здесь она меняется в одном
 * файле, а не в семидесяти. Смена стиля на платный «solid rounded» — это ровно
 * одна правка импорта ниже: имена значков в пакетах Hugeicons совпадают, отличается
 * только пакет (`@hugeicons-pro/core-solid-rounded` вместо `@hugeicons/core-free-icons`).
 * Бесплатный набор идёт только в обводке — заливки в нём нет.
 */

export type AppIconProps = Omit<
  React.ComponentProps<typeof HugeiconsIcon>,
  "icon"
>;

/** Тип значка для мест, где его передают как значение: меню, вкладки, панели. */
export type AppIcon = (props: AppIconProps) => React.ReactElement;

/**
 * Значок фиксированного размера 24 — как у Lucide. Реальный размер задают
 * классы `size-*` со стороны вызова: у svg они перебивают атрибуты.
 */
function make(icon: IconSvgElement, displayName: string): AppIcon {
  const Icon = (props: AppIconProps) => <HugeiconsIcon icon={icon} {...props} />;
  Icon.displayName = displayName;
  return Icon;
}

/** Пометка у автоответа: покупатель должен видеть, что писал не человек. */
export const Bot = make(AiBrain01Icon, "Bot");

export const Armchair = make(ArmchairIcon, "Armchair");
export const ArrowDownRight = make(ArrowDownRight01Icon, "ArrowDownRight");
export const ArrowLeft = make(ArrowLeft01Icon, "ArrowLeft");
export const ArrowRight = make(ArrowRight01Icon, "ArrowRight");
export const ArrowUpRight = make(ArrowUpRight01Icon, "ArrowUpRight");
export const Ban = make(BanIcon, "Ban");
export const BarChart3 = make(Analytics01Icon, "BarChart3");
export const BatteryCharging = make(BatteryCharging01Icon, "BatteryCharging");
export const Bell = make(Notification01Icon, "Bell");
export const BellOff = make(NotificationOff01Icon, "BellOff");
export const Box = make(Package01Icon, "Box");
export const CalendarDays = make(Calendar03Icon, "CalendarDays");
export const Check = make(Tick02Icon, "Check");
export const CheckIcon = Check;
export const CheckCircle2 = make(CheckmarkCircle02Icon, "CheckCircle2");
export const CircleCheckIcon = CheckCircle2;
export const ChevronDown = make(ChevronDownSrc, "ChevronDown");
export const ChevronDownIcon = ChevronDown;
export const ChevronLeft = make(ChevronLeftSrc, "ChevronLeft");
export const ChevronRight = make(ChevronRightSrc, "ChevronRight");
export const ChevronRightIcon = ChevronRight;
export const ChevronUp = make(ChevronUpSrc, "ChevronUp");
export const ChevronUpIcon = ChevronUp;
export const CircleAlert = make(AlertCircleIcon, "CircleAlert");
export const CircuitBoard = make(CircuitBoardIcon, "CircuitBoard");
export const Clock = make(Clock01Icon, "Clock");
export const Cloud = make(CloudIcon, "Cloud");
export const Coins = make(Coins01Icon, "Coins");
export const Cpu = make(CpuIcon, "Cpu");
export const Database = make(Database01Icon, "Database");
export const Disc = make(DiscIcon, "Disc");
export const ExternalLink = make(LinkSquare02Icon, "ExternalLink");
export const Eye = make(EyeIcon, "Eye");
export const Fan = make(Fan01Icon, "Fan");
export const Flag = make(Flag02Icon, "Flag");
export const Gamepad2 = make(GamepadIcon, "Gamepad2");
export const Handshake = make(HandshakeIcon, "Handshake");
export const HardDrive = make(HardDriveIcon, "HardDrive");
export const HardDriveDownload = make(
  HardDriveDownloadIcon,
  "HardDriveDownload",
);
export const Headphones = make(HeadphonesIcon, "Headphones");
export const Heart = make(FavouriteIcon, "Heart");
export const History = make(HistoryIcon, "History");
export const Home = make(Home01Icon, "Home");
export const ImagePlus = make(ImageAdd01Icon, "ImagePlus");
export const Info = make(InformationCircleIcon, "Info");
export const InfoIcon = Info;
export const Keyboard = make(KeyboardIcon, "Keyboard");
export const Laptop = make(LaptopIcon, "Laptop");
export const LayoutDashboard = make(DashboardSquare01Icon, "LayoutDashboard");
export const LayoutGrid = make(GridIcon, "LayoutGrid");
export const Loader2 = make(Loading03Icon, "Loader2");
export const Loader2Icon = Loader2;
export const LogOut = make(Logout01Icon, "LogOut");
export const MapPin = make(Location01Icon, "MapPin");
export const MemoryStick = make(RamMemoryIcon, "MemoryStick");
export const Menu = make(Menu01Icon, "Menu");
export const MessageSquare = make(Message01Icon, "MessageSquare");
export const MessageSquarePlus = make(MessageAdd01Icon, "MessageSquarePlus");
export const Microchip = make(ChipIcon, "Microchip");
export const Minus = make(MinusSignIcon, "Minus");
export const Monitor = make(ComputerIcon, "Monitor");
export const Moon = make(Moon02Icon, "Moon");
export const MoreHorizontal = make(MoreHorizontalIcon, "MoreHorizontal");
export const Mouse = make(Mouse01Icon, "Mouse");
export const Package = make(Package01Icon, "Package");
export const PanelLeftIcon = make(SidebarLeft01Icon, "PanelLeft");
export const PcCase = make(ComputerDesk01Icon, "PcCase");
export const Pencil = make(PencilEdit02Icon, "Pencil");
export const Phone = make(Call02Icon, "Phone");
export const Plus = make(PlusSignIcon, "Plus");
export const PlusCircle = make(PlusSignCircleIcon, "PlusCircle");
export const Power = make(PowerIcon, "Power");
export const Printer = make(PrinterIcon, "Printer");
export const RefreshCw = make(Refresh01Icon, "RefreshCw");
export const RotateCcw = make(Rotate01Icon, "RotateCcw");
export const Scale = make(BalanceScaleIcon, "Scale");
export const Search = make(Search01Icon, "Search");
export const SearchX = make(SearchRemoveIcon, "SearchX");
export const Send = make(SentIcon, "Send");
export const Server = make(ServerStack01Icon, "Server");
export const Settings = make(Setting07Icon, "Settings");
export const ShieldCheck = make(Shield01Icon, "ShieldCheck");
export const ShieldOff = make(ShieldBanIcon, "ShieldOff");
export const ShoppingBasket = make(ShoppingBasket01Icon, "ShoppingBasket");
export const Smartphone = make(SmartPhone01Icon, "Smartphone");
export const Sparkles = make(SparklesIcon, "Sparkles");
export const Speaker = make(SpeakerIcon, "Speaker");
export const Star = make(StarIcon, "Star");
export const Store = make(Store01Icon, "Store");
export const Sun = make(Sun03Icon, "Sun");
export const Tablet = make(Tablet01Icon, "Tablet");
export const Tag = make(Tag01Icon, "Tag");
export const Trash2 = make(Delete02Icon, "Trash2");
export const TriangleAlert = make(Alert02Icon, "TriangleAlert");
export const TriangleAlertIcon = TriangleAlert;
export const Trophy = make(ChampionIcon, "Trophy");
export const Truck = make(TruckIcon, "Truck");
export const Undo2 = make(Undo02Icon, "Undo2");
export const Upload = make(Upload01Icon, "Upload");
export const Usb = make(UsbIcon, "Usb");
export const UserRound = make(UserIcon, "UserRound");
export const UserX = make(UserBlock01Icon, "UserX");
export const Users = make(UserGroupIcon, "Users");
export const Wallet = make(Wallet01Icon, "Wallet");
export const Wand2 = make(MagicWand01Icon, "Wand2");
export const Webcam = make(ComputerVideoIcon, "Webcam");
export const Wifi = make(Wifi01Icon, "Wifi");
export const Wrench = make(Wrench01Icon, "Wrench");
export const X = make(Cancel01Icon, "X");
export const XIcon = X;
export const XCircle = make(CancelCircleIcon, "XCircle");
export const OctagonXIcon = XCircle;
