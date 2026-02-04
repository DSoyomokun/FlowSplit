# Satoshi Font Setup

FlowSplit uses the **Satoshi** font family from Fontshare.

## Download Instructions

1. Visit https://www.fontshare.com/fonts/satoshi
2. Download the font family
3. Extract and copy these files to this folder:
   - `Satoshi-Regular.otf`
   - `Satoshi-Medium.otf`
   - `Satoshi-Bold.otf`
   - `Satoshi-Black.otf`

## Alternative: Use the CDN in Development

During development, you can use the system font as a fallback. The app will automatically use the system font if Satoshi is not loaded.

## Font Loading

Fonts are loaded in `app/_layout.tsx` using `expo-font`. The app will show a splash screen until fonts are loaded.
