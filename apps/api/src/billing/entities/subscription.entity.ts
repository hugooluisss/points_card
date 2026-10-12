import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { Business } from "../../businesses/entities/business.entity";
import { Plan } from "./plan.entity";

@Entity("subscriptions")
export class Subscription {
  @PrimaryColumn({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @OneToOne(() => Business)
  @JoinColumn({ name: "business_id" })
  business!: Business;
  @Column({ name: "plan_id", type: "char", length: 36 }) planId!: string;
  @ManyToOne(() => Plan) @JoinColumn({ name: "plan_id" }) plan!: Plan;
  @Column({ type: "enum", enum: ["trial", "active", "past_due", "canceled"] })
  status!: "trial" | "active" | "past_due" | "canceled";
  @Column({
    name: "stripe_customer_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripeCustomerId!: string | null;
  @Column({
    name: "stripe_subscription_id",
    type: "varchar",
    length: 255,
    nullable: true,
    unique: true,
  })
  stripeSubscriptionId!: string | null;
  @Column({ name: "trial_ends_at", type: "timestamp" }) trialEndsAt!: Date;
  @Column({ name: "current_period_end", type: "timestamp", nullable: true })
  currentPeriodEnd!: Date | null;
  @Column({ name: "grace_ends_at", type: "timestamp", nullable: true })
  graceEndsAt!: Date | null;
  @Column({ name: "canceled_at", type: "timestamp", nullable: true })
  canceledAt!: Date | null;
  @Column({ name: "retention_ends_at", type: "timestamp", nullable: true })
  retentionEndsAt!: Date | null;
  @Column({ name: "last_stripe_event_created", type: "int", nullable: true })
  lastStripeEventCreated!: number | null;
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamp" }) updatedAt!: Date;
}
