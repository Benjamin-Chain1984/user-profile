/**
 * Traffic Light Status System - Single Source of Truth
 * 
 * Every module MUST expose one single trafficLightStatus.
 * The Home page MUST only consume this value — never recalculate.
 * 
 * Hierarchy: Red > Amber > IDEAL (Green)
 */

export type TrafficLightStatus = 'red' | 'amber' | 'green';

export interface ModuleTrafficLightResult {
  status: TrafficLightStatus;
  reason: string;
  lastUpdated: string;
}

/**
 * Map legacy internal statuses to traffic light.
 * Use this to normalize any module status output.
 */
export function toTrafficLight(
  status: string
): TrafficLightStatus {
  switch (status) {
    case 'action':
    case 'red':
      return 'red';
    case 'monitor':
    case 'amber':
      return 'amber';
    case 'stable':
    case 'ideal':
    case 'green':
      return 'green';
    default:
      return 'green';
  }
}

/**
 * Get the display label for a traffic light status.
 */
export function getTrafficLightLabel(status: TrafficLightStatus): string {
  switch (status) {
    case 'red': return 'Red';
    case 'amber': return 'Amber';
    case 'green': return 'IDEAL';
  }
}

/**
 * Get the full descriptive label.
 */
export function getTrafficLightFullLabel(status: TrafficLightStatus): string {
  switch (status) {
    case 'red': return 'Red – Action Needed';
    case 'amber': return 'Amber – Attention Required';
    case 'green': return 'IDEAL';
  }
}

/**
 * Resolve the highest-priority status from multiple inputs.
 * Red > Amber > Green
 */
export function resolveHighestStatus(
  ...statuses: (TrafficLightStatus | null | undefined)[]
): TrafficLightStatus {
  const valid = statuses.filter(Boolean) as TrafficLightStatus[];
  if (valid.includes('red')) return 'red';
  if (valid.includes('amber')) return 'amber';
  return 'green';
}
