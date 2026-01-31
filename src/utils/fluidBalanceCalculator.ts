import { FluidConfig, FluidIntakeEntry, FluidOutputEntry, FluidStatus, DailySummary } from '@/types/fluidBalance';
import { startOfDay, endOfDay, parseISO, format, isWithinInterval, setHours, setMinutes } from 'date-fns';

export function getDayBoundary(date: Date, boundaryTime: string): { start: Date; end: Date } {
  const [hours, minutes] = boundaryTime.split(':').map(Number);
  
  const dayStart = setMinutes(setHours(startOfDay(date), hours), minutes || 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  dayEnd.setSeconds(dayEnd.getSeconds() - 1);
  
  return { start: dayStart, end: dayEnd };
}

export function getEntriesForDay(
  entries: (FluidIntakeEntry | FluidOutputEntry)[],
  date: Date,
  boundaryTime: string
): (FluidIntakeEntry | FluidOutputEntry)[] {
  const { start, end } = getDayBoundary(date, boundaryTime);
  
  return entries.filter(entry => {
    const entryDate = parseISO(entry.event_occurred_at);
    return isWithinInterval(entryDate, { start, end });
  });
}

export function calculateDailyTotals(
  intakeEntries: FluidIntakeEntry[],
  outputEntries: FluidOutputEntry[],
  date: Date,
  config: FluidConfig
): { intake: number; output: number; balance: number } {
  const dayIntakes = getEntriesForDay(intakeEntries, date, config.day_boundary_time) as FluidIntakeEntry[];
  const dayOutputs = config.enable_output_logging 
    ? getEntriesForDay(outputEntries, date, config.day_boundary_time) as FluidOutputEntry[]
    : [];
  
  const intake = dayIntakes.reduce((sum, entry) => sum + entry.amount_ml, 0);
  const output = dayOutputs.reduce((sum, entry) => sum + (entry.amount_ml || 0), 0);
  const balance = intake - output;
  
  return { intake, output, balance };
}

export function calculateFluidStatus(
  intakeEntries: FluidIntakeEntry[],
  outputEntries: FluidOutputEntry[],
  config: FluidConfig | null,
  date: Date = new Date()
): { status: FluidStatus; message: string; percentOfTarget: number; statusLabel: string } {
  // Default values when config not set
  const defaultDehydrationPercent = 30;
  const defaultOverhydrationPercent = 120;
  const defaultTimeCheckpoint = '12:00';
  
  if (!config) {
    return {
      status: 'ideal',
      message: 'No fluids logged today',
      percentOfTarget: 0,
      statusLabel: 'No Data'
    };
  }
  
  const { intake, output, balance } = calculateDailyTotals(intakeEntries, outputEntries, date, config);
  
  // Calculate percentage of target (or max allowance if restricted)
  const target = config.fluid_restriction_enabled && config.max_fluid_allowance_ml
    ? config.max_fluid_allowance_ml
    : config.target_daily_intake_ml;
  
  const percentOfTarget = target > 0 ? Math.round((intake / target) * 100) : 0;
  
  // Get configurable thresholds with fallbacks
  const dehydrationWarningPercent = config.dehydration_warning_percent ?? defaultDehydrationPercent;
  const overhydrationWarningPercent = config.overhydration_warning_percent ?? defaultOverhydrationPercent;
  const timeCheckpoint = config.time_checkpoint_for_warning ?? defaultTimeCheckpoint;
  
  // Parse time checkpoint
  const [checkpointHour, checkpointMinute] = timeCheckpoint.split(':').map(Number);
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const isAfterCheckpoint = currentHour > checkpointHour || 
    (currentHour === checkpointHour && currentMinute >= (checkpointMinute || 0));
  
  // PRIORITY 1: Check overhydration (RED) - always override
  if (percentOfTarget >= overhydrationWarningPercent) {
    return {
      status: 'red',
      message: `Risk of overhydration: ${intake}ml (${percentOfTarget}% of ${target}ml - exceeds ${overhydrationWarningPercent}% threshold)`,
      percentOfTarget,
      statusLabel: 'Risk of Overhydration'
    };
  }
  
  // PRIORITY 2: Check fluid restriction breach (RED)
  if (config.fluid_restriction_enabled && config.max_fluid_allowance_ml) {
    if (intake > config.max_fluid_allowance_ml) {
      return {
        status: 'red',
        message: `Fluid restriction exceeded: ${intake}ml of ${config.max_fluid_allowance_ml}ml limit`,
        percentOfTarget,
        statusLabel: 'Limit Exceeded'
      };
    }
    // Approaching limit (90%+) - Amber
    if (intake >= config.max_fluid_allowance_ml * 0.9) {
      return {
        status: 'amber',
        message: `Approaching fluid limit: ${intake}ml of ${config.max_fluid_allowance_ml}ml (${percentOfTarget}%)`,
        percentOfTarget,
        statusLabel: 'Approaching Limit'
      };
    }
  }
  
  // PRIORITY 3: Check balance thresholds (if output logging enabled)
  if (config.enable_output_logging) {
    // Overhydration balance threshold (RED)
    if (balance > config.overhydration_threshold_ml) {
      return {
        status: 'red',
        message: `Fluid balance above threshold: +${balance}ml (threshold: +${config.overhydration_threshold_ml}ml)`,
        percentOfTarget,
        statusLabel: 'Fluid Overload Risk'
      };
    }
    
    // Dehydration balance threshold (RED)
    if (balance < config.dehydration_threshold_ml) {
      return {
        status: 'red',
        message: `Fluid balance below threshold: ${balance}ml (threshold: ${config.dehydration_threshold_ml}ml)`,
        percentOfTarget,
        statusLabel: 'Dehydration Risk'
      };
    }
  }
  
  // PRIORITY 4: Time-aware dehydration warning (AMBER)
  // Only trigger if intake is below threshold AND it's after the time checkpoint
  if (percentOfTarget < dehydrationWarningPercent && isAfterCheckpoint) {
    return {
      status: 'amber',
      message: `Possible dehydration: ${intake}ml (${percentOfTarget}% of ${target}ml target - below ${dehydrationWarningPercent}% after ${timeCheckpoint})`,
      percentOfTarget,
      statusLabel: 'Possible Dehydration'
    };
  }
  
  // PRIORITY 5: Low intake warning without time gate (AMBER) - below 50%
  if (percentOfTarget < 50 && isAfterCheckpoint) {
    return {
      status: 'amber',
      message: `Low fluid intake: ${intake}ml (${percentOfTarget}% of ${target}ml target)`,
      percentOfTarget,
      statusLabel: 'Low Intake'
    };
  }
  
  // No issues - IDEAL (Good Hydration)
  const idealMessage = intake === 0
    ? 'No fluids logged today'
    : config.enable_output_logging 
      ? `Good hydration: ${intake}ml intake, balance ${balance >= 0 ? '+' : ''}${balance}ml`
      : `Good hydration: ${intake}ml (${percentOfTarget}% of target)`;
  
  return {
    status: 'ideal',
    message: idealMessage,
    percentOfTarget,
    statusLabel: intake === 0 ? 'No Data' : 'Good Hydration'
  };
}

export function calculateDailySummaries(
  intakeEntries: FluidIntakeEntry[],
  outputEntries: FluidOutputEntry[],
  config: FluidConfig,
  days: number = 7
): DailySummary[] {
  const summaries: DailySummary[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const { intake, output, balance } = calculateDailyTotals(intakeEntries, outputEntries, date, config);
    const { status, message, percentOfTarget } = calculateFluidStatus(intakeEntries, outputEntries, config, date);
    
    summaries.push({
      date: format(date, 'yyyy-MM-dd'),
      totalIntake: intake,
      totalOutput: output,
      balance,
      percentOfTarget,
      status,
      statusReason: message
    });
  }
  
  return summaries;
}

export function checkUrineColourAlert(colour: number): { isAlert: boolean; message: string } {
  if (colour >= 7) {
    return {
      isAlert: true,
      message: 'Urine colour indicates significant dehydration - escalate if symptoms present'
    };
  }
  if (colour >= 5) {
    return {
      isAlert: true,
      message: 'Urine colour indicates mild to moderate dehydration - encourage fluids'
    };
  }
  return { isAlert: false, message: '' };
}

export function getHydrationLevel(percentOfTarget: number): 'critical' | 'low' | 'moderate' | 'good' | 'full' {
  if (percentOfTarget < 25) return 'critical';
  if (percentOfTarget < 50) return 'low';
  if (percentOfTarget < 75) return 'moderate';
  if (percentOfTarget < 100) return 'good';
  return 'full';
}

export function getStatusLabel(status: FluidStatus): string {
  switch (status) {
    case 'ideal':
      return 'IDEAL';
    case 'amber':
      return 'Amber – Monitor';
    case 'red':
      return 'Red – Action Needed';
    default:
      return 'Unknown';
  }
}
