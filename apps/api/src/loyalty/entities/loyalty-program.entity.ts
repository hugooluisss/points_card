import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Business } from "../../businesses/entities/business.entity";

@Entity("programs")
export class LoyaltyProgram {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @ManyToOne(() => Business, { onDelete: "CASCADE" })
  @JoinColumn({ name: "business_id" })
  business!: Business;
  @Column({ type: "varchar", length: 255 }) name!: string;
  @Column({ type: "enum", enum: ["stamps", "points"] }) mode!:
    "stamps" | "points";
  @Column({ type: "enum", enum: ["active", "inactive"], default: "inactive" })
  status!: "active" | "inactive";
  @Column({ name: "valid_from", type: "date" }) validFrom!: string;
  @Column({ name: "valid_until", type: "date", nullable: true }) validUntil!:
    string | null;
  @Column({ name: "stamps_goal", type: "int", nullable: true }) stampsGoal!:
    number | null;
  @Column({
    name: "points_per_currency_unit",
    type: "decimal",
    precision: 10,
    scale: 4,
    nullable: true,
  })
  pointsPerCurrencyUnit!: string | null;
  @Column({ name: "min_interval_minutes", type: "int", nullable: true })
  minIntervalMinutes!: number | null;
  @Column({
    name: "max_accumulations_per_card_per_day",
    type: "int",
    nullable: true,
  })
  maxAccumulationsPerCardPerDay!: number | null;
  @Column({
    name: "max_accumulations_per_staff_per_day",
    type: "int",
    nullable: true,
  })
  maxAccumulationsPerStaffPerDay!: number | null;
  @Column({ name: "max_points_per_operation", type: "int", nullable: true })
  maxPointsPerOperation!: number | null;
  @Column({ name: "staff_daily_alert_threshold", type: "int", nullable: true })
  staffDailyAlertThreshold!: number | null;
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamp" }) updatedAt!: Date;
}
