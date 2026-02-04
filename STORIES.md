# FlowSplit Implementation Stories

Complete breakdown of all work required to ship FlowSplit.

---

## Epic 1: Project Foundation

### 1.1 Development Environment Setup
- [x] **STORY-001**: Configure Expo project with TypeScript strict mode
- [x] **STORY-002**: Install and configure required dependencies (react-native-svg, gesture-handler, reanimated)
- [x] **STORY-003**: Set up Satoshi font with expo-font
- [x] **STORY-004**: Configure path aliases (@/components, @/constants, etc.)
- [x] **STORY-005**: Set up ESLint and Prettier with project rules
- [x] **STORY-006**: Configure environment variables (.env for Supabase URLs)

### 1.2 Backend Foundation
- [ ] **STORY-007**: Verify Supabase project setup (auth, database)
- [ ] **STORY-008**: Run Alembic migrations for all models
- [ ] **STORY-009**: Test Supabase JWT verification in FastAPI
- [x] **STORY-010**: Set up CORS for mobile app requests
- [ ] **STORY-011**: Create seed data script for development

---

## Epic 2: Design System Implementation

### 2.1 Theme & Constants
- [x] **STORY-012**: Create `constants/colors.ts` with all color tokens
  - Primary: #0EA5A5, #0C8F8F
  - Bucket colors: teal, blue, green, gray
  - State colors: amber (warning), red (error)
  - Text grays: 900, 700, 400, 300
  - Background: #F8F8F8, white

- [x] **STORY-013**: Create `constants/typography.ts` with font specs
  - Satoshi font family
  - Size scale: 10, 11, 12, 14, 17, 18, 24, 40, 60
  - Weight scale: 400, 500, 700, 900

- [x] **STORY-014**: Create `constants/spacing.ts` with layout tokens
  - Page padding: 20
  - Card padding: 16, 24
  - Section gap: 24
  - Item gap: 12

- [x] **STORY-015**: Create `constants/shadows.ts` with shadow definitions
  - Card shadow
  - Button glow shadow
  - Bottom bar shadow

- [x] **STORY-016**: Create `constants/animations.ts` with timing configs
  - Fade duration: 250ms
  - Shimmer animation keyframes
  - Pulse animation config
  - Spring configs for gestures

### 2.2 Base UI Components
- [x] **STORY-017**: Create `Button` component
  - Variants: primary, secondary, ghost, danger
  - States: default, pressed, disabled, loading
  - Press animation: scale(0.98)

- [x] **STORY-018**: Create `Card` component
  - Variants: default (16px radius), large (32px radius), muted
  - Border subtle styling
  - Custom shadow

- [x] **STORY-019**: Create `Header` component
  - Fixed 64px height
  - Back button (optional)
  - Title centered
  - Right action (menu/settings)
  - Sticky positioning

- [x] **STORY-020**: Create `BottomActionBar` component
  - Fixed bottom positioning
  - Backdrop blur
  - Shadow
  - Safe area padding (34px)
  - Slot for primary button + secondary link

- [x] **STORY-021**: Create `TabBar` component
  - 3 tabs: Split, Buckets, History
  - Active/inactive states
  - Icon + label layout

- [x] **STORY-022**: Create `SectionLabel` component
  - Uppercase styling
  - Letter spacing
  - Gray-400 color

### 2.3 State Components
- [x] **STORY-023**: Create `Skeleton` component
  - Variants: text, circular, rectangular
  - Width/height props
  - Shimmer animation with gradient overlay

- [x] **STORY-024**: Create `ErrorBanner` component
  - Red/amber variants
  - Icon + title + description
  - Optional action button
  - Dismissible option

- [x] **STORY-025**: Create `StatusBadge` component
  - Status types: success, failed, pending, retrying, manual
  - Uppercase text
  - Color-coded dot/icon

- [x] **STORY-026**: Create `ErrorModal` component
  - Overlay with backdrop blur
  - Centered card with icon
  - Title + description
  - Primary + secondary actions

- [x] **STORY-027**: Create `EmptyState` component
  - Centered layout
  - Large icon
  - Title + description
  - CTA button

- [x] **STORY-028**: Create `ActionCard` component
  - Amber styling for manual actions
  - External link button
  - Copy link field
  - Timer/deadline note

---

## Epic 3: Feature Components

### 3.1 Amount & Input Components
- [x] **STORY-029**: Create `AmountDisplay` component
  - Large amount format ($1,200.00)
  - Size variants: large (60px), medium, small
  - Cursor blink animation for editable mode

