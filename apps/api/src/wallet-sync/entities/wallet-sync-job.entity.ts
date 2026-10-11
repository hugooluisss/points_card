import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from "typeorm";

@Entity("wallet_sync_jobs")
export class WalletSyncJob {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ name: "account_id", type: "char", length: 36 }) accountId!: string;
  @Column({
    name: "pending_account_id",
    type: "char",
    length: 36,
    nullable: true,
  })
  pendingAccountId!: string | null;
  @Column({
    type: "enum",
    enum: ["pending", "processing", "done", "failed"],
    default: "pending",
  })
  status!: "pending" | "processing" | "done" | "failed";
  @Column({ type: "int", default: 0 }) attempts!: number;
  @Column({
    name: "next_attempt_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  nextAttemptAt!: Date;
  @Column({ name: "last_error", type: "text", nullable: true }) lastError!:
    string | null;
  @Column({ name: "locked_at", type: "timestamp", nullable: true })
  lockedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamp" }) updatedAt!: Date;
}
