# FlowSplit Design Implementation Plan

## Overview
Complete implementation plan based on 6 exported design screens with full specifications.

---

## Design Tokens (from exports)

### Colors
```typescript
const Colors = {
  // Primary
  primary: '#0EA5A5',           // Teal accent
  primaryHover: '#0C8F8F',      // Darker teal
  primaryLight: 'rgba(14, 165, 165, 0.1)', // Teal/10

  // Background
  background: '#F8F8F8',        // Off-white page bg
  card: '#FFFFFF',              // White cards
  cardMuted: 'rgba(249, 250, 251, 0.5)', // gray-50/50

  // Text
  textPrimary: '#111827',       // gray-900
  textSecondary: '#374151',     // gray-700
  textMuted: '#9CA3AF',         // gray-400
  textLight: '#D1D5DB',         // gray-300

  // Bucket Colors
  bucketTeal: '#0EA5A5',
  bucketBlue: '#3B82F6',
  bucketGreen: '#10B981',
  bucketGray: '#E5E7EB',

  // Borders
  border: 'rgba(0, 0, 0, 0.04)',
  borderLight: '#F3F4F6',       // gray-100
};
```

### Typography
```typescript
const Typography = {
  // Font: Satoshi from Fontshare
  fontFamily: 'Satoshi',

  // Sizes (from designs)
  amount: { size: 40, weight: '900' },      // Large $ amounts
  h1: { size: 24, weight: '900' },          // Page titles
  h2: { size: 18, weight: '700' },          // Header title
  h3: { size: 17, weight: '900' },          // Section headers
  body: { size: 14, weight: '700' },        // Card titles
  bodyMedium: { size: 14, weight: '500' },  // Body text
  label: { size: 12, weight: '700' },       // Labels
  caption: { size: 11, weight: '700' },     // Uppercase labels
  tiny: { size: 10, weight: '700' },        // Smallest labels
};
```

### Spacing & Radius
```typescript
const Spacing = {
  page: 20,        // p-5 (main padding)
  section: 24,     // space-y-6
  card: 24,        // p-6
  cardSmall: 16,   // p-4
  item: 12,        // gap-3
};

const BorderRadius = {
  card: 32,        // rounded-[32px]
  cardMedium: 24,  // rounded-[24px]
  button: 16,      // rounded-2xl
  item: 16,        // rounded-2xl
  icon: 16,        // rounded-2xl
  full: 9999,      // rounded-full
};

const Shadows = {
  card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
  cardLarge: '0 10px 30px -5px rgba(0, 0, 0, 0.04)',
  button: '0 10px 20px -5px rgba(14, 165, 165, 0.4)',
  bottomBar: '0 -10px 30px -15px rgba(0, 0, 0, 0.1)',
};
```

---

## Screen Specifications

### Screen 1: Deposit Setup
**Route:** `/deposit/setup`

**Layout:**
```
┌─────────────────────────────┐
│ [←] FlowSplit         [☰]  │ Header (64px, sticky)
├─────────────────────────────┤
│ ← New Split                 │ Back nav
│                             │
│      Deposit Amount         │ Label (gray-400, uppercase)
│      $ 1,200|               │ Amount input (60px, black, cursor blink)
│   What's arriving today?    │ Helper text
│                             │
│ SOURCE ACCOUNT              │ Section label
│ ┌─────────────────────────┐│
│ │ [Chase] Chase Checking  ✓││ Selected (teal border)
│ │ Main Hub • 4821          ││
│ └─────────────────────────┘│
│ ┌─────────────────────────┐│
│ │ [Venmo] Venmo Balance  ○ ││ Unselected
│ └─────────────────────────┘│
│ ┌ - - - - - - - - - - - - ┐│
│ │ [+] Connect new source  ││ Dashed add button
│ └ - - - - - - - - - - - - ┘│
│                             │
│ ┌─────────────────────────┐│
│ │   Continue to Split  →  ││ Primary button (teal, shadow)
│ └─────────────────────────┘│
│ FlowSplit will analyze...   │ Footer text
└─────────────────────────────┘
```

**Components:**
- `AmountInput` - Large amount display with cursor blink animation
- `AccountSelector` - Radio-style bank account cards
- `AddAccountButton` - Dashed border button

---

### Screen 2: Split Allocation (Interactive Donut)
**Route:** `/deposit/[id]/allocate`