- [x] **STORY-030**: Create `AmountInput` component
  - Numeric keyboard input
  - Currency formatting
  - Validation (min/max)
  - Error state display

### 3.2 Account Components
- [x] **STORY-031**: Create `AccountCard` component
  - Bank icon/logo
  - Account name + type
  - Masked account number (••4821)
  - Selected/unselected states

- [x] **STORY-032**: Create `AccountSelector` component
  - List of AccountCards
  - Single selection
  - "Add new" dashed button

### 3.3 Bucket Components
- [x] **STORY-033**: Create `BucketCard` component (simple)
  - Color dot
  - Name + percentage + amount
  - Compact horizontal layout

- [x] **STORY-034**: Create `BucketConfigCard` component (expanded)
  - Icon with colored background
  - Name + allocation percentage
  - Destination row with bank/link info
  - More menu (3 dots)
  - Error state with reconnect CTA

- [x] **STORY-035**: Create `AddBucketButton` component
  - Dashed border style
  - Plus icon + label
  - Hover state

### 3.4 Distribution Components
- [x] **STORY-036**: Create `DistributionItem` component
  - Color dot
  - Bucket name + destination
  - Amount + percentage
  - Status badge (for complete screen)
  - Error state with inline CTA

- [x] **STORY-037**: Create `RemainderCard` component
  - Dashed border variant
  - Wallet icon
  - "Stays in checking" label
  - Amount display

### 3.5 Donut Chart Components
- [x] **STORY-038**: Create `DonutChart` container component
  - SVG setup (viewBox 100x100)
  - Center content slot
  - Segment + handle rendering

- [x] **STORY-039**: Create `DonutSegment` component
  - Arc calculation from percentage
  - Stroke styling (width 12, hover 14)
  - Color prop

- [x] **STORY-040**: Create `DonutHandle` component
  - Circle at segment boundary
  - Drag gesture handling
  - Scale animation on grab

- [x] **STORY-041**: Create `useDonutChart` hook
  - Split points state management
  - Drag gesture logic (pan responder)
  - Percentage calculations
  - Constraints (min segment size)

- [x] **STORY-042**: Create `DonutSkeleton` component
  - Gray circle with shimmer
  - "Calculating..." center text

### 3.6 Success/Status Components
- [x] **STORY-043**: Create `SuccessIcon` component
  - Outer ring (light teal)
  - Inner circle (teal with shadow)
  - Animated checkmark draw

- [x] **STORY-044**: Create `PartialSuccessIcon` component
  - Amber variant of SuccessIcon
  - Alert triangle icon

- [x] **STORY-045**: Create `ProcessingIcon` component
  - Amber background
  - Spinning refresh icon

---

## Epic 4: Screen Implementation

### 4.1 Deposit Setup Screen
- [ ] **STORY-046**: Create deposit setup screen layout
  - Back navigation
  - Amount input section
  - Account selector section
  - Continue button

- [ ] **STORY-047**: Implement amount validation
  - Minimum amount check
  - Error message display
  - Button disabled state

- [ ] **STORY-048**: Implement account selection logic
  - Fetch user's linked accounts
  - Selection state management
  - Persist selection

### 4.2 Split Allocation Screen
- [ ] **STORY-049**: Create split allocation screen layout
  - Donut chart in card
  - Bucket summary cards below
  - Remainder section
  - Bottom action bar with tabs

- [ ] **STORY-050**: Implement donut chart interaction
  - Drag handles to adjust percentages
  - Real-time amount calculations
  - Update bucket cards on change

- [ ] **STORY-051**: Implement loading state
  - Skeleton donut
  - Skeleton bucket cards

- [ ] **STORY-052**: Connect to backend
  - Fetch user's buckets
  - Fetch default allocation
  - Save allocation changes

### 4.3 Bucket Configuration Screen
- [ ] **STORY-053**: Create bucket config screen layout
  - Header with back
  - Title section
  - Bucket config cards list
  - Add bucket button
  - Continue button

- [ ] **STORY-054**: Implement loading state
  - Skeleton cards with shimmer

- [ ] **STORY-055**: Implement empty state
  - Empty illustration
  - Create bucket CTA

- [ ] **STORY-056**: Implement error state
  - Error banner on affected bucket
  - Reconnect CTA

- [ ] **STORY-057**: Implement bucket CRUD
  - Fetch buckets from API
  - Add new bucket flow
  - Edit bucket (name, percentage, destination)
  - Delete bucket

### 4.4 Confirmation Screen
- [ ] **STORY-058**: Create confirmation screen layout
  - Review title
  - Deposit card
  - Distribution list
  - Details card (execution, fees, total)
  - Confirm button

