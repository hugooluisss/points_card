import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("plans")
export class Plan {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column() name!: string;
  @Column({ name: "price_monthly", type: "decimal", precision: 10, scale: 2 })
  priceMonthly!: string;
  @Column({ type: "char", length: 3, default: "MXN" }) currency!: "MXN";
  @Column({ name: "max_branches", type: "int" }) maxBranches!: number;
  @Column({ name: "max_staff", type: "int" }) maxStaff!: number;
  @Column({ name: "max_cards", type: "int" }) maxCards!: number;
  @Column({
    name: "stripe_price_id",
    type: "varchar",
    length: 255,
    nullable: true,
    unique: true,
  })
  stripePriceId!: string | null;
  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamp" }) updatedAt!: Date;
}
