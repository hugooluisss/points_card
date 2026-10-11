import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type BusinessStatus = 'active' | 'suspended';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: ['active', 'suspended'], default: 'active' })
  status!: BusinessStatus;

  @Column({ type: 'varchar', length: 100, default: 'trial' })
  plan!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
