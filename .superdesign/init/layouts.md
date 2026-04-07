# FlowSplit Layout Patterns

## Root Layout (`app/_layout.tsx`)
Loads Satoshi fonts via `useFonts`, sets up SafeAreaProvider, AuthContext, wraps Expo Router Stack.

## Tab Layout (`app/(tabs)/_layout.tsx`)
Custom `TabBar` component at bottom. Tabs: Home, History, Buckets, Settings.

## Standard Screen Layout Pattern
```tsx
<KeyboardAvoidingView style={{ flex:1, backgroundColor: Colors.background }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
  <Header title="..." showBack rightAction="none" />
  <ScrollView
    contentContainerStyle={{ paddingHorizontal: Spacing.page, paddingTop: Spacing[6], gap: Spacing[6] }}
    keyboardShouldPersistTaps="handled"
  >
    {/* sections */}
  </ScrollView>
  <View style={{ backgroundColor: Colors.card, borderTopWidth:1, borderTopColor: Colors.gray[100],
    paddingHorizontal: Spacing.page, paddingTop: Spacing[4], paddingBottom: insets.bottom + Spacing[4] }}>
    <Button>Save</Button>
  </View>
</KeyboardAvoidingView>
```

## Section + Card Pattern
```tsx
<View style={{ gap: Spacing[2] }}>
  <Text style={{ fontFamily: FontFamily.bold, fontSize: 11, color: Colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 1.2 }}>Section Label</Text>
  <View style={{ backgroundColor: Colors.card, borderRadius: BorderRadius.card,
    padding: Spacing[5], borderWidth:1, borderColor: Colors.border.subtle,
    gap: Spacing[5], ...Shadows.card }}>
    {/* content */}
  </View>
</View>
```

## Form Input Pattern
```tsx
<View style={{ gap: Spacing[2] }}>
  <Text style={{ fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.text.secondary }}>
    Label
  </Text>
  <TextInput
    style={[{ backgroundColor: Colors.background, borderWidth:1.5, borderColor: Colors.border.light,
      borderRadius: BorderRadius.xl, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
      fontFamily: FontFamily.medium, fontSize: FontSize.md, color: Colors.text.primary },
      focused && { borderColor: Colors.primary }]}
  />
</View>
```

## Delivery Method Card Pattern (used in new.tsx and [id].tsx)
Tappable card with icon box, title/description text, optional checkmark. Selected state: colored border + primaryLight icon bg.
