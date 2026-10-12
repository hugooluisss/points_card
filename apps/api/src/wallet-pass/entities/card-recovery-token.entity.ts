import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("card_recovery_tokens")
export class CardRecoveryToken {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ name: "customer_id", type: "char", length: 36 })
  customerId!: string;
  @Column({ name: "token_hash", type: "char", length: 64, unique: true })
  tokenHash!: string;
  @Column({ name: "expires_at", type: "timestamp" }) expiresAt!: Date;
  @Column({ name: "used_at", type: "timestamp", nullable: true })
  usedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
}
