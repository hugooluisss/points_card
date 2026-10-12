import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type BusinessStatus = "active" | "suspended";

@Entity("businesses")
export class Business {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "enum", enum: ["active", "suspended"], default: "active" })
  status!: BusinessStatus;

  @Column({ type: "varchar", length: 100, default: "trial" })
  plan!: string;

  @Column({ name: "public_code", type: "varchar", length: 16, unique: true })
  publicCode!: string;

  @Column({ name: "brand_color", type: "varchar", length: 7, nullable: true })
  brandColor!: string | null;

  @Column({ name: "logo_url", type: "varchar", length: 500, nullable: true })
  logoUrl!: string | null;

  @Column({ name: "registration_fields", type: "json" })
  registrationFields!: { key: string; required: boolean }[];

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;
}
