export interface NavItem {
  label: string;
  i18nKey: string;
  to: string;
  icon?: React.ComponentType;
  authRequired?: boolean;
}

/**
 * Data-driven navigation items.
 * Plugins append to this array to add their own nav entries.
 */
export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    i18nKey: "dashboard.nav.dashboard",
    to: "/dashboard",
  },
  {
    label: "Settings",
    i18nKey: "dashboard.nav.settings",
    to: "/dashboard/settings",
  },
  {
    label: "Billing",
    i18nKey: "dashboard.nav.billing",
    to: "/dashboard/settings/billing",
  },
];
