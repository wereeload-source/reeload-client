import {
  CalendarDays, CircleAlert, FileText, LayoutGrid, PhoneCall, Settings, Upload, UserCog, Users, Wallet,
  type LucideIcon,
} from "lucide-react";
import type { NavKey } from "@/lib/nav";

export const NAV_ICON: Record<NavKey, LucideIcon> = {
  dashboard: LayoutGrid,
  jobs: FileText,
  calendar: CalendarDays,
  assign: CircleAlert,
  payments: Wallet,
  review: Upload,
  team: Users,
  contacts: PhoneCall,
  users: UserCog,
  settings: Settings,
};
