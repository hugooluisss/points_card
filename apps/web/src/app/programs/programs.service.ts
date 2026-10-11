import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { LoyaltyProgramDto, LoyaltyRewardDto } from '@points-card/shared';
import { API_BASE } from '../core/api-base';

export type ProgramInput = Pick<LoyaltyProgramDto, 'name' | 'mode' | 'validFrom'> &
  Partial<
    Omit<
      Pick<
        LoyaltyProgramDto,
        | 'validUntil'
        | 'stampsGoal'
        | 'pointsPerCurrencyUnit'
        | 'minIntervalMinutes'
        | 'maxAccumulationsPerCardPerDay'
        | 'maxAccumulationsPerStaffPerDay'
        | 'maxPointsPerOperation'
        | 'staffDailyAlertThreshold'
      >,
      'pointsPerCurrencyUnit'
    >
  > & { pointsPerCurrencyUnit?: number | null };
export type RewardInput = Pick<LoyaltyRewardDto, 'name' | 'cost'> &
  Partial<Pick<LoyaltyRewardDto, 'conditions'>>;

@Injectable({ providedIn: 'root' })
export class ProgramsService {
  private readonly http = inject(HttpClient);
  list() {
    return this.http.get<LoyaltyProgramDto[]>(`${API_BASE}/programs`);
  }
  get(id: string) {
    return this.http.get<LoyaltyProgramDto>(`${API_BASE}/programs/${id}`);
  }
  create(body: ProgramInput) {
    return this.http.post<LoyaltyProgramDto>(`${API_BASE}/programs`, body);
  }
  update(id: string, body: Partial<ProgramInput>) {
    return this.http.patch<LoyaltyProgramDto>(`${API_BASE}/programs/${id}`, body);
  }
  setActive(id: string, active: boolean) {
    return this.http.patch<LoyaltyProgramDto>(
      `${API_BASE}/programs/${id}/${active ? 'activate' : 'deactivate'}`,
      {},
    );
  }
  rewards(id: string) {
    return this.http.get<LoyaltyRewardDto[]>(`${API_BASE}/programs/${id}/rewards`);
  }
  createReward(id: string, body: RewardInput) {
    return this.http.post<LoyaltyRewardDto>(`${API_BASE}/programs/${id}/rewards`, body);
  }
  updateReward(id: string, rewardId: string, body: RewardInput) {
    return this.http.patch<LoyaltyRewardDto>(
      `${API_BASE}/programs/${id}/rewards/${rewardId}`,
      body,
    );
  }
  pauseReward(id: string, rewardId: string) {
    return this.http.delete<LoyaltyRewardDto>(`${API_BASE}/programs/${id}/rewards/${rewardId}`);
  }
}