**Layout:**
```
┌─────────────────────────────┐
│ [←]    FlowSplit      [⚙]  │ Header
├─────────────────────────────┤
│  ┌─────────────────────┐    │
│  │    ╭───────────╮    │    │ Donut Chart Card
│  │   ╱    10%      ╲   │    │ (rounded-[32px])
│  │  │  Split Plan   │  │    │
│  │  │   $1,200      │  │    │ Center text
│  │  │ Drag to adjust│  │    │
│  │   ╲   15%  10%  ╱   │    │
│  │    ╰───────────╯    │    │
│  │      [○] [○] [○]    │    │ Drag handles
│  │                     │    │
│  │ ● Tithe    10% $120 │    │ Bucket list
│  │ ● Savings  15% $180 │    │
│  │ ● Investing 10% $120│    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │ Remainder card
│  │ [🏦] Main Wallet    │    │
│  │ Checking Remainder  │    │
│  │          65% $780   │    │
│  └─────────────────────┘    │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │ Fixed bottom
│ │  Confirm $1,200 Split   │ │
│ └─────────────────────────┘ │
│   KEEP EVERYTHING IN CHECK  │
│   [Split] [Buckets] [History]│ Tab bar
└─────────────────────────────┘
```

**Key Features:**
- SVG donut chart with 4 segments (Teal, Blue, Green, Gray)
- Draggable handles at segment boundaries
- Real-time percentage/amount updates
- Segment colors: `#0EA5A5`, `#3B82F6`, `#10B981`, `#E5E7EB`

**Donut Chart Specs:**
- Viewbox: 100x100
- Center: (50, 50)
- Radius: 40
- Stroke width: 12 (hover: 14)
- Handle radius: 4.5

---

### Screen 3: Direct Interaction Donut (Variant)
**Route:** `/deposit/[id]/split` (alternative view)

Similar to Screen 2 but with:
- Larger chart container (280px vs 260px)
- Different card styling (rounded-2xl vs rounded-[32px])
- Tab navigation at bottom

---

### Screen 4: Bucket Configuration
**Route:** `/buckets/configure`

**Layout:**
```
┌─────────────────────────────┐
│ [←]    FlowSplit      [☰]  │ Header
├─────────────────────────────┤
│ Configure                   │
│ Destination Buckets         │ Title (24px, black)
│ Review where each split...  │ Subtitle
│                             │
│ ┌─────────────────────────┐ │
│ │ [♥] Tithe              •••│ │ Bucket card
│ │ 10% Allocation           │ │
│ │ ┌───────────────────────┐│ │
│ │ │ ↗ Giving.com/Faith  > ││ │ Destination row
│ │ └───────────────────────┘│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [🐷] Savings           •••│ │
│ │ 15% Allocation           │ │
│ │ ┌───────────────────────┐│ │
│ │ │ 🏦 Ally Bank ••9928 > ││ │
│ │ └───────────────────────┘│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [📈] Investing         •••│ │
│ │ 10% Allocation           │ │
│ │ ┌───────────────────────┐│ │
│ │ │ 💼 Wealthfront ••1104>││ │
│ │ └───────────────────────┘│ │
│ └─────────────────────────┘ │
│                             │
│ ┌ - - - - - - - - - - - - ┐ │
│ │    [+] Add New Bucket   │ │ Dashed add button
│ └ - - - - - - - - - - - - ┘ │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Continue to Confirmation│ │
│ └─────────────────────────┘ │
│  Changes apply to $1,200    │
└─────────────────────────────┘
```

**Components:**
- `BucketConfigCard` - Expandable bucket with destination info
- Icon backgrounds: teal/10, blue/10, green/10
- More menu (3 dots)

---

### Screen 5: Confirmation
**Route:** `/deposit/[id]/confirm`

**Layout:**
```
┌─────────────────────────────┐
│ [←]    FlowSplit      [☰]  │ Header
├─────────────────────────────┤
│ Review Split                │ Title
│ Confirm the distribution    │ Subtitle
│                             │
│ ┌─────────────────────────┐ │ Deposit card (rounded-[32px])
│ │ [↓] Incoming Deposit    │ │
│ │     $1,200.00           │ │
│ │ ─────────────────────── │ │
│ │ 🏦 Chase ••4920  MAY 24 │ │
│ └─────────────────────────┘ │
│                             │
│ DISTRIBUTION                │ Section label
│ ┌─────────────────────────┐ │
│ │ ● Tithe           $120  │ │ Distribution cards
│ │   Transfer to Better... │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ● Savings         $180  │ │
│ │   High-Yield ••0122     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ● Investing       $120  │ │
│ │   Vanguard ••8829       │ │
│ └─────────────────────────┘ │
│ ┌ - - - - - - - - - - - - ┐ │ Dashed remainder
│ │ ● Remainder       $780  │ │
│ │   Stay in Chase         │ │
│ └ - - - - - - - - - - - - ┘ │
│                             │
│ ┌─────────────────────────┐ │ Details card
│ │ Execution      Instant  │ │
│ │ Service Fees     $0.00  │ │
│ │ ─────────────────────── │ │
│ │ Total Allocated $1,200  │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │  Confirm & Distribute   │ │
│ └─────────────────────────┘ │
│   Back to adjustments       │
└─────────────────────────────┘
```

