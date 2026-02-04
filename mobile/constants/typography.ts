/**
 * FlowSplit Typography System
 * Font: Satoshi from Fontshare
 */

import { TextStyle } from 'react-native';

// Font family names (as they appear after loading with expo-font)
export const FontFamily = {
  regular: 'Satoshi-Regular',
  medium: 'Satoshi-Medium',
  bold: 'Satoshi-Bold',
  black: 'Satoshi-Black',
} as const;

// Font weights mapped to font family
export const FontWeight = {
  regular: '400',
  medium: '500',
  bold: '700',
  black: '900',
} as const;

// Font sizes from design
export const FontSize = {
  xs: 10,      // Tiny labels, percentages
  sm: 11,      // Uppercase labels, captions
  base: 12,    // Small labels
  md: 14,      // Body text, card titles
  lg: 17,      // Section headers
  xl: 18,      // Header title
  '2xl': 24,   // Page titles
  '3xl': 40,   // Large amounts
  '4xl': 60,   // Extra large amount input
} as const;

// Line heights
export const LineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.5,
} as const;

// Letter spacing
export const LetterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,        // For uppercase labels (tracking-widest)
  ultrawide: 4,     // For extra spaced labels (tracking-[0.15em])
} as const;

// Pre-defined text styles
export const TextStyles: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontFamily: FontFamily.black,
    fontSize: FontSize['2xl'],
    lineHeight: FontSize['2xl'] * LineHeight.tight,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * LineHeight.snug,
  },
  h3: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * LineHeight.snug,
  },

  // Body
  body: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.normal,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.normal,
  },
  bodyRegular: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.relaxed,
  },

  // Labels
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  labelSmall: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.widest,
  },
  caption: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.normal,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.wider,
  },

  // Amounts
  amountLarge: {
    fontFamily: FontFamily.black,
    fontSize: FontSize['4xl'],
    lineHeight: FontSize['4xl'] * LineHeight.tight,
  },
  amountMedium: {
    fontFamily: FontFamily.black,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * LineHeight.tight,
  },
  amountSmall: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * LineHeight.tight,
  },

  // Button text
  button: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.normal,
  },
} as const;

/**
 * Font Loading Instructions:
 *
 * 1. Download Satoshi from https://www.fontshare.com/fonts/satoshi
 * 2. Place font files in /assets/fonts/:
 *    - Satoshi-Regular.otf
 *    - Satoshi-Medium.otf
 *    - Satoshi-Bold.otf
 *    - Satoshi-Black.otf
 *
 * 3. Load fonts in app/_layout.tsx:
 *    ```
 *    import { useFonts } from 'expo-font';
 *
 *    const [fontsLoaded] = useFonts({
 *      'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
 *      'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
 *      'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
 *      'Satoshi-Black': require('../assets/fonts/Satoshi-Black.otf'),
 *    });
 *    ```
 *
 * Until fonts are set up, the app will use system fonts.
 */

// System font fallback (used until Satoshi is loaded)
export const SystemFontFamily = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  black: 'System',
} as const;

// Helper to check if custom fonts are loaded
let fontsLoaded = false;

export const setFontsLoaded = (loaded: boolean) => {
  fontsLoaded = loaded;
};

// Get font family with automatic fallback
export const getFont = (weight: keyof typeof FontFamily): string => {
  return fontsLoaded ? FontFamily[weight] : SystemFontFamily[weight];
};
