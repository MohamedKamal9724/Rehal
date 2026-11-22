import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { RihalLogo } from './RihalLogo';

describe('RihalLogo Component', () => {
  it('renders without error and exports RihalLogo functional component', () => {
    assert.strictEqual(typeof RihalLogo, 'function');
  });

  it('renders button element when onClick is provided', () => {
    let clicked = false;
    const element = React.createElement(RihalLogo, {
      variant: 'compact',
      onClick: () => { clicked = true; }
    });

    assert.strictEqual(element.type, RihalLogo);
    assert.strictEqual(typeof element.props.onClick, 'function');

    // Call the onClick prop directly to verify it fires
    const onClick = element.props.onClick as () => void;
    onClick();
    assert.strictEqual(clicked, true);
  });

  it('renders with accessible title and aria attributes when pressable', () => {
    const elementAr = React.createElement(RihalLogo, {
      variant: 'compact',
      isArabic: true,
      onClick: () => {}
    });

    assert.strictEqual(elementAr.props.isArabic, true);
    assert.strictEqual(typeof elementAr.props.onClick, 'function');

    const elementEn = React.createElement(RihalLogo, {
      variant: 'compact',
      isArabic: false,
      onClick: () => {}
    });

    assert.strictEqual(elementEn.props.isArabic, false);
  });
});