---

### Screen 6: Split Complete
**Route:** `/deposit/[id]/complete`

**Layout:**
```
┌─────────────────────────────┐
│        FlowSplit      [☰]  │ Header (no back)
├─────────────────────────────┤
│                             │
│         ╭─────╮             │ Success icon
│        ╱  ✓   ╲             │ (teal bg, white check)
│        ╲       ╱             │
│         ╰─────╯             │
│                             │
│      Split Complete         │ Title (24px)
│  Your deposit of $1,200.00  │ Subtitle
│  has been allocated...      │
│                             │
│ ┌─────────────────────────┐ │ Summary card (rounded-[32px])
│ │ ALLOCATION SUMMARY      │ │
│ │ ● Tithe          $120   │ │
│ │ ● Savings        $180   │ │
│ │ ● Investing      $120   │ │
│ │ ─────────────────────── │ │
│ │ Remaining in Check $780 │ │
│ └─────────────────────────┘ │
│                             │
│      Manage Buckets         │ Secondary link
│                             │
│ ┌─────────────────────────┐ │
│ │  Return to Dashboard    │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## Component Library

### 1. Header
```tsx
<Header
  title="FlowSplit"
  showBack={boolean}
  onBack={() => void}
  rightIcon="menu" | "settings"
/>
```
- Height: 64px
- Sticky top
- Border bottom: gray-100

### 2. BottomActionBar
```tsx
<BottomActionBar>
  <PrimaryButton>Confirm</PrimaryButton>
  <SecondaryLink>Back</SecondaryLink>
  <TabBar /> // optional
</BottomActionBar>
```
- Fixed bottom
- Backdrop blur
- Shadow: `0 -10px 30px -15px rgba(0,0,0,0.1)`
- Safe area padding: 34px bottom

### 3. PrimaryButton
```tsx
<PrimaryButton
  onPress={() => void}
  disabled={boolean}
>
  Confirm $1,200 Split
</PrimaryButton>
```
- Background: #0EA5A5
- Hover: #0C8F8F
- Text: white, bold
- Height: 56px (py-4)
- Border radius: 16px
- Shadow: teal glow
- Active: scale(0.98)

### 4. Card
```tsx
<Card variant="default" | "large" | "muted">
  {children}
</Card>
```
- Default: rounded-2xl (16px)
- Large: rounded-[32px]
- Padding: 24px
- Border: rgba(0,0,0,0.04)
- Shadow: card shadow

### 5. DonutChart
```tsx
<DonutChart
  total={1200}
  segments={[
    { id: 'tithe', percentage: 10, color: '#0EA5A5' },
    { id: 'savings', percentage: 15, color: '#3B82F6' },
    { id: 'investing', percentage: 10, color: '#10B981' },
  ]}
  onSegmentChange={(segments) => void}
/>
```
- SVG-based
- Draggable handles
- Touch gesture support
- Real-time updates

### 6. BucketCard
```tsx
<BucketCard
  name="Tithe"
  percentage={10}
  amount={120}
  color="#0EA5A5"
  destination="Giving.com"
/>
```

### 7. AmountDisplay
```tsx
<AmountDisplay
  amount={1200}
  size="large" | "medium" | "small"
  editable={boolean}
/>
```

---

## Navigation Flow

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Dashboard ──→ Pending Card ──→ Deposit Setup       │
│                                       │              │
│                                       ▼              │
│                              Split Allocation        │
│                               (Donut Chart)          │
│                                   │    │             │
│                          Adjust ◄─┘    └─► Confirm   │
│                                              │       │
│                                              ▼       │
│                          Dashboard ◄── Complete      │
│                                                      │
│  Settings ──→ Bucket Configuration ──→ Back         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Files to Create)
```
mobile/
├── constants/
│   ├── theme.ts          # Colors, typography, spacing
│   └── index.ts          # Export all
├── components/
│   ├── Button.tsx        # Primary, Secondary, Ghost
│   ├── Card.tsx          # Card variants
│   ├── Header.tsx        # App header
│   ├── BottomActionBar.tsx
│   └── index.ts
└── assets/
    └── fonts/
        └── Satoshi-*.otf
```

### Phase 2: Core Components
```
mobile/components/
├── AmountInput.tsx       # Deposit amount entry
├── AccountSelector.tsx   # Bank account picker
├── BucketCard.tsx        # Bucket display card
├── BucketConfigCard.tsx  # Bucket config with destination
├── DistributionItem.tsx  # Confirmation list item
├── DonutChart/
│   ├── index.tsx         # Main component
│   ├── Segment.tsx       # Arc segment
│   ├── Handle.tsx        # Drag handle
│   └── hooks.ts          # useDragGesture
└── SuccessIcon.tsx       # Animated checkmark
```

### Phase 3: Screens
```
mobile/app/
├── deposit/
│   ├── setup.tsx         # Screen 2: Deposit Setup
│   └── [id]/
│       ├── allocate.tsx  # Screen 1/3: Donut Splitter
│       ├── confirm.tsx   # Screen 5: Confirmation
│       └── complete.tsx  # Screen 6: Success
└── buckets/
    └── configure.tsx     # Screen 4: Bucket Config
