import {
  LayoutDashboard, ShoppingCart, Users, Package, Ticket, Send, Printer,
  Globe, MessageSquare, Router, Wifi, Network, UserCog, Megaphone,
  MessageCircle, Wallet, UserCheck, FileBarChart, Settings, CreditCard,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

// Grouped navigation. Each item can require a permission; the sidebar filters
// items the user cannot access (enforcement is also server-side via RLS).
export const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'MAIN',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard, permission: 'dashboard:view' },
      { label: 'Sales', to: '/sales', icon: ShoppingCart, permission: 'payment:view' },
      { label: 'Customers', to: '/customers', icon: Users, permission: 'customer:view' },
    ],
  },
  {
    heading: 'HOTSPOT',
    items: [
      { label: 'Packages', to: '/packages', icon: Package, permission: 'package:view' },
      { label: 'Voucher History', to: '/vouchers', icon: Ticket, permission: 'voucher:view' },
      { label: 'Send Voucher', to: '/vouchers/send', icon: Send, permission: 'voucher:manage' },
      { label: 'Voucher Printing', to: '/vouchers/print', icon: Printer, permission: 'voucher:view' },
      { label: 'Portal', to: '/portal', icon: Globe, permission: 'settings:manage' },
      { label: 'Chats', to: '/chats', icon: MessageSquare, permission: 'customer:view' },
      { label: 'My Routers', to: '/routers', icon: Router, permission: 'router:view' },
      { label: 'Active Users', to: '/active-users', icon: Wifi, permission: 'router:view' },
    ],
  },
  {
    heading: 'PPPOE',
    items: [
      { label: 'PPPoE Plans', to: '/pppoe/plans', icon: Network, permission: 'pppoe:view' },
      { label: 'PPPoE Customers', to: '/pppoe/customers', icon: UserCog, permission: 'pppoe:view' },
    ],
  },
  {
    heading: 'SMS',
    items: [
      { label: 'Announcements', to: '/sms/announcements', icon: Megaphone, permission: 'sms:view' },
      { label: 'Buy SMS', to: '/sms/buy', icon: MessageCircle, permission: 'sms:manage' },
    ],
  },
  {
    heading: 'ACCOUNT',
    items: [
      { label: 'Withdrawals', to: '/withdrawals', icon: Wallet, permission: 'payment:manage' },
      { label: 'Agents', to: '/agents', icon: UserCheck, permission: 'agent:view' },
      { label: 'Reports', to: '/reports', icon: FileBarChart, permission: 'report:view' },
      { label: 'Settings', to: '/settings', icon: Settings, permission: 'settings:manage' },
      { label: 'Subscription', to: '/subscription', icon: CreditCard, permission: 'subscription:manage' },
    ],
  },
];