- [ ] **STORY-059**: Implement loading state
  - Skeleton deposit card
  - Skeleton distribution items

- [ ] **STORY-060**: Implement error state (inline)
  - Error banner on affected item
  - Resolve issue CTA
  - Disabled confirm button

- [ ] **STORY-061**: Implement network error modal
  - Overlay with error modal
  - Try again / Cancel actions

- [ ] **STORY-062**: Implement confirm action
  - API call to execute split
  - Navigate to complete/processing

### 4.5 Split Complete Screen
- [ ] **STORY-063**: Create split complete screen layout
  - Success icon
  - Message
  - Allocation summary card
  - Manage buckets link
  - Return to dashboard button

- [ ] **STORY-064**: Implement partial success state
  - Amber icon
  - Mixed status items
  - Retry button for failed

- [ ] **STORY-065**: Implement manual action state
  - Action card with Pushpay link
  - Copy link functionality
  - Pending item styling

### 4.6 Split Processing Screen
- [ ] **STORY-066**: Create processing screen layout
  - Spinning icon
  - Processing message
  - Retry alert banner
  - Summary with retrying item

- [ ] **STORY-067**: Implement retry polling
  - Poll for status updates
  - Transition to complete when done
  - Handle max retries

---

## Epic 5: Navigation & Flow

### 5.1 Route Setup
- [ ] **STORY-068**: Set up Expo Router file structure
  ```
  app/
  ├── (auth)/
  │   ├── login.tsx
  │   └── register.tsx
  ├── (tabs)/
  │   ├── _layout.tsx
  │   ├── index.tsx (dashboard)
  │   ├── buckets.tsx
  │   └── history.tsx
  ├── deposit/
  │   ├── setup.tsx
  │   └── [id]/
  │       ├── allocate.tsx
  │       ├── confirm.tsx
  │       ├── processing.tsx
  │       └── complete.tsx
  └── _layout.tsx
  ```

- [ ] **STORY-069**: Implement auth guard
  - Redirect unauthenticated to login
  - Persist session

- [ ] **STORY-070**: Implement split flow navigation
  - Setup → Allocate → Confirm → Complete
  - Back navigation handling
  - Exit flow confirmation

### 5.2 Deep Linking
- [ ] **STORY-071**: Configure deep links for deposits
  - `flowsplit://deposit/123/allocate`
  - Handle push notification navigation

---

## Epic 6: State Management

### 6.1 Global State
- [ ] **STORY-072**: Set up state management (Zustand or Context)
  - User state
  - Buckets state
  - Active deposit state

- [ ] **STORY-073**: Implement split flow state
  - Current step tracking
  - Form data persistence
  - Allocation changes

### 6.2 API Integration
- [ ] **STORY-074**: Create API client with Supabase auth
  - Automatic token refresh
  - Request/response interceptors
  - Error handling

- [ ] **STORY-075**: Implement API hooks
  - `useUser()`
  - `useBuckets()`
  - `useDeposit(id)`
  - `useSplitPlan(depositId)`

- [ ] **STORY-076**: Implement mutations
  - `useCreateBucket()`
  - `useUpdateBucket()`
  - `useDeleteBucket()`
  - `useExecuteSplit()`

---

## Epic 7: Backend Completion

### 7.1 API Endpoints
- [ ] **STORY-077**: Implement deposits endpoints
  - `GET /deposits` - List pending deposits
  - `GET /deposits/{id}` - Get deposit details
  - `POST /deposits` - Create manual deposit

- [ ] **STORY-078**: Implement split plan endpoints
  - `GET /deposits/{id}/plan` - Get proposed allocation
  - `PUT /deposits/{id}/plan` - Update allocation
  - `POST /deposits/{id}/execute` - Execute split

- [ ] **STORY-079**: Implement buckets endpoints (verify existing)
  - `GET /buckets` - List user's buckets
  - `POST /buckets` - Create bucket
  - `PUT /buckets/{id}` - Update bucket
  - `DELETE /buckets/{id}` - Delete bucket

### 7.2 Business Logic
- [ ] **STORY-080**: Implement allocation service
  - Calculate amounts from percentages
  - Handle remainder bucket
  - Validate total = 100%

- [ ] **STORY-081**: Implement split execution service
  - Create split actions
  - Update deposit status
  - Handle partial failures

- [ ] **STORY-082**: Implement notification triggers
  - Deposit received notification
  - Split complete notification
  - Manual action required notification

### 7.3 External Integrations
- [ ] **STORY-083**: Design Plaid integration architecture
  - Account linking flow
  - Transaction webhooks
  - Balance checks