```

### Phase 4: State & Hooks
```
mobile/hooks/
├── useDonutChart.ts      # Donut drag state
├── useSplitFlow.ts       # Flow navigation state
└── useAllocation.ts      # Calculate splits
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "react-native-svg": "^15.0.0",
    "react-native-gesture-handler": "~2.20.0",
    "expo-font": "~13.0.0",
    "react-native-reanimated": "~3.16.0"
  }
}
```

---

## Animation Specs

### View Transitions
- Fade out: 0.25s ease-out
- Fade in: 0.25s ease-in, 0.1s delay

### Button Press
- Scale: 0.98 on active
- Duration: instant

### Donut Handle Drag
- Scale on grab: 1.4
- Transition: `cubic-bezier(0.175, 0.885, 0.32, 1.275)`

### Success Icon
- Entry: scale up + fade in
- Checkmark: draw animation

---

## State Variants

All screens need to handle multiple states. Below are specifications extracted from the 11 state variant design files.

### Loading States

#### Split Allocation - Loading State
**Shows while fetching allocation data**

```
┌─────────────────────────────────────┐
│     ╭───────────────╮              │  Skeleton donut
│    ╱   ░░░░░░░░░░░   ╲             │  (gray-200 stroke)
│   │   Split Plan      │             │
│   │    $1,200         │             │  Static center
│   │ Calculating...    │             │
│    ╲   ░░░░░░░░░░░   ╱             │
│     ╰───────────────╯              │
│                                     │
│  ┌──────────────────────────────┐  │  Skeleton bucket cards
│  │ ░░░░░░░░░░░ shimmer         │  │  (animate-pulse)
│  │ ░░░░░░░░                     │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ ░░░░░░░░░░░ shimmer         │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Implementation:**
- Donut: Single gray-200 circle with shimmer
- Center: "Calculating..." text
- Cards: 3 skeleton cards with `animate-pulse`
- Shimmer gradient: `linear-gradient(90deg, transparent, white/40, transparent)`
- Animation: `@keyframes shimmer` - translateX(-100% → 100%)

---

#### Bucket Configuration - Loading State
**Shows while fetching bucket data**

```
┌─────────────────────────────────────┐
│ Configure                           │
│ Destination Buckets                 │
│ ░░░░░░░░░░░░░░░░░░░░░              │ Skeleton subtitle
│                                     │
│ ┌─────────────────────────────────┐│
│ │ ░░░░ Skeleton Icon    shimmer  ││ Skeleton card
│ │ ░░░░░░░░░░░░░░░░              ││
│ │ ┌───────────────────────────┐  ││
│ │ │ ░░░░░░░░░░░░░░░ shimmer  │  ││ Skeleton destination
│ │ └───────────────────────────┘  ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ ░░░░ Skeleton Icon    shimmer  ││
│ │ ░░░░░░░░░░░░░░░░              ││
│ │ ┌───────────────────────────┐  ││
│ │ │ ░░░░░░░░░░░░░░░ shimmer  │  ││
│ │ └───────────────────────────┘  ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Implementation:**
- Cards: `bg-gray-100` base with `overflow-hidden`
- Icon skeleton: `w-12 h-12 bg-gray-200 rounded-2xl`
- Text skeleton: `h-4 w-24 bg-gray-200 rounded`
- Shimmer overlay: `absolute inset-0` with gradient animation
- Skeleton destination row: `bg-gray-50 rounded-xl h-12`

---

#### Confirmation - Loading State
**Shows while preparing confirmation data**

```
┌─────────────────────────────────────┐
│ Review Split                        │
│ ░░░░░░░░░░░░░░░░░░░░              │ Skeleton subtitle
│                                     │
│ ┌─────────────────────────────────┐│ Skeleton deposit card
│ │ ░░░░ Icon    ░░░░░░░░░░░░░    ││
│ │              ░░░░░░░░░░░░░    ││
│ │ ─────────────────────────────  ││
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░   ││
│ └─────────────────────────────────┘│
│                                     │
│ DISTRIBUTION                        │
│ ┌─────────────────────────────────┐│
│ │ ● ░░░░░░   shimmer    ░░░░░░  ││
│ │   ░░░░░░░░░░░░░░░░            ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ ● ░░░░░░   shimmer    ░░░░░░  ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Implementation:**
- Distribution items: 4 skeleton cards
- Each with color dot (static gray-200) + shimmer text
- Details card: skeleton rows
- Button: disabled state with `bg-teal-accent/40`

