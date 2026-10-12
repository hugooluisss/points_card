import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("billing_events")
export class BillingEvent {
  @PrimaryColumn({ name: "stripe_event_id", type: "varchar", length: 255 })
  stripeEventId!: string;
  @Column() type!: string;
  @Column({ name: "received_at", type: "timestamp" }) receivedAt!: Date;
  @Column({ name: "processed_at", type: "timestamp", nullable: true })
  processedAt!: Date | null;
  @Column({ name: "processing_until", type: "timestamp", nullable: true })
  processingUntil!: Date | null;
}
