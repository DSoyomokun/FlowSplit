/**
 * FlowSplit Spacing System
 * Based on design spec from SuperDesign
 */

// Base spacing unit (4px)
const BASE = 4;

export const Spacing = {
  // Base scale
  0: 0,
  0.5: BASE * 0.5,    // 2
  1: BASE,            // 4
  1.5: BASE * 1.5,    // 6
  2: BASE * 2,        // 8
  2.5: BASE * 2.5,    // 10
  3: BASE * 3,        // 12
  3.5: BASE * 3.5,    // 14
  4: BASE * 4,        // 16
  5: BASE * 5,        // 20
  6: BASE * 6,        // 24
  7: BASE * 7,        // 28
  8: BASE * 8,        // 32
  9: BASE * 9,        // 36
  10: BASE * 10,      // 40
  11: BASE * 11,      // 44
  12: BASE * 12,      // 48
  14: BASE * 14,      // 56
  16: BASE * 16,      // 64
  20: BASE * 20,      // 80
  24: BASE * 24,      // 96

  // Semantic spacing (from design spec)
  page: 24,           // Main page padding (p-6 = 1.5rem = 24px)
  section: 24,        // Space between sections
  card: 24,           // Card internal padding (p-6)
  cardSmall: 16,      // Small card padding (p-4)
  cardLarge: 32,      // Large card padding (p-8)
  item: 12,           // Space between items (gap-3)
  itemSmall: 8,       // Small item spacing (gap-2)
  itemLarge: 16,      // Large item spacing (gap-4)
} as const;

export const BorderRadius = {
  // Base scale
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,             // For icons, small elements
  xl: 16,             // For cards, buttons (rounded-2xl)
  '2xl': 24,          // For medium cards (rounded-[24px])
  '3xl': 32,          // For large cards (rounded-[32px])
  full: 9999,

  // Semantic (from design spec)
  button: 16,         // Buttons use xl (16px)
  card: 32,           // Large cards use 32px
  cardMedium: 24,     // Medium cards use 24px
  cardSmall: 16,      // Small cards/items use 16px
  input: 16,
  icon: 12,           // Icon containers
  badge: 12,
  indicator: 9999,
} as const;

export const Size = {
  // Icon sizes
  iconXs: 16,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,

  // Avatar/thumbnail sizes
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 48,
  avatarXl: 64,

  // Component sizes
  headerHeight: 64,
  tabBarHeight: 80,
  bottomBarHeight: 140,
  buttonHeight: 56,        // py-4 equivalent
  inputHeight: 56,
  cardIcon: 48,            // w-12 h-12
  bucketIcon: 40,          // w-10 h-10

  // Donut chart
  donutSize: 260,
  donutRadius: 40,
  donutStrokeWidth: 12,
  donutStrokeWidthHover: 14,
  donutHandleRadius: 4.5,

  // Safe area (iOS bottom)
  safeAreaBottom: 34,

  // Max width (mobile container)
  maxWidth: 375,
} as const;

// Layout helpers
export const Layout = {
  // Max widths
  maxWidth: 375,
  contentMaxWidth: 327,    // 375 - (24 * 2) page padding

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    toast: 70,
    header: 50,
    bottomBar: 100,
  },
} as const;