---

### Empty States

#### Bucket Configuration - Empty State
**Shows when user has no buckets configured**

```
┌─────────────────────────────────────┐
│ Configure                           │
│ Destination Buckets                 │
│ Create your first bucket...         │
│                                     │
│          ┌─────────────┐           │
│          │             │           │  Empty illustration
│          │    [🪣]     │           │  (layers icon)
│          │             │           │
│          │ No Buckets  │           │
│          │   Yet       │           │
│          │             │           │
│          │ Create your │           │
│          │ first bucket│           │
│          │ to start... │           │
│          │             │           │
│          │ [Create Bucket]│        │  Primary CTA (teal)
│          │             │           │
│          └─────────────┘           │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**
- Container: `flex flex-col items-center justify-center min-h-[400px]`
- Icon: `lucide:layers` in gray-300, 64px
- Title: "No Buckets Yet" - 20px, font-black, gray-900
- Description: gray-400, text-center, max-w-[200px]
- CTA Button: Primary teal with shadow
- Bottom bar: Disabled button with note "Create at least one bucket to continue"

---

### Error States

#### Bucket Configuration - Error State
**Shows when a bucket has a connection issue**

```
┌─────────────────────────────────────┐
│ Configure                           │
│ Destination Buckets                 │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [♥] Tithe              •••     ││  Normal bucket
│ │ 10% Allocation                 ││
│ │ ┌───────────────────────────┐  ││
│ │ │ ↗ Giving.com/Faith  >    │  ││
│ │ └───────────────────────────┘  ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│  Error bucket
│ │ ⚠ Connection Issue            ││  Red banner at top
│ │ Reconnect needed for Ally     ││
│ │ ──────────────────────────────││
│ │ [🐷] Savings           •••     ││
│ │ 15% Allocation                 ││
│ │ ┌───────────────────────────┐  ││
│ │ │ 🏦 Ally Bank ••9928  ⚠  >│  ││  Error indicator
│ │ │    Reconnect required    │  ││  Error text
│ │ └───────────────────────────┘  ││
│ │ [Reconnect Ally Bank]         ││  Inline CTA
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Implementation:**
- Error banner: `bg-red-50 border-b border-red-100`
- Banner icon: `lucide:alert-triangle` in red-500
- Banner text: "Connection Issue" red-700, "Reconnect needed..." red-600
- Destination row: `ring-1 ring-red-200 bg-red-50/50`
- Error indicator: `lucide:alert-circle` in red-500
- Reconnect CTA: `bg-red-500 hover:bg-red-600` full-width button
- Rest of card: Normal styling

---

#### Confirmation - Error State
**Shows when a destination account has issues**

```
┌─────────────────────────────────────┐
│ Review Split                        │
│ Confirm the distribution            │
│                                     │
│ [Incoming Deposit Card - Normal]    │
│                                     │
│ DISTRIBUTION                        │
│ ┌─────────────────────────────────┐│
│ │ ● Tithe           $120.00      ││  Normal
│ │   Transfer to Better...        ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│  Error item
│ │ ⚠ Account Unavailable          ││  Red banner
│ │ Ally Savings needs attention   ││
│ │ ────────────────────────────── ││
│ │ ● Savings          $180.00     ││
│ │   High-Yield ••0122            ││
│ │                                ││
│ │ [Resolve Issue]                ││  Red CTA button
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ ● Investing        $120.00     ││  Normal
│ └─────────────────────────────────┘│
├─────────────────────────────────────┤
│ [Confirm & Distribute] (Disabled)   │  Gray, cursor-not-allowed
│ Resolve issues to continue          │
└─────────────────────────────────────┘
```

**Implementation:**
- Error card: `bg-white` with red banner at top
- Banner: `bg-red-50 border-b border-red-100`
- Icon: `lucide:alert-triangle` in red-500
- Resolve button: `bg-red-500 text-white py-3 rounded-xl`
- Bottom button: `bg-gray-200 text-gray-400 cursor-not-allowed`
- Helper text: "Resolve all issues to continue"

---

#### Confirmation - Network Error State (Modal)
**Shows as overlay when network fails during confirmation**

