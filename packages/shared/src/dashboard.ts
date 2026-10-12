export type DashboardPeriod = "7d" | "30d" | "90d";

export interface KpiDto {
  value: number;
  previous: number;
}

export type ActivityType = "accumulate" | "redeem" | "adjust" | "reverse";

export interface ActivityItemDto {
  id: string;
  type: ActivityType;
  customerName: string | null;
  maskedCard: string;
  amount: number;
  programName: string;
  staffName: string;
  branchName: string;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummaryDto {
  period: DashboardPeriod;
  kpis: {
    registeredCustomers: KpiDto;
    issuedPasses: KpiDto;
    operations: KpiDto;
    redemptions: KpiDto;
  };
  savedPassesAvailable: boolean;
  operationsPerDay: { date: string; count: number }[];
  recent: ActivityItemDto[];
}

export interface MetricsDto {
  registrations: number;
  activeCustomers: number;
  repeatVisitRate: number;
  redemptionRate: number;
  issuedPasses: number;
  savedPasses: number | null;
}

export interface CustomerListItemDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: "active" | "anonymized";
  marketingConsent: boolean;
  cardStatus: "active" | "disabled" | "none";
  balance: number | null;
  lastVisitAt: string | null;
}

export interface CustomerDetailDto {
  customer: CustomerListItemDto;
  accounts: {
    id: string;
    programName: string;
    mode: "stamps" | "points";
    balance: number;
    status: string;
  }[];
  movements: ActivityItemDto[];
}

export interface BranchOptionDto {
  id: string;
  name: string;
}

export interface StaffOptionDto {
  id: string;
  name: string;
}

export interface RedemptionItemDto {
  id: string;
  customerName: string | null;
  maskedCard: string;
  rewardName: string;
  cost: number;
  status: "completed" | "reversed";
  branchName: string;
  staffName: string;
  createdAt: string;
}
