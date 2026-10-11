import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("loyalty_accounts")
export class LoyaltyAccount {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ name: "program_id", type: "char", length: 36 }) programId!: string;
  @Column({ name: "card_code", type: "varchar", length: 64, unique: true })
  cardCode!: string;
  @Column({ name: "customer_id", type: "char", length: 36, nullable: true })
  customerId!: string | null;
  @Column({ type: "int", default: 0 }) balance!: number;
  @Column({ type: "enum", enum: ["active", "disabled"], default: "active" })
  status!: "active" | "disabled";
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamp" }) updatedAt!: Date;
}