```
┌─────────────────────────────────────┐
│                                     │
│   [Review Split screen dimmed]      │
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │  Modal (white card)
│   │        ╭─────────╮          │   │
│   │       ╱    ⚠     ╲          │   │  Error icon
│   │       ╲   Red    ╱          │   │  (red-50 bg, red-500 icon)
│   │        ╰─────────╯          │   │
│   │                             │   │
│   │    Connection Error         │   │  Title
│   │                             │   │
│   │  We couldn't complete your  │   │  Description
│   │  request. Please check your │   │
│   │  internet connection and    │   │
│   │  try again.                 │   │
│   │                             │   │
│   │  ┌───────────────────────┐  │   │
│   │  │     Try Again         │  │   │  Primary CTA
│   │  └───────────────────────┘  │   │
│   │                             │   │
│   │       Cancel Request        │   │  Secondary link
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**
- Overlay: `fixed inset-0 bg-black/40 backdrop-blur-sm`
- Modal: `bg-white rounded-[32px] p-8 m-6 shadow-xl`
- Icon container: `w-20 h-20 bg-red-50 rounded-full`
- Icon: `lucide:wifi-off` in red-500, text-4xl
- Title: "Connection Error" - 22px, font-black
- Description: gray-500, text-center
- Try Again: Primary teal button
- Cancel: gray-400 text link

---

### Validation States

#### Deposit Setup - Validation Error State
**Shows when amount is invalid**

```
┌─────────────────────────────────────┐
│ ← New Split                         │
│                                     │
│      Deposit Amount                 │
│      $ 0|                           │  Red amount text
│                                     │
│   ⚠ Enter an amount greater than $0│  Error message
│                                     │  (red-500, centered)
│                                     │
│ SOURCE ACCOUNT                      │
│ [Account cards...]                  │
│                                     │
├─────────────────────────────────────┤
│ [Continue to Split] (Disabled)      │  Gray disabled state
│ FlowSplit will analyze...           │
└─────────────────────────────────────┘
```

**Implementation:**
- Amount text: `text-red-500` instead of gray-900
- Cursor: Still blinks but `text-red-500`
- Error message: `text-red-500 text-sm font-medium flex items-center gap-2`
- Error icon: `lucide:alert-circle`
- Button: `bg-gray-200 text-gray-400 cursor-not-allowed shadow-none`
- Button disabled: `pointer-events-none`

---

### Partial/Mixed States

#### Split Complete - Partial Success State
**Shows when some transfers succeeded but others failed or are pending**

```
┌─────────────────────────────────────┐
│        ╭─────────╮                  │
│       ╱   ⚠      ╲                  │  Amber icon
│       ╲  Amber   ╱                  │  (partial success)
│        ╰─────────╯                  │
│                                     │
│      Partially Complete             │  Title
│  Some transfers need attention      │  Subtitle
│                                     │
│ ┌─────────────────────────────────┐│
│ │ ALLOCATION SUMMARY              ││
│ │ ✓ Tithe         $120   Success ││  Green check
│ │ ✗ Savings       $180   Failed  ││  Red X + retry
│ │   [Retry Transfer]              ││
│ │ ◐ Investing     $120   Pending ││  Amber spinner
│ │ ────────────────────────────── ││
│ │ Remaining in Checking    $780  ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │     Retry Failed Transfers     ││  Amber button
│ └─────────────────────────────────┘│
│       Return to Dashboard           │
└─────────────────────────────────────┘
```

**Implementation:**
- Hero icon: `bg-amber-50` outer, `bg-amber-500` inner
- Icon: `lucide:alert-triangle` white
- Success item: `bg-teal-50/50` with `lucide:check-circle` teal-500
- Failed item: `bg-red-50/50 ring-1 ring-red-100` with `lucide:x-circle` red-500
- Retry inline: `text-red-600 text-xs font-bold underline`
- Pending item: `bg-amber-50/50` with `lucide:loader-2 animate-spin` amber-500
- Primary button: `bg-amber-500 hover:bg-amber-600`
- Status badges: uppercase, tracking-tighter, 10px

---

#### Split Complete - Pending Manual Action State
**Shows when external manual action is required (e.g., Pushpay)**

```
┌─────────────────────────────────────┐
│        ╭─────────╮                  │
│       ╱   ✓      ╲                  │  Teal success icon
│       ╲   Teal   ╱                  │
│        ╰─────────╯                  │
│                                     │
│       Split Complete                │
│   Your deposit has been allocated   │
│                                     │
│ ┌─────────────────────────────────┐│  Amber action card
│ │ [↗] Action Pending             ││  (bg-amber-50)
│ │ You need to complete the       ││
│ │ Pushpay transfer.              ││
│ │                                ││
│ │ ┌───────────────────────────┐  ││
│ │ │   Open Pushpay Link  →   │  ││  Dark button
│ │ └───────────────────────────┘  ││
│ │                                ││
│ │ Or copy link manually          ││
│ │ ┌───────────────────────────┐  ││
│ │ │ pushpay.com/g/flow... 📋 │  ││  Copy field
│ │ └───────────────────────────┘  ││
│ │                                ││
│ │ ⏱ Complete within 24 hours    ││  Timer note
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ ALLOCATION SUMMARY              ││
│ │ ◐ Tithe     $120  Manual Pend  ││  Amber dot
│ │ ✓ Savings   $180  Auto-Complete││  Teal dot
│ │ ✓ Investing $120  Auto-Complete││  Teal dot
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Implementation:**
- Action card: `bg-amber-50 border border-amber-200 rounded-[32px]`
- Action icon: `bg-amber-100` with `lucide:external-link` amber-600
- Open link button: `bg-gray-900 hover:bg-black` with chevron
- Copy field: `bg-white/60 border border-amber-100 rounded-2xl`
- Copy icon: `lucide:copy` amber-600
- Timer note: `border-t border-amber-200/50` with clock icon
- Manual pending item: `bg-amber-50/50 ring-1 ring-amber-100`
- Status: "Manual Transfer Pending" - amber-600

