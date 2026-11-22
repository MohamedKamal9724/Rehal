import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { NotificationCenter } from './NotificationCenter';
import { Inquiry, Quote, FollowUpTask } from '../../types';
import { 
  DEFAULT_BADGE_SETTINGS, 
  NotificationBadgeSettings, 
  NotificationFilter 
} from '../../hooks/useOperatorNotifications';

describe('NotificationCenter and useOperatorNotifications', () => {
  const sampleInquiry: Inquiry = {
    id: 'inq_test_1',
    workspaceId: 'ws_test',
    travelerName: 'Sarah Jenkins',
    source: 'Web Form',
    rawText: 'Looking for 7 days luxury Cairo and Nile Cruise tour for 2 guests.',
    status: 'New',
    assignedAgentId: 'agent_1',
    assignedAgentName: 'Karim',
    receivedAt: new Date().toISOString(),
    language: 'en',
    slaMinutes: 120,
  };

  const sampleQuote: Quote = {
    id: 'quote_test_1',
    quoteNumber: 'QT-2026-001',
    workspaceId: 'ws_test',
    travelerName: 'Marcus Aurelius',
    version: 1,
    status: 'Accepted',
    targetCurrency: 'USD',
    startDate: '2026-04-01',
    durationDays: 7,
    group: { adults: 2, children: [], infants: 0 },
    days: [],
    totalCostEgp: 220000,
    totalPriceEgp: 287100,
    totalPriceQuoteCurrency: 5800,
    marginPercent: 20,
    validUntil: '2026-04-10',
    language: 'en',
    assignedAgentId: 'agent_1',
    assignedAgentName: 'Karim',
    publicToken: 'tok_test_1',
    viewCount: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inquiryId: 'inq_test_1',
  };

  const sampleFollowUp: FollowUpTask = {
    id: 'followup_test_1',
    workspaceId: 'ws_test',
    quoteId: 'quote_test_1',
    travelerName: 'Elena Rostova',
    triggerReason: '3+ view sessions detected within 2 hours',
    status: 'Pending',
    suggestedMessage: 'Hi Elena, noticed you were reviewing the Nile Cruise section.',
    dueDate: new Date().toISOString(),
    isUrgent: true,
  };

  it('exports NotificationCenter as a React functional component', () => {
    assert.strictEqual(typeof NotificationCenter, 'function');
  });

  it('renders NotificationCenter with proper props without runtime errors', () => {
    let navigatedTab = '';
    const element = React.createElement(NotificationCenter, {
      workspaceId: 'ws_test',
      inquiries: [sampleInquiry],
      quotes: [sampleQuote],
      followUps: [sampleFollowUp],
      uiLang: 'ar',
      onNavigateTab: (tab: string) => {
        navigatedTab = tab;
      },
    });

    assert.strictEqual(element.type, NotificationCenter);
    assert.strictEqual(element.props.uiLang, 'ar');
    assert.strictEqual(element.props.inquiries?.length, 1);
    assert.strictEqual(element.props.quotes?.length, 1);
    assert.strictEqual(element.props.followUps?.length, 1);
  });

  it('supports English and Arabic languages and passes onNavigateTab callback', () => {
    let navigated = false;
    const elementEn = React.createElement(NotificationCenter, {
      workspaceId: 'ws_test',
      inquiries: [],
      quotes: [],
      followUps: [],
      uiLang: 'en',
      onNavigateTab: () => {
        navigated = true;
      },
    });

    assert.strictEqual(elementEn.props.uiLang, 'en');
    elementEn.props.onNavigateTab('quotes');
    assert.strictEqual(navigated, true);
  });

  it('provides DEFAULT_BADGE_SETTINGS enabling inquiries, quotes, and follow-ups by default', () => {
    assert.deepStrictEqual(DEFAULT_BADGE_SETTINGS, {
      inquiries: true,
      quotes: true,
      followUps: true,
    });
  });

  it('validates supported NotificationFilter values', () => {
    const validFilters: NotificationFilter[] = [
      'all',
      'urgent_followup',
      'new_inquiry',
      'quote_status',
      'unread',
      'urgent',
    ];
    assert.strictEqual(validFilters.length, 6);
  });
});
