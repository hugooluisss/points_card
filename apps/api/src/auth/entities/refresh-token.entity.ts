import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ name: "staff_user_id", type: "char", length: 36 })
  staffUserId!: string;
  @Column({ name: "token_hash", type: "char", length: 64, unique: true })
  tokenHash!: string;
  @Column({ name: "family_id", type: "char", length: 36 }) familyId!: string;
  @Column({ name: "expires_at", type: "timestamp" }) expiresAt!: Date;
  @Column({ name: "revoked_at", type: "timestamp", nullable: true })
  revokedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
}
