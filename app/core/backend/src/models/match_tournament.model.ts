import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Default,
  PrimaryKey,
} from 'sequelize-typescript';
import { Tournament } from './tournament.model';

interface MatchTournamentAttributes {
  id?: string; // UUID au lieu d'un number
  tournament_id: number;
  player1_name: string;
  player2_name: string;
  player1_score: number;
  player2_score: number;
  winner_name: string;
  status: string; // 'scheduled', 'in_progress', 'completed', 'cancelled'
  blockchain_tx_hash?: string; // Hash de la transaction blockchain
  blockchain_verified?: boolean; // Statut de vérification blockchain
  blockchain_recorded_at?: Date; // Quand enregistré sur blockchain
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'match_tournaments',
  timestamps: true,
})
export class MatchTournament extends Model<MatchTournamentAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

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

  // 🔗 PREUVES BLOCKCHAIN
  @AllowNull(true)
  @Column(DataType.STRING(66)) // Hash Ethereum = 66 caractères (0x + 64 hex)
  declare blockchain_tx_hash: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare blockchain_verified: boolean;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare blockchain_recorded_at: Date;

  @BelongsTo(() => Tournament, 'tournament_id')
  declare tournament: Tournament;
}
