# Debugging Expo React Native White Screen Issues

A practical guide based on real debugging of the FlowSplit app.

## The Problem

When running `npx expo start` and opening in web/simulator, you see a blank white screen with no visible errors in the terminal.

## Why This Happens

React Native/Expo apps fail silently when:
1. **Missing dependencies** - Imported packages not installed
2. **Missing assets** - Fonts, images referenced but don't exist
3. **Undefined variables** - Accessing properties on undefined objects
4. **Environment variables** - Missing `.env` configuration
5. **Initialization errors** - Crashes in providers/context before render

## Debugging Strategy

### Step 1: Try Web Export (Best First Step)

```bash
npx expo export --platform web 2>&1 | grep -E "Unable to resolve|Error:"
```

This reveals **ALL** missing dependencies at once instead of one-by-one at runtime.

**Example output:**
```
Error: Unable to resolve module expo-blur from /components/BottomActionBar.tsx
Error: Unable to resolve module expo-clipboard from /components/ActionCard.tsx
```

**Fix:** Install each missing package:
```bash
npx expo install expo-blur expo-clipboard
```

### Step 2: Check Browser DevTools Console

1. Open browser (press `w` in Expo)
2. Press `F12` → Console tab
3. Look for JavaScript errors like:
   - `Cannot read properties of undefined`
   - `X is not defined`

**Example we found:**
```
Colors.status.warning is undefined
BucketColors[0] is undefined
```

**Fix:** Add missing exports or fix import paths.

### Step 3: Simplify to Isolate

Replace your root layout with minimal code:

```tsx
// app/_layout.tsx - TEMPORARY DEBUG VERSION
import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </View>
  );
}
```

```tsx
// app/index.tsx - TEMPORARY DEBUG VERSION
import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0EA5A5' }}>
      <Text style={{ color: 'white', fontSize: 32 }}>App Working!</Text>
    </View>
  );
}
```

If this works → problem is in your providers/context/complex components.
If still blank → problem is in Expo/Metro setup.

### Step 4: Check Common Culprits

#### Missing Assets (Fonts)
```tsx
// This crashes silently if fonts don't exist:
const [fontsLoaded] = useFonts({
  'CustomFont': require('../assets/fonts/CustomFont.otf'), // File missing!
});

if (!fontsLoaded) return null; // Never loads, stuck on null
```

**Fix:** Either add the font files or remove font loading temporarily.

#### Missing Environment Variables
```tsx
// This creates undefined client if .env missing:
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!; // undefined!
export const supabase = createClient(supabaseUrl, ...); // Crashes
```

**Fix:** Create `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

#### Undefined Object Properties
```tsx
// If Colors.status doesn't exist:
backgroundColor: Colors.status.warning  // Crash!
```

**Fix:** Add the missing property to your constants or fix the reference.

### Step 5: Find All Expo Imports

Find every expo package your code uses:
```bash
grep -r "from 'expo-" --include="*.tsx" --include="*.ts" . | grep -oE "expo-[a-z-]+" | sort -u
```

Then install them all:
```bash
npx expo install expo-blur expo-clipboard expo-haptics expo-linear-gradient
```

## Quick Reference: Common Missing Packages

| Error | Package to Install |
|-------|-------------------|
| `expo-blur` not found | `npx expo install expo-blur` |
| `expo-clipboard` not found | `npx expo install expo-clipboard` |
| `expo-haptics` not found | `npx expo install expo-haptics` |
| `react-native-gesture-handler` | `npx expo install react-native-gesture-handler` |
| `react-native-safe-area-context` | `npx expo install react-native-safe-area-context` |
| `@react-native-async-storage/async-storage` | `npx expo install @react-native-async-storage/async-storage` |
| `react-native-web` (for web) | `npx expo install react-native-web react-dom @expo/metro-runtime` |

## Debugging Commands Cheat Sheet

```bash
# Clear cache and restart
npx expo start --clear

# Export to find all missing deps
npx expo export --platform web 2>&1 | grep "Unable to resolve"

# Find all expo imports in your code
grep -r "from 'expo-" --include="*.tsx" . | grep -oE "expo-[a-z-]+" | sort -u

# Check what's installed
npm ls expo-blur

# Install Expo-compatible version
npx expo install <package-name>
```

## Prevention Tips

1. **Always use `npx expo install`** instead of `npm install` for Expo packages
2. **Create placeholder assets** before referencing them
3. **Set up `.env` early** with at least placeholder values
4. **Test after each major change** - don't wait until many changes pile up
5. **Keep browser DevTools open** while developing for web

## The Actual FlowSplit Issues We Fixed

| Issue | Symptom | Solution |
|-------|---------|----------|
| Missing fonts | White screen, no error | Removed font loading temporarily |
| Missing `.env` | Supabase client undefined | Created `.env` with credentials |
| Missing `expo-blur`, `expo-clipboard`, etc. | White screen | `npx expo export` revealed them, then installed |
| `BucketColors` undefined | Console error | Added export to `colors.ts` |
| `Colors.status.warning` undefined | Console error | Added `status` object to Colors |
| Missing asset files | Build warnings | Created placeholder PNGs |
