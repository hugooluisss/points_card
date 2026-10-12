import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("consents")
export class Consent {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ name: "customer_id", type: "char", length: 36 })
  customerId!: string;
  @Column({ type: "enum", enum: ["privacy_notice", "marketing"] }) purpose!:
    "privacy_notice" | "marketing";
  @Column({ type: "enum", enum: ["wallet", "email", "sms", "all"] }) channel!:
    "wallet" | "email" | "sms" | "all";
  @Column({ name: "notice_version", type: "int", nullable: true })
  noticeVersion!: number | null;
  @Column({ type: "enum", enum: ["granted", "revoked"] }) status!:
    "granted" | "revoked";
  @Column({
    type: "enum",
    enum: ["registration", "recovery_link", "admin", "arco"],
  })
  origin!: "registration" | "recovery_link" | "admin" | "arco";
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
}
