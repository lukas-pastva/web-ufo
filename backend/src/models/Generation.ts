import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('generations')
export class Generation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64 })
  randomString: string;

  @Column({ type: 'datetime' })
  generatedAt: Date;

  @Column({ type: 'float', nullable: true })
  entropy: number;

  @Column({ type: 'float', nullable: true })
  chiSquared: number;

  @Column({ type: 'boolean', default: false })
  anomaly: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
