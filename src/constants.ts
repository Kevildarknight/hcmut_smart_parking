import { UserRole, PricingPolicy, ParkingSlot } from './types';

export const PRICING_POLICIES: PricingPolicy[] = [
  { id: 'p1', role: UserRole.STUDENT, ratePerHour: 2000, gracePeriodMinutes: 30, maxDailyFee: 10000 },
  { id: 'p2', role: UserRole.FACULTY, ratePerHour: 0, gracePeriodMinutes: 0, maxDailyFee: 0 },
  { id: 'p3', role: UserRole.STAFF, ratePerHour: 0, gracePeriodMinutes: 0, maxDailyFee: 0 },
  { id: 'p4', role: UserRole.VISITOR, ratePerHour: 5000, gracePeriodMinutes: 15, maxDailyFee: 50000 },
];

export const ZONES = ['All', 'Zone A', 'Zone B'];
