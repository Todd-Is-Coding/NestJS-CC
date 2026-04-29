import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number; 

  @Column()
  currency: string; 

  @Column({ default: true })
  isActive: boolean; 
}
