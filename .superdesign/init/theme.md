# FlowSplit Design Tokens

## Framework
React Native + Expo SDK 54, TypeScript. Styling via `StyleSheet.create()`. No Tailwind or CSS.

## Colors (`mobile/constants/colors.ts`)
```ts
Primary: '#0EA5A5'
PrimaryHover: '#0C8F8F'
PrimaryLight: 'rgba(14, 165, 165, 0.1)'
Background: '#F8F8F8'
Card: '#FFFFFF'
Text.primary: '#1F2937'
Text.secondary: '#6B7280'
Text.muted: '#9CA3AF'
Border.subtle: 'rgba(0, 0, 0, 0.04)'
Border.light: '#F3F4F6'
Gray[50..900]: standard scale
Success.bgSolid: '#10B981'
Warning.bgSolid: '#F59E0B', Warning.text: '#D97706'
Error.bgSolid: '#EF4444', Error.text: '#DC2626'
BucketColors: ['#0EA5A5','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EC4899','#06B6D4','#F97316']
```

## Typography (`mobile/constants/typography.ts`)
Font: Satoshi (Regular/Medium/Bold/Black)
```ts
FontFamily.regular = 'Satoshi-Regular'
FontFamily.medium  = 'Satoshi-Medium'
FontFamily.bold    = 'Satoshi-Bold'
FontFamily.black   = 'Satoshi-Black'

FontSize.xs=10, sm=11, base=12, md=14, lg=17, xl=18, 2xl=24, 3xl=40, 4xl=60

LetterSpacing.wide=0.5, wider=1, widest=2
```

## Spacing (`mobile/constants/spacing.ts`)
Base unit = 4px. Scale: Spacing[1]=4, [2]=8, [3]=12, [4]=16, [5]=20, [6]=24, [8]=32, [10]=40, [12]=48, [16]=64
Semantic: Spacing.page=24, Spacing.card=24

## Border Radius (`mobile/constants/spacing.ts` → BorderRadius)
```ts
sm=4, md=8, lg=12, xl=16, 2xl=24, 3xl=32, full=9999
card=32, cardMedium=24, cardSmall=16, button=16, badge=12, icon=12
```

## Shadows (`mobile/constants/shadows.ts`)
```ts
Shadows.card       = { shadowColor:'#000', offset:{0,4}, opacity:0.05, radius:10 }
Shadows.buttonPrimary = { shadowColor:'#0EA5A5', offset:{0,10}, opacity:0.4, radius:10 }
Shadows.bottomBar  = { shadowColor:'#000', offset:{0,-10}, opacity:0.1, radius:15 }
```
