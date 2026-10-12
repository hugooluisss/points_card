import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("wallet_passes")
export class WalletPass {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ name: "account_id", type: "char", length: 36 }) accountId!: string;
  @Column({ type: "enum", enum: ["google", "apple"] }) platform!:
    "google" | "apple";
  @Column({
    name: "external_ref",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  externalRef!: string | null;
  @Column({ type: "enum", enum: ["issued", "disabled"], default: "issued" })
  status!: "issued" | "disabled";
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
}
