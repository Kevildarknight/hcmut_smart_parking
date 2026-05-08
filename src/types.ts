/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  STUDENT = 'Student',
  FACULTY = 'Faculty',
  STAFF = 'Staff',
  VISITOR = 'Visitor',
  OPERATOR = 'Operator',
  ADMIN = 'Admin'
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface ParkingSession {
  id: string;
  userId?: string;
  plateNumber: string;
  entryTime: Date;
  exitTime?: Date;
  role: UserRole;
  status: SessionStatus;
  fee: number;
}

export interface ParkingSlot {
  id: string;
  zone: string;
  isOccupied: boolean;
  isOnline: boolean;
  lastUpdated: Date;
}

export interface PricingPolicy {
  id: string;
  role: UserRole;
  ratePerHour: number;
  gracePeriodMinutes: number;
  maxDailyFee: number;
}
