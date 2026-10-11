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
import { LoyaltyProgram } from "./loyalty-program.entity";

@Entity("rewards")
export class LoyaltyReward {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "business_id", type: "char", length: 36 })
  businessId!: string;
  @ManyToOne(() => Business, { onDelete: "CASCADE" })
  @JoinColumn({ name: "business_id" })
  business!: Business;
  @Column({ name: "program_id", type: "char", length: 36 }) programId!: string;
  @ManyToOne(() => LoyaltyProgram, { onDelete: "CASCADE" })
  @JoinColumn({ name: "program_id" })
  program!: LoyaltyProgram;
  @Column({ type: "varchar", length: 255 }) name!: string;
  @Column({ type: "int" }) cost!: number;
  @Column({ type: "text", nullable: true }) conditions!: string | null;
  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamp" }) updatedAt!: Date;
}
