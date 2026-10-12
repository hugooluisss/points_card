import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("loyalty_transactions")
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ name: "branch_id", type: "char", length: 36 }) branchId!: string;
  @Column({ name: "account_id", type: "char", length: 36 }) accountId!: string;
  @Column({ name: "program_id", type: "char", length: 36 }) programId!: string;
  @Column({ type: "enum", enum: ["accumulate", "redeem", "adjust", "reverse"] })
  type!: "accumulate" | "redeem" | "adjust" | "reverse";
  @Column({ type: "int" }) amount!: number;
  @Column({
    name: "purchase_amount",
    type: "decimal",
    precision: 12,
    scale: 2,
    nullable: true,
  })
  purchaseAmount!: string | null;
  @Column({ name: "reward_id", type: "char", length: 36, nullable: true })
  rewardId!: string | null;
  @Column({ type: "varchar", length: 255, nullable: true }) reference!:
    string | null;
  @Column({ type: "varchar", length: 255, nullable: true }) reason!:
    string | null;
  @Column({
    name: "reverses_transaction_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  reversesTransactionId!: string | null;
  @Column({ name: "actor_id", type: "char", length: 36 }) actorId!: string;
  @Column({ name: "idempotency_key", type: "varchar", length: 100 })
  idempotencyKey!: string;
  @Column({
    name: "created_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}