- [ ] **STORY-084**: Design transfer execution architecture
  - Bank transfer API integration
  - External link generation (Pushpay, etc.)
  - Status tracking

---

## Epic 8: Polish & UX

### 8.1 Animations
- [ ] **STORY-085**: Implement screen transitions
  - Fade out/in between screens
  - Shared element transitions for header

- [ ] **STORY-086**: Implement micro-interactions
  - Button press scale
  - Card press feedback
  - List item animations

- [ ] **STORY-087**: Implement success animations
  - Checkmark draw animation
  - Confetti/celebration (optional)

### 8.2 Haptics
- [ ] **STORY-088**: Add haptic feedback
  - Button presses
  - Donut handle drag
  - Success/error events

### 8.3 Accessibility
- [ ] **STORY-089**: Add accessibility labels
  - All interactive elements
  - Screen reader announcements
  - Focus management

- [ ] **STORY-090**: Test with VoiceOver/TalkBack
  - Navigation flow
  - Donut chart interaction
  - Error announcements

---

## Epic 9: Testing

### 9.1 Unit Tests
- [ ] **STORY-091**: Test utility functions
  - Amount formatting
  - Percentage calculations
  - Validation logic

- [ ] **STORY-092**: Test hooks
  - useDonutChart
  - useAllocation
  - API hooks

### 9.2 Component Tests
- [ ] **STORY-093**: Test base components
  - Button states
  - Card variants
  - Error states

- [ ] **STORY-094**: Test feature components
  - DonutChart interactions
  - BucketCard actions
  - AccountSelector selection

### 9.3 Integration Tests
- [ ] **STORY-095**: Test split flow
  - End-to-end deposit → complete
  - Error handling
  - Edge cases

### 9.4 Backend Tests
- [ ] **STORY-096**: Test API endpoints
  - Authentication
  - CRUD operations
  - Error responses

- [ ] **STORY-097**: Test business logic
  - Allocation calculations
  - Split execution
  - Status transitions

---

## Epic 10: Deployment

### 10.1 Backend Deployment
- [ ] **STORY-098**: Set up production Supabase project
  - Configure auth settings
  - Set up RLS policies
  - Run migrations

- [ ] **STORY-099**: Deploy FastAPI to cloud
  - Choose platform (Railway, Render, Fly.io)
  - Configure environment variables
  - Set up CI/CD

### 10.2 Mobile Deployment
- [ ] **STORY-100**: Configure EAS Build
  - iOS provisioning profiles
  - Android keystore
  - Build profiles (dev, preview, production)

- [ ] **STORY-101**: Prepare App Store assets
  - App icon (all sizes)
  - Screenshots
  - App description

- [ ] **STORY-102**: Submit for review
  - TestFlight beta
  - App Store submission
  - Google Play submission

---

## Story Count Summary

| Epic | Stories | Priority |
|------|---------|----------|
| 1. Project Foundation | 11 | P0 |
| 2. Design System | 17 | P0 |
| 3. Feature Components | 17 | P0 |
| 4. Screen Implementation | 22 | P0 |
| 5. Navigation & Flow | 4 | P0 |
| 6. State Management | 5 | P0 |
| 7. Backend Completion | 8 | P1 |
| 8. Polish & UX | 6 | P2 |
| 9. Testing | 7 | P2 |
| 10. Deployment | 5 | P1 |
| **TOTAL** | **102** | |

---

## Recommended Implementation Order

### Sprint 1: Foundation (Stories 1-16)
- Dev environment setup
- Theme constants
- Backend verification

### Sprint 2: Base Components (Stories 17-28)
- All base UI components
- State components

### Sprint 3: Feature Components (Stories 29-45)
- Amount, Account, Bucket components
- Donut chart with interactions

### Sprint 4: Screens Part 1 (Stories 46-57)
- Deposit Setup
- Split Allocation
- Bucket Configuration

### Sprint 5: Screens Part 2 (Stories 58-67)
- Confirmation
- Complete
- Processing

### Sprint 6: Integration (Stories 68-76)
- Navigation
- State management
- API integration

### Sprint 7: Backend & Polish (Stories 77-90)
- Complete backend endpoints
- Animations
- Accessibility

### Sprint 8: Testing & Deploy (Stories 91-102)
- All testing
- Deployment

---

## Definition of Done

A story is complete when:
- [ ] Code is written and follows project conventions
- [ ] Component matches design specs exactly
- [ ] All states are handled (loading, error, empty)
- [ ] TypeScript types are complete
- [ ] Basic tests pass
- [ ] Code reviewed
- [ ] Works on iOS and Android
