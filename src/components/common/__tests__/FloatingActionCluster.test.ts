import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { FloatingActionCluster } from '../FloatingActionCluster';

describe('FloatingActionCluster Component', () => {
  it('exports FloatingActionCluster as a functional React component', () => {
    assert.strictEqual(typeof FloatingActionCluster, 'function');
  });

  it('renders null when isSupportOpen is true', () => {
    const element = React.createElement(FloatingActionCluster, {
      uiLang: 'ar',
      currentTab: 'dashboard',
      onOpenSupport: () => {},
      isSupportOpen: true,
    });
    assert.strictEqual(element.props.isSupportOpen, true);
  });

  it('instantiates properly with operator role and English language', () => {
    const onOpenSupport = () => {};
    const onNavigateTab = () => {};
    const element = React.createElement(FloatingActionCluster, {
      uiLang: 'en',
      currentTab: 'sales',
      onOpenSupport,
      isSupportOpen: false,
      onNavigateTab,
      userRole: 'operator',
      showHelpButton: true,
    });
    assert.strictEqual(element.type, FloatingActionCluster);
    assert.strictEqual(element.props.uiLang, 'en');
    assert.strictEqual(element.props.currentTab, 'sales');
    assert.strictEqual(element.props.userRole, 'operator');
  });
});
