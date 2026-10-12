import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("customers")
export class Customer {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @Column({ type: "varchar", length: 255 }) name!: string;
  @Column({ type: "varchar", length: 320, nullable: true }) email!:
    string | null;
  @Column({ type: "varchar", length: 32, nullable: true }) phone!:
    string | null;
  @Column({ type: "date", nullable: true }) birthday!: string | null;
  @Column({ type: "enum", enum: ["active", "anonymized"], default: "active" })
  status!: "active" | "anonymized";
  @Column({ name: "anonymized_at", type: "timestamp", nullable: true })
  anonymizedAt!: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamp" }) updatedAt!: Date;
}
