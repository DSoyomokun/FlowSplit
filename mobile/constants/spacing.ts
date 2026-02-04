/**
 * FlowSplit Spacing System
 * Consistent spacing values from design
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

  // Semantic spacing
  page: 20,           // Main page padding (p-5)
  section: 24,        // Space between sections (space-y-6)
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
  lg: 12,
  xl: 16,             // rounded-2xl - buttons, items
  '2xl': 24,          // rounded-[24px] - medium cards
  '3xl': 32,          // rounded-[32px] - large cards
  full: 9999,         // rounded-full - circles

  // Semantic
  button: 16,
  card: 32,
  cardMedium: 24,
  input: 16,
  icon: 16,
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
  bottomBarHeight: 140,    // With safe area
  buttonHeight: 56,        // py-4 equivalent
  inputHeight: 56,
  cardIcon: 48,            // w-12 h-12

  // Donut chart
  donutSize: 280,
  donutRadius: 40,         // In viewBox units (100x100)
  donutStrokeWidth: 12,
  donutStrokeWidthHover: 14,
  donutHandleRadius: 4.5,

  // Safe area (iOS bottom)
  safeAreaBottom: 34,
} as const;

// Layout helpers
export const Layout = {
  // Max widths
  maxWidth: 375,           // iPhone design width
  contentMaxWidth: 335,    // With page padding

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
  },
} as const;
