import {ExpenseCategoryModel} from '@trackingPortal/api/models';

const RAW_FALLBACK_CATEGORIES = [
  {name: 'Food', icon: 'utensils', color: '#FF6B6B'},
  {name: 'Groceries', icon: 'shopping-cart', color: '#4ECDC4'},
  {name: 'Transport', icon: 'car', color: '#1DD3B0'},
  {name: 'Bills', icon: 'file-invoice', color: '#FFA500'},
  {name: 'Shopping', icon: 'shopping-bag', color: '#9B5DE5'},
  {name: 'Entertainment', icon: 'gamepad', color: '#FFB347'},
  {name: 'Health', icon: 'heartbeat', color: '#E63946'},
  {name: 'Travel', icon: 'plane', color: '#00B4D8'},
  {name: 'Subscriptions', icon: 'repeat', color: '#6D597A'},
  {name: 'Housing', icon: 'home', color: '#2A9D8F'},
  {name: 'Education', icon: 'book', color: '#264653'},
  {name: 'Personal', icon: 'user', color: '#F4A261'},
  {name: 'Gifts', icon: 'gift', color: '#E76F51'},
  {name: 'Family', icon: 'users', color: '#8AB17D'},
  {name: 'Other', icon: 'dots-horizontal', color: '#ADB5BD'},
] as const;

const CATEGORY_ICON_ALIASES: Record<string, string> = {
  utensils: 'silverware-fork-knife',
  'shopping-cart': 'cart',
  car: 'car-sports',
  'file-invoice': 'file-document',
  'shopping-bag': 'shopping',
  gamepad: 'gamepad-variant',
  heartbeat: 'heart-pulse',
  plane: 'airplane',
  repeat: 'repeat',
  home: 'home-variant',
  book: 'book-open-page-variant',
  user: 'account',
  gift: 'gift',
  users: 'account-group',
  'dots-horizontal': 'dots-horizontal',
  transport: 'transit-connection-horizontal',
};

export const normalizeCategoryIcon = (icon?: string) => {
  if (!icon) {
    return 'shape';
  }
  const normalized = icon.trim().toLowerCase();
  return CATEGORY_ICON_ALIASES[normalized] || icon;
};

export const FALLBACK_CATEGORIES: ExpenseCategoryModel[] =
  RAW_FALLBACK_CATEGORIES.map(category => ({
    id: category.name.toLowerCase().replace(/\s+/g, '-'),
    name: category.name,
    icon: normalizeCategoryIcon(category.icon),
    color: category.color,
  }));
