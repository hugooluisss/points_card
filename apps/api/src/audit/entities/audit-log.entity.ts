import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "actor_id", type: "char", length: 36, nullable: true })
  actorId!: string | null;
  @Column({ name: "business_id", type: "char", length: 36, nullable: true })
  businessId!: string | null;
  @Column({ type: "varchar", length: 100 }) action!: string;
  @Column({ name: "target_id", type: "varchar", length: 255, nullable: true })
  targetId!: string | null;
  @Column({ type: "enum", enum: ["success", "failure"] }) result!:
    "success" | "failure";
  @CreateDateColumn({ name: "created_at", type: "timestamp" }) createdAt!: Date;
}
