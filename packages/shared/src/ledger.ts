export type LedgerTransactionType =
  "accumulate" | "redeem" | "adjust" | "reverse";
export type LoyaltyAccountStatus = "active" | "disabled";
export type RedemptionStatus = "completed" | "reversed";

export interface CreateLoyaltyAccountRequest {
  programId: string;
}
export interface AccumulateRequest {
  cardCode: string;
  branchId?: string;
  idempotencyKey: string;
  purchaseAmount?: number;
  reference?: string;
}
export interface RedeemRequest {
  cardCode: string;
  branchId?: string;
  rewardId: string;
  idempotencyKey: string;
}
export interface AdjustRequest {
  cardCode: string;
  branchId?: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
}
export interface ReverseRequest {
  reason: string;
  idempotencyKey: string;
}
export interface LedgerTransactionDto {
  id: string;
  accountId: string;
  programId: string;
  branchId: string;
  type: LedgerTransactionType;
  amount: number;
  balance: number;
  rewardId: string | null;
  reason: string | null;
  createdAt: string;
}
export interface CardLookupResponse {
  accountId: string;
  cardCode: string;
  balance: number;
  progress: number;
  goal: number | null;
  rewardAvailable: boolean;
  rewards: Array<{
    id: string;
    name: string;
    cost: number;
    affordable: boolean;
  }>;
}
