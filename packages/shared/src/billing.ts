export interface PlanDto {
  id: string;
  name: string;
  priceMonthly: number;
  currency: "MXN";
  maxBranches: number;
  maxStaff: number;
  maxCards: number;
}

export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled";

export interface BillingOverviewDto {
  status: SubscriptionStatus;
  plan: PlanDto;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
  usage: { branches: number; staff: number; cards: number };
  plans: PlanDto[];
}

export interface BillingCheckoutResponse {
  url: string;
}
