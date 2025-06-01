import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Default,
} from 'sequelize-typescript';
import { User } from './user.model';

interface TournamentAttributes {
  id?: number;
  host_id: number;
  users: string[]; // 'iyan,joey,etc'
  status: string; // 'pending', 'finished', 'on-going'
  created_at?: Date;
  updated_at?: Date;
}

interface TournamentCreationAttributes extends Omit<TournamentAttributes, 'id' | 'created_at' | 'updated_at'> {}

@Table({
  tableName: 'tournaments',
  timestamps: true,
})
export class Tournament extends Model<TournamentAttributes, TournamentCreationAttributes> {
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare host_id: number;

  @AllowNull(false)
  @Column({type: DataType.TEXT,
    get(this: Tournament): string[] {
      const raw = this.getDataValue('users') as unknown as string;
      return raw ? JSON.parse(raw) : [];
    },
    set(this: Tournament, val: string[]) {
      this.setDataValue('users', JSON.stringify(val) as any);
    }
  })
  declare users: string[];

  @AllowNull(false)
  @Default('pending')
  @Column(DataType.ENUM('finished', 'on-going'))
  declare status: string;

  @BelongsTo(() => User, 'host_id')
  declare user: User;

} 