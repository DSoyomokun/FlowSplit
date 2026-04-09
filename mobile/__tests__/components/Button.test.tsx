/**
 * Tests for the Button component (Story 093).
 */

import React from 'react';
import { act } from 'react-test-renderer';
import renderer from 'react-test-renderer';
import { Button } from '@/components/Button';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('react-native-reanimated', () => {
  const mock = require('react-native-reanimated/mock');
  return mock;
});

function renderButton(props: Partial<Parameters<typeof Button>[0]> = {}) {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <Button onPress={props.onPress ?? (() => {})} {...props}>
        {(props as any).children ?? 'Click me'}
      </Button>
    );
  });
  return tree!;
}

describe('Button', () => {
  it('renders without crashing', () => {
    const tree = renderButton();
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders children text', () => {
    const tree = renderButton({ children: 'Confirm Split' } as any);
    expect(JSON.stringify(tree.toJSON())).toContain('Confirm Split');
  });

  it('renders in disabled state', () => {
    const tree = renderButton({ disabled: true });
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders in loading state', () => {
    const tree = renderButton({ loading: true });
    // Loading state shows ActivityIndicator — children text hidden
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders secondary variant', () => {
    const tree = renderButton({ variant: 'secondary' });
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders ghost variant', () => {
    const tree = renderButton({ variant: 'ghost' });
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders danger variant', () => {
    const tree = renderButton({ variant: 'danger' });
    expect(tree.toJSON()).not.toBeNull();
  });
});
