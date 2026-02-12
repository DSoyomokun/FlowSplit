# FlowSplit Design System

## Color Palette
- **Primary Accent**: #0EA5A5 (Teal) — Used for CTAs, highlights, and primary interactive elements
- **Background**: #F8F8F8 (Off-white) — Main page background
- **Card Background**: #FFFFFF (White) — Card and container backgrounds
- **Text Primary**: #1F2937 (Dark Gray) — Headings and primary text
- **Text Secondary**: #6B7280 (Gray) — Body text and descriptions
- **Text Muted**: #9CA3AF (Light Gray) — Secondary labels and metadata
- **Border**: rgba(0, 0, 0, 0.04) — Subtle borders
- **Hover Accent**: #0C8F8F (Darker Teal) — Button hover state

## Typography
- **Font Family**: Satoshi (from Fontshare)
  - Headings: Bold/900 weight
  - Body: 400/500 weight
  - Labels: 600 weight
- **Type Hierarchy**:
  - H1 (Amount): 40px, Bold, Dark Gray
  - H2 (Section headers): 16px, Bold, Dark Gray
  - H3 (Card titles): 14px, Bold, Dark Gray
  - Body: 14px, Regular, Secondary Gray
  - Labels: 12px, Semibold, Muted Gray
  - Captions: 11px/10px, Regular, Light Gray

## Spacing & Layout
- **Container**: Max-width 375px (mobile)
- **Padding**: 6px (1.5rem) for main sections
- **Card Padding**: 4px (1rem) - 6px (1.5rem)
- **Gap between sections**: 6px (1.5rem)
- **Border Radius**: 2xl (16px) for cards, xl (12px) for smaller elements, lg (8px) for icons
- **Box Shadow**: `0 4px 20px -2px rgba(0, 0, 0, 0.05)` (subtle, refined)

## Reusable Components

### Header Navigation
```html
<header class="w-full max-w-[375px] h-[64px] px-6 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-50">
  <div class="w-8"></div>
  <h1 class="text-[18px] font-bold tracking-tight text-gray-900">FlowSplit</h1>
  <button id="nav-menu-btn" class="w-8 h-8 flex items-center justify-end text-gray-600">
    <iconify-icon icon="lucide:menu" class="text-2xl"></iconify-icon>
  </button>
</header>
```

### Status Badge (Amber)
```html
<div class="flex justify-center">
  <span class="px-3 py-1 bg-amber-50 text-amber-600 text-[12px] font-semibold tracking-wide rounded-full border border-amber-100 uppercase">
    Pending Confirmation
  </span>
</div>
```

### Deposit Card (Centered Layout)
```html
<section class="bg-white rounded-2xl p-6 border-subtle custom-shadow">
  <div class="flex flex-col items-center text-center">
    <div class="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-3">
      <iconify-icon icon="lucide:arrow-down-left" class="text-2xl teal-accent"></iconify-icon>
    </div>
    <p class="text-gray-500 text-sm font-medium">Direct Deposit Received</p>
    <h2 class="text-[40px] font-bold text-gray-900 mt-1">$1,200.00</h2>
    <div class="mt-4 flex flex-col gap-1">
      <span class="text-gray-900 font-semibold">Chase Checking (...4290)</span>
      <span class="text-gray-400 text-xs">Today • Oct 24, 2023 at 9:14 AM</span>
    </div>
  </div>
</section>
```

### Bucket Item Card (Horizontal Layout)
```html
<div class="bg-white p-4 rounded-xl border-subtle flex items-center justify-between">
  <div class="flex items-center gap-4">
    <div class="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
      <iconify-icon icon="lucide:link" class="text-xl text-gray-400"></iconify-icon>
    </div>
    <div>
      <h4 class="font-bold text-gray-900">Tithe</h4>
      <p class="text-xs text-gray-500">10% • External Link</p>
    </div>
  </div>
  <div class="text-right">
    <p class="font-bold text-gray-900">$120.00</p>
    <p class="text-[10px] text-teal-accent font-semibold">Pushpay</p>
  </div>
</div>
```

