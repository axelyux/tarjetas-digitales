import {
  BookOpen, CalendarCheck, FileText, Video, Calendar, Camera, Clock, Gift, Globe, Heart, Link as LinkIcon, Mail,
  MapPin, Phone, ShoppingBag, Star, Tag, Truck, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { SiFacebook, SiInstagram, SiTiktok, SiWhatsapp, SiYoutube } from "react-icons/si";
import type { IconType } from "react-icons";
import type { ActionIconKey } from "@/lib/cards/action-types";

const LUCIDE: Partial<Record<ActionIconKey, LucideIcon>> = {
  phone: Phone,
  map: MapPin,
  "map-pin": MapPin,
  booking: CalendarCheck,
  website: Globe,
  globe: Globe,
  link: LinkIcon,
  menu: UtensilsCrossed,
  tag: Tag,
  calendar: Calendar,
  "shopping-bag": ShoppingBag,
  star: Star,
  gift: Gift,
  clock: Clock,
  mail: Mail,
  camera: Camera,
  heart: Heart,
  "book-open": BookOpen,
  truck: Truck,
  "file-text": FileText,
  pdf: FileText,
  catalog: BookOpen,
  video: Video,
  email: Mail,
  custom_url: LinkIcon,
};

const BRANDS: Partial<Record<ActionIconKey, IconType>> = {
  whatsapp: SiWhatsapp,
  instagram: SiInstagram,
  facebook: SiFacebook,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  linkedin: FaLinkedin,
};

export function ActionIcon({ name, size = 20 }: { name: ActionIconKey; size?: number }) {
  const Brand = BRANDS[name];
  if (Brand) return <Brand size={size} aria-hidden="true" className="shrink-0" />;
  const Icon = LUCIDE[name] ?? LinkIcon;
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" className="shrink-0" />;
}
