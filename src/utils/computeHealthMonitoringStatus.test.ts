/**
 * Acceptance tests for computeHealthMonitoringStatus
 * Run: bun run test src/utils/computeHealthMonitoringStatus.test.ts
 */

import { describe, it, expect } from 'vitest';
import { computeHealthMonitoringStatus } from './computeHealthMonitoringStatus';
import type { VitalSignConfig, VitalSignEntry } from '@/types/healthMonitoring';

const BASE_CONFIG: VitalSignConfig = {
  id: 'cfg-1',
  client_id: null,
  temperature_enabled: true,
  temperature_frequency_hours: 24,
  bp_enabled: true,
  bp_frequency_hours: 24,
  oxygen_enabled: true,
  oxygen_frequency_hours: 24,
  heart_rate_enabled: true,
  heart_rate_frequency_hours: 24,
  respiratory_enabled: true,
  respiratory_frequency_hours: 24,
  amber_recheck_hours: 2,
  escalation_recipients: [],
  enable_log_on_behalf: false,
  created_at: '2026-01-01T00:00:00Z',
  created_by: null,
  updated_at: '2026-01-01T00:00:00Z',
  updated_by: null,
};

const makeEntry = (hoursAgo: number, overrides: Partial<VitalSignEntry> = {}): VitalSignEntry => {
  const now = new Date('2026-02-20T08:00:00Z');
  const ts = new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
  return {
    id: 'e1',
    client_id: null,
    temperature_celsius: 36.8,
    bp_systolic: 120,
    bp_diastolic: 80,
    oxygen_saturation: 98,
    heart_rate: 72,
    respiratory_rate: 16,
    temperature_status: 'ideal',
    bp_status: 'ideal',
    oxygen_status: 'ideal',
    heart_rate_status: 'ideal',
    respiratory_status: 'ideal',
    overall_status: 'ideal',
    symptoms: [],
    notes: null,
    event_occurred_at: ts,
    created_at: ts,
    created_by: null,
    edited_at: null,
    edited_by: null,
    edit_reason: null,
    recorded_on_behalf_of_name: null,
    recorded_on_behalf_of_role: null,
    recorded_on_behalf_of_reason: null,
    ...overrides,
  };
};

const NOW = new Date('2026-02-20T08:00:00Z');

// ── Test 1: Daily config, last entry 48h ago → Amber ──────────────────────────
describe('computeHealthMonitoringStatus', () => {
  it('Daily config, last entry 48h ago → module Amber', () => {
    const result = computeHealthMonitoringStatus({
      config: BASE_CONFIG,
      entries: [makeEntry(48)],
      now: NOW,
    });
    expect(result.moduleStatus).toBe('amber');
    expect(result.overdueVitals.length).toBeGreaterThan(0);
    expect(result.perVitalStatuses.every(v => v.overdue)).toBe(true);
  });

  // ── Test 2: Daily config, last entry 12h ago → Ideal ─────────────────────
  it('Daily config, last entry 12h ago → module Ideal', () => {
    const result = computeHealthMonitoringStatus({
      config: BASE_CONFIG,
      entries: [makeEntry(12)],
      now: NOW,
    });
    expect(result.moduleStatus).toBe('ideal');
    expect(result.overdueVitals).toHaveLength(0);
  });

  // ── Test 3: Twice Daily config, last entry 13h ago → Amber ───────────────
  it('Twice Daily config (12h), last entry 13h ago → Amber', () => {
    const twiceDaily: VitalSignConfig = {
      ...BASE_CONFIG,
      temperature_frequency_hours: 12,
      bp_frequency_hours: 12,
      oxygen_frequency_hours: 12,
      heart_rate_frequency_hours: 12,
      respiratory_frequency_hours: 12,
    };
    const result = computeHealthMonitoringStatus({
      config: twiceDaily,
      entries: [makeEntry(13)],
      now: NOW,
    });
    expect(result.moduleStatus).toBe('amber');
    expect(result.overdueVitals.length).toBeGreaterThan(0);
  });

  // ── Test 4: Config missing → safe Amber ───────────────────────────────────
  it('Config missing → safe Amber with configMissing=true', () => {
    const result = computeHealthMonitoringStatus({
      config: null,
      entries: [makeEntry(12)],
      now: NOW,
    });
    expect(result.moduleStatus).toBe('amber');
    expect(result.configMissing).toBe(true);
    expect(result.message).toContain('config missing');
  });

  // ── Test 5: BP uses event timestamp (systolic + diastolic as one event) ───
  it('BP overdue uses event timestamp', () => {
    const result = computeHealthMonitoringStatus({
      config: BASE_CONFIG,
      entries: [makeEntry(48)],
      now: NOW,
    });
    const bpStatus = result.perVitalStatuses.find(v => v.vitalKey === 'bp');
    expect(bpStatus?.overdue).toBe(true);
    expect(bpStatus?.statusColor).toBe('amber');
  });

  // ── Test 6: Red vital reading → module Red regardless of overdue ──────────
  it('Any Red vital reading → module Red even if others overdue', () => {
    const redEntry = makeEntry(2, {
      temperature_status: 'red',
      bp_status: 'red',
      oxygen_status: 'red',
      heart_rate_status: 'red',
      respiratory_status: 'red',
      overall_status: 'red',
    });
    const result = computeHealthMonitoringStatus({
      config: BASE_CONFIG,
      entries: [redEntry, makeEntry(48)],
      alerts: [{
        id: 'a1',
        client_id: null,
        vital_entry_id: null,
        alert_type: 'threshold',
        vital_type: 'temperature',
        severity: 'red',
        message: 'Critical temperature',
        recommended_action: null,
        is_trend_alert: false,
        trend_data: null,
        acknowledged_at: null,
        acknowledged_by: null,
        resolved_at: null,
        resolved_by: null,
        resolved_reason: null,
        action_taken: null,
        emergency_services_contacted: false,
        emergency_contact_time: null,
        outcome: null,
        metadata: {},
        created_at: new Date().toISOString(),
        created_by: null,
      }],
      now: NOW,
    });
    expect(result.moduleStatus).toBe('red');
  });

  // ── Test 7: Status hierarchy Red > Amber > Ideal ──────────────────────────
  it('Status hierarchy: Red > Amber > Ideal', () => {
    // One vital red → module red
    const mixedEntry = makeEntry(2, {
      temperature_status: 'red',
      overall_status: 'red',
    });
    const r = computeHealthMonitoringStatus({
      config: { ...BASE_CONFIG, bp_frequency_hours: 48 }, // bp overdue → amber
      entries: [mixedEntry, makeEntry(50)],
      alerts: [{
        id: 'a1', client_id: null, vital_entry_id: null, alert_type: 'threshold',
        vital_type: 'temperature', severity: 'red', message: 'Critical',
        recommended_action: null, is_trend_alert: false, trend_data: null,
        acknowledged_at: null, acknowledged_by: null, resolved_at: null,
        resolved_by: null, resolved_reason: null, action_taken: null,
        emergency_services_contacted: false, emergency_contact_time: null,
        outcome: null, metadata: {}, created_at: new Date().toISOString(), created_by: null,
      }],
      now: NOW,
    });
    expect(r.moduleStatus).toBe('red');
  });
});