### Remainder Section (Dashed Border)
```html
<section class="pt-2">
  <div class="bg-gray-100/50 rounded-xl p-4 border border-dashed border-gray-200 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <iconify-icon icon="lucide:wallet" class="text-gray-400"></iconify-icon>
      <span class="text-sm font-medium text-gray-600">Remaining Balance</span>
    </div>
    <span class="text-sm font-bold text-gray-900">$780.00</span>
  </div>
  <p class="text-[11px] text-gray-400 mt-3 px-1 leading-relaxed">
    This remainder will stay in your Chase Checking account as unallocated funds.
  </p>
</section>
```

### Primary Button (Teal CTA)
```html
<button id="confirm-split-btn" class="w-full bg-teal-accent hover:bg-[#0C8F8F] text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] custom-shadow">
  Confirm Split Plan
</button>
```

### Secondary Button (Gray)
```html
<button id="adjust-split-btn" class="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 rounded-xl transition-all active:scale-[0.98]">
  Adjust Amounts
</button>
```

### Fixed Bottom Action Bar
```html
<div class="fixed bottom-0 w-full max-w-[375px] bg-white/80 backdrop-blur-md border-t border-gray-100 p-6 flex flex-col gap-3">
  <!-- Buttons inside -->
</div>
```

## CSS Custom Classes
```css
.custom-shadow {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}

.teal-accent {
  color: #0EA5A5;
}

.bg-teal-accent {
  background-color: #0EA5A5;
}

.border-subtle {
  border: 1px solid rgba(0, 0, 0, 0.04);
}
```

## Visual Philosophy
- **Minimal & Trustworthy**: Clean white space, subtle shadows, no unnecessary chrome
- **Financial Clarity**: Large, bold amounts for scanning; color-coded actions
- **Mobile-First**: Touch-friendly (minimum 44px tap targets), bottom action bar for thumb accessibility
- **Refinement**: Teal accent chosen for calm authority; gray scale for hierarchy; icons from Lucide for consistency

## Design Deliverables

### Generated Pages (6 total)
1. **Deposit Setup** - Form to input deposit amount and select source account
2. **Split Allocation** - Interactive SVG donut chart for real-time allocation adjustments
3. **Bucket Configuration** - Set up destination accounts (internal transfers, external links)
4. **Confirmation** - Final review of split amounts before execution
5. **Split Complete** - Success confirmation with transaction summary

### Key Interactive Features
- **Interactive Donut Chart**: Users drag segment boundaries to adjust allocation percentages in real-time
- **Live Updates**: All bucket amounts and percentages update instantly as user interacts
- **Touch-Friendly**: Full mobile optimization with grab cursor and scaling feedback
- **Constraint Handling**: Prevents invalid states (total > 100%, negative values)

