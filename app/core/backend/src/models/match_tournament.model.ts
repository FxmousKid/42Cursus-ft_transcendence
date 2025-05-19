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
import { Tournament } from './tournament.model';

interface MatchTournamentAttributes {
  id?: number;
  tournament_id: number;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  winner_name: string;
  status: string; // 'scheduled', 'in_progress', 'completed', 'cancelled'
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'match_tournaments',
  timestamps: true,
})
export class MatchTournament extends Model<MatchTournamentAttributes> {
  @ForeignKey(() => Tournament)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare tournament_id: number;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  declare player1_name: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  declare player2_name: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare player1_score: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare player2_score: number;

  @AllowNull(true)
  @Column(DataType.STRING(50))
  declare winner_name: string;

  @AllowNull(false)
  @Default('scheduled')
  @Column(DataType.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'))
  declare status: string;

  @BelongsTo(() => Tournament, 'tournament_id')
  declare tournament: Tournament;
}
