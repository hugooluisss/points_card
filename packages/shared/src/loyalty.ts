export type LoyaltyMode = "stamps" | "points";
export type LoyaltyProgramStatus = "active" | "inactive";

export interface LoyaltyProgramDto {
  id: string;
  businessId: string;
  name: string;
  mode: LoyaltyMode;
  status: LoyaltyProgramStatus;
  validFrom: string;
  validUntil: string | null;
  stampsGoal: number | null;
  pointsPerCurrencyUnit: string | null;
  minIntervalMinutes: number | null;
  maxAccumulationsPerCardPerDay: number | null;
  maxAccumulationsPerStaffPerDay: number | null;
  maxPointsPerOperation: number | null;
  staffDailyAlertThreshold: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyRewardDto {
  id: string;
  businessId: string;
  programId: string;
  name: string;
  cost: number;
  conditions: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
