import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("privacy_notices")
export class PrivacyNotice {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ type: "int" }) version!: number;
  @Column({ type: "text" }) text!: string;
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
}
