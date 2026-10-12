import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("redemptions")
export class Redemption {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ name: "account_id", type: "char", length: 36 }) accountId!: string;
  @Column({ name: "reward_id", type: "char", length: 36 }) rewardId!: string;
  @Column({ name: "transaction_id", type: "char", length: 36, unique: true })
  transactionId!: string;
  @Column({
    type: "enum",
    enum: ["completed", "reversed"],
    default: "completed",
  })
  status!: "completed" | "reversed";
  @Column({
    name: "created_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;
}