---

#### Split Processing - Retry State
**Shows during automatic retry of failed transfer**

```
┌─────────────────────────────────────┐
│        ╭─────────╮                  │
│       ╱   ↻      ╲                  │  Amber spinner
│       ╲  Spin    ╱                  │  (animate-spin)
│        ╰─────────╯                  │
│                                     │
│     Processing Split...             │  Title
│ ┌─────────────────────────────────┐│
│ │ ⚠ Retrying transfer to         ││  Amber alert box
│ │   Investing account in 3 sec...││
│ └─────────────────────────────────┘│
│ Connection issues detected...       │  Gray helper text
│                                     │
│ ┌─────────────────────────────────┐│
│ │ ALLOCATION SUMMARY              ││
│ │ ● Tithe         $120           ││  Normal (complete)
│ │ ● Savings       $180           ││  Normal (complete)
│ │ ◌ Investing     $120  Retrying ││  Amber spinner + text
│ │ ────────────────────────────── ││
│ │ Remaining in Checking    $780  ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │  Return to Dashboard (Disabled)││  Disabled teal
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Implementation:**
- Hero icon: `bg-amber-50` outer, `bg-amber-500` inner
- Spinner icon: `lucide:refresh-cw animate-spin` white
- Alert box: `bg-amber-50 border border-amber-100/50 rounded-2xl py-3`
- Alert icon: `lucide:alert-circle` amber-600
- Alert text: "Retrying transfer..." amber-600 font-bold
- Retrying item: `bg-amber-50/50 ring-1 ring-amber-100/50`
- Item spinner: `lucide:loader-2 animate-spin` amber-500
- Status text: "Retrying..." amber-600, uppercase
- Disabled button: `bg-teal-accent/40 cursor-not-allowed pointer-events-none`

---

## State Component Patterns

### Skeleton Component
```tsx
<Skeleton
  width={number | "full"}
  height={number}
  variant="text" | "circular" | "rectangular"
  animation="pulse" | "shimmer"
/>
```

### ErrorBanner Component
```tsx
<ErrorBanner
  icon="alert-triangle" | "wifi-off"
  title="Connection Issue"
  description="Reconnect needed for Ally"
  action={{ label: "Reconnect", onPress: () => {} }}
/>
```

### StatusBadge Component
```tsx
<StatusBadge
  status="success" | "failed" | "pending" | "retrying" | "manual"
  label="Auto-Completed"
/>
```

### ErrorModal Component
```tsx
<ErrorModal
  visible={boolean}
  icon="wifi-off"
  title="Connection Error"
  description="We couldn't complete your request..."
  primaryAction={{ label: "Try Again", onPress: () => {} }}
  secondaryAction={{ label: "Cancel", onPress: () => {} }}
