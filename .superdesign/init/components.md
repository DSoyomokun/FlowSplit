# FlowSplit UI Components

All in `mobile/components/`. Exported via `mobile/components/index.ts`.

## Button
`Button.tsx` — variants: primary | secondary | ghost | danger. Sizes: sm | md | lg. Props: onPress, disabled, loading, fullWidth, icon, haptic.

## Card / CardSection
`Card.tsx` — variants: default | large | muted | outline | dashed. Props: onPress, noPadding, animated.

## BucketConfigCard
`BucketConfigCard.tsx` — Shows bucket name, allocation%, color icon, destination row. Props: id, name, percentage, color, icon, destination, error, onPress, onMorePress, onDestinationPress.

## ActionCard
`ActionCard.tsx` — Warning-styled card for manual actions (Pushpay links). Props: title, description, linkUrl, linkLabel, deadline, onComplete. Has copy-link fallback. HTTPS-only enforced.

## Header
`Header.tsx` — Top nav bar. Props: title, showBack, rightAction.

## FloatingActionButton
`FloatingActionButton.tsx` — Fixed bottom-right FAB. Props: onPress, icon.

## Skeleton
`Skeleton.tsx` — Loading placeholder. Props: width, height, variant ('rounded'|'circle'|'text').

## StatusBadge
`StatusBadge.tsx` — Colored pill badge. Props: status ('pending'|'completed'|'failed'|'processing').

## EmptyState
`EmptyState.tsx` — Empty screen state. Props: icon, title, description, action.

## AmountDisplay
`AmountDisplay.tsx` — Large currency display, splits whole/cents. Props: amount, size.

## AmountInput
`AmountInput.tsx` — Large numeric input for dollar amounts.

## BottomActionBar
`BottomActionBar.tsx` — Fixed bottom action area with primary button.

## AddDepositModal
`AddDepositModal.tsx` — Modal for entering deposit amount.
