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

interface MatchAttributes {
  id?: number;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  winner_id?: number;
  status: string; // 'scheduled', 'in_progress', 'completed', 'cancelled'
  match_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'matches',
  timestamps: true,
})
export class Match extends Model<MatchAttributes> {
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare player1_id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare player2_id: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare player1_score: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare player2_score: number;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare winner_id: number;

  @AllowNull(false)
  @Default('scheduled')
  @Column(DataType.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'))
  declare status: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare match_date: Date;

  @BelongsTo(() => User, 'player1_id')
  declare player1: User;

  @BelongsTo(() => User, 'player2_id')
  declare player2: User;

  @BelongsTo(() => User, 'winner_id')
  declare winner: User;
} 