### Implementation Notes
- All pages use Satoshi font from Fontshare
- Teal accent (#0EA5A5) for primary CTAs
- SVG-based donut chart with vanilla JavaScript for performance
- Iconify library for Lucide icons (lucide:menu, lucide:wallet, etc.)
- Tailwind CSS for responsive layout (max-width 375px mobile container)
- No hardcoded colors - uses design tokens throughout

## State Design Patterns

### Loading States
- **Skeleton shimmer**: Use `bg-gradient-to-r from-gray-100 to-gray-50` with CSS animation
- **Disabled buttons**: Reduce opacity to 0.5, cursor-not-allowed
- **Loading spinner**: Use Lucide `loader` icon with spinning animation
- **Text placeholder**: Show "Fetching...", "Loading...", "Calculating..." messages in gray-400
- Animation: `@keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }`

### Error States
- **Error banner**: Red/amber background (#EF4444 or #F59E0B), white text
- **Error icon**: Use Lucide `alert-circle` or `alert-triangle`
- **Error message**: Clear, actionable (not technical)
- **Error color**: Red-600 (#DC2626) for critical, Amber-600 (#D97706) for warnings
- **Retry action**: Always provide "Retry" or "Try Again" button
- **Inline errors**: Show below form fields with small icon

### Empty States
- **Illustration/Icon**: Large, friendly icon (Lucide or custom SVG)
- **Heading**: "No [items] yet" or "Get started"
- **Description**: Brief, encouraging text
- **Primary action**: Clear CTA button to create/add first item
- **Color**: Use gray-400 for icons, keep text readable

### Partial Success / Retry States
- **Success items**: Green checkmark (✓) next to completed actions
- **Failed items**: Red exclamation mark (!) with error message
- **Pending items**: Amber warning icon or spinner
- **Status color**: Green-600 (#16A34A), Red-600 (#DC2626), Amber-600 (#D97706)
- **Retry button**: Per-action retry option or global "Retry All"

### Animation Guidelines
- **Transitions**: 200-300ms for smooth state changes
- **Easing**: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for interactive elements
- **Scale feedback**: Buttons use `active:scale-[0.98]` for press feedback
- **Fade in/out**: Use opacity transitions for overlays and modals

## Design Specifications for Engineers

### Button States
```
Primary Button:
- Default: bg-teal-accent (#0EA5A5), text-white, shadow
- Hover: bg-#0C8F8F (darker teal)
- Active: scale(0.98)
- Disabled: opacity-50, cursor-not-allowed

Secondary Button:
- Default: bg-gray-50, text-gray-600, no shadow
- Hover: bg-gray-100
- Active: scale(0.98)
- Disabled: opacity-50, cursor-not-allowed
```

### Form Input States
```
Input Field:
- Default: border-subtle, bg-white
- Focus: border-teal-accent, ring-2 ring-teal-100
- Error: border-red-500, bg-red-50
- Disabled: bg-gray-50, opacity-50, cursor-not-allowed
```

### Card States
```
Card (Default):
- bg-white, border-subtle, shadow (custom-shadow)
- Hover: slight lift (shadow-lg), no border change

Card (Disabled/Loading):
- opacity-50, pointer-events-none

Card (Error):
- border-red-200, bg-red-50
```

### Responsive Breakpoints
- Mobile: max-width 375px (primary target)
- Tablet: 768px+ (future consideration)
- Desktop: 1024px+ (out of scope for MVP)

## Complete Design Assets Inventory

### Happy Path Pages (6)
1. Deposit Setup
2. Split Allocation (Interactive Donut Chart)
3. Bucket Configuration
4. Confirmation
5. Split Complete
6. Direct Interaction Donut Splitter (variant)

### State Variants (15)
**Split Allocation:**
- Loading State
- Error State
- Confirmation Loading

**Deposit Setup:**
- Loading State
- Error State (No Bank Accounts)
- Validation Error State

**Confirmation:**
- Loading State
- Error State
- Network Error State

**Bucket Configuration:**
- Loading State
- Empty State
- Error State

**Split Complete:**
- Partial Success State
- Retry State
- Pending Manual Action

### Total: 25 Design Pages Ready for Implementation

---

## Complete Design Package Inventory

### Happy Path Pages (7)
1. Deposit Setup
2. Split Allocation (Interactive Donut Chart)
3. Bucket Configuration
4. Confirmation
5. Split Complete
6. Split History & Ledger (NEW)
7. Direct Interaction Donut Splitter (variant)

### State Variants (18)
**Split Allocation (3 states):**
- Loading State
- Error State
- Confirmation Loading

**Deposit Setup (3 states):**
- Loading State
- Error State (No Bank Accounts)
- Validation Error State

**Confirmation (3 states):**
- Loading State
- Error State
- Network Error State

**Bucket Configuration (3 states):**
- Loading State
- Empty State
- Error State

**Split Complete (3 states):**
- Partial Success State
- Retry State
- Pending Manual Action

**Split History (3 states):**
- Loading State (Skeleton Shimmer)
- Retry Animation
- Filter Loading State

### Total: 25 Complete Design Pages Ready for Implementation