/>
```

---

## File Checklist

### Constants
- [x] `constants/colors.ts` - Colors (split from theme.ts)
- [x] `constants/typography.ts` - Font families, sizes, letter spacing
- [x] `constants/spacing.ts` - Spacing, border radius, sizes
- [x] `constants/shadows.ts` - Shadow definitions
- [x] `constants/animations.ts` - Shimmer/pulse animations
- [x] `constants/index.ts` - Exports

### Components
- [x] `components/Button.tsx`
- [x] `components/Card.tsx`
- [x] `components/Header.tsx`
- [x] `components/BottomActionBar.tsx`
- [x] `components/AmountInput.tsx`
- [x] `components/AmountDisplay.tsx`
- [x] `components/AccountSelector.tsx`
- [x] `components/AccountCard.tsx`
- [x] `components/BucketCard.tsx`
- [x] `components/BucketConfigCard.tsx`
- [x] `components/DistributionItem.tsx`
- [x] `components/DonutChart/index.tsx`
- [x] `components/DonutChart/DonutSegment.tsx`
- [x] `components/DonutChart/DonutHandle.tsx`
- [x] `components/DonutChart/useDonutChart.ts`
- [x] `components/DonutChart/types.ts`
- [x] `components/FloatingActionButton.tsx`
- [x] `components/AddDepositModal.tsx`
- [x] `components/AddBucketButton.tsx`
- [x] `components/RemainderCard.tsx`
- [x] `components/SectionLabel.tsx`
- [x] `components/StatusIcons.tsx`
- [x] `components/TabBar.tsx`
- [ ] `components/SuccessIcon.tsx` - Using Ionicons checkmark instead

### State Components
- [x] `components/Skeleton.tsx`
- [x] `components/ErrorBanner.tsx`
- [x] `components/StatusBadge.tsx`
- [x] `components/ErrorModal.tsx`
- [x] `components/EmptyState.tsx`
- [x] `components/ActionCard.tsx` (for manual action prompts)

### Screens
- [x] `app/(tabs)/index.tsx` - Dashboard with FAB + pending splits
- [x] `app/(tabs)/buckets.tsx` - Buckets tab
- [x] `app/(tabs)/history.tsx` - Split history/ledger
- [x] `app/(tabs)/settings.tsx` - Settings
- [x] `app/(auth)/login.tsx` - Login
- [x] `app/(auth)/register.tsx` - Register
- [x] `app/deposit/setup.tsx` - Deposit setup
- [x] `app/deposit/[id]/allocate.tsx` - Donut splitter
- [x] `app/deposit/[id]/confirm.tsx` - Confirmation
- [x] `app/deposit/[id]/complete.tsx` - Success
- [x] `app/deposit/[id]/processing.tsx` - Processing/retry
- [x] `app/buckets/configure.tsx` - Bucket configuration (uses real useBuckets() data; delivery method modal; "Add Bucket" navigates to new.tsx)
- [x] `app/buckets/new.tsx` - Bucket creation screen (name, color picker, allocation rule, delivery method; External Link shows Display Name + URL Template fields with `{{amount}}` hint; POST + PATCH on save with external_name/external_url)
- [x] `app/buckets/[id].tsx` - Edit bucket screen (same fields as new.tsx; URL Template field has `{{amount}}` helper text)
- [x] `backend/services/transfer.py` - `generate_external_link` supports `{{amount}}` template replacement; falls back to appending `?a={amount}` for legacy URLs
- [x] `app/deposit/[id]/allocate.tsx` - Swipe-to-remove on allocation rows; Add Bucket bottom sheet
- [x] `app/split-plan/[id].tsx` - Split plan detail

### Hooks
- [x] `hooks/useBuckets.ts`
- [x] `hooks/useBucketMutations.ts`
- [x] `hooks/useDeposit.ts`
- [x] `hooks/useDeposits.ts`
- [x] `hooks/useDepositMutations.ts`
- [x] `hooks/useSplitPlan.ts`
- [x] `hooks/useSplitFlow.ts`
- [x] `hooks/useSplitExecution.ts`
- [x] `hooks/useUser.ts`
- [x] `hooks/index.ts`

---

## Implementation Status

### Phase 1: Design Tokens & Theme - COMPLETE
- [x] Colors, typography, spacing, shadows, animations constants

### Phase 2: Base Components - COMPLETE
- [x] Button, Card, Header, BottomActionBar, SectionLabel, TabBar

### Phase 3: State Components - COMPLETE
- [x] Skeleton, ErrorBanner, StatusBadge, ErrorModal, EmptyState, ActionCard

### Phase 4: Feature Components - COMPLETE
- [x] DonutChart (with segments, handles, drag gesture)
- [x] AmountInput, AmountDisplay, AccountSelector
- [x] BucketCard, BucketConfigCard, DistributionItem
- [x] FloatingActionButton, AddDepositModal, RemainderCard

### Phase 5: Screens (Happy Path) - COMPLETE
- [x] Dashboard, Deposit Setup, Split Allocation, Confirmation, Complete, Processing
- [x] Bucket Configuration, Split History, Auth screens
- [x] Bucket Creation (`buckets/new.tsx`) — name, color picker, allocation rule, delivery method

### Phase 6: State Integration - COMPLETE
- [x] Loading states (Skeleton component exists)
- [x] Error states (ErrorBanner, ErrorModal exist)
- [x] Empty states (EmptyState component exists)
- [x] Wire loading/error/empty states into all screens
- [x] Partial success variant on complete screen
- [x] Manual action variant on complete screen
- [x] Retry animation on processing screen

### Outstanding Issues
- [x] DonutChart drag handles crash on interaction - FIXED
- [x] DonutChart circular rendering - FIXED
- [x] Backend business logic (allocation service, split execution, notifications)
- [x] Bucket configure screen wired to real API (no more mock data)
- [x] BucketConfigCard shows "Set delivery method" row when destination_type is null
- [x] Delivery method modal on configure screen (Internal Transfer / External Link)
- [x] Swipe-to-remove + Add Bucket sheet on allocate screen
- [ ] Backend API integration (allocate/confirm screens use mock data for fallback)
- [ ] Split history screen needs real data
- [ ] Bucket edit screen (currently only create; ⋯ menu on BucketConfigCard is TODO)

---

**Next step:** Wire state variants into screens, then backend API integration.
