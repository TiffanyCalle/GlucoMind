import AppleHealthKit, { HealthKitPermissions, HealthValue } from 'react-native-health';

// HealthUnit only exists in react-native-health's .d.ts, not its runtime JS.
// Define the values we need here so they're available at runtime.
export const HealthUnit = {
  mgPerdL: 'mgPerdL',
  mmolPerL: 'mmolPerL',
} as const;

// ------------------------------------------------------------------
// Mock store — used automatically when the native HealthKit module
// isn't wired up (simulator, unit tests, etc.)
// ------------------------------------------------------------------
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

const mockStore: HealthValue[] = [
  { value: 124, startDate: daysAgo(0), endDate: daysAgo(0) },
  { value: 108, startDate: daysAgo(1), endDate: daysAgo(1) },
  { value: 143, startDate: daysAgo(2), endDate: daysAgo(2) },
  { value:  97, startDate: daysAgo(3), endDate: daysAgo(3) },
  { value: 162, startDate: daysAgo(4), endDate: daysAgo(4) },
  { value: 118, startDate: daysAgo(5), endDate: daysAgo(5) },
  { value: 131, startDate: daysAgo(6), endDate: daysAgo(6) },
];

const mock = {
  initHealthKit(
    _permissions: HealthKitPermissions,
    callback: (err: string, result: HealthValue) => void,
  ) {
    // Simulate the async permission dialog
    setTimeout(() => callback('', { value: 0, startDate: '', endDate: '' }), 400);
  },

  getBloodGlucoseSamples(
    options: { startDate?: string; endDate?: string; ascending?: boolean; limit?: number },
    callback: (err: string, results: HealthValue[]) => void,
  ) {
    let results = [...mockStore];
    if (options.startDate) {
      results = results.filter(r => r.startDate >= options.startDate!);
    }
    if (options.ascending) {
      results.sort((a, b) => a.startDate.localeCompare(b.startDate));
    } else {
      results.sort((a, b) => b.startDate.localeCompare(a.startDate));
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }
    setTimeout(() => callback('', results), 100);
  },

  saveBloodGlucoseSample(
    options: { value: number; startDate?: string },
    callback: (err: string, result: HealthValue) => void,
  ) {
    const now = options.startDate ?? new Date().toISOString();
    const reading: HealthValue = { value: options.value, startDate: now, endDate: now };
    mockStore.unshift(reading);
    setTimeout(() => callback('', reading), 100);
  },
};

// ------------------------------------------------------------------
// Unified adapter — real HealthKit when native is present, mock otherwise
// ------------------------------------------------------------------
const nativeAvailable = !!AppleHealthKit.initHealthKit;

export const HK = nativeAvailable
  ? {
      initHealthKit: AppleHealthKit.initHealthKit.bind(AppleHealthKit),
      getBloodGlucoseSamples: AppleHealthKit.getBloodGlucoseSamples.bind(AppleHealthKit),
      saveBloodGlucoseSample: AppleHealthKit.saveBloodGlucoseSample.bind(AppleHealthKit),
    }
  : mock;

export { HealthKitPermissions, HealthValue };
export const HKPermissions = AppleHealthKit.Constants.Permissions;
