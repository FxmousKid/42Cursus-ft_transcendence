import { Table, Column, Model, DataType, ForeignKey, AllowNull } from 'sequelize-typescript';
import { User } from '../user/user.model';

interface MatchesAttributes {
	id?: number;
	match_type: string;
	player1_id: number;
	player2_id: number;
	score_player1: number;
	score_player2: number;
	winner_id: number;
	status: string;
}

@Table({
	tableName: 'matches'
})
export class Matches extends Model<MatchesAttributes> {

	@AllowNull(false)
	@Column(DataType.STRING(20))
	declare match_type: string;

	@ForeignKey(() => User)
	@AllowNull(false)
	@Column(DataType.BIGINT)
	declare player1_id: number;

	@ForeignKey(() => User)
	@AllowNull(false)
	@Column(DataType.BIGINT)
	declare player2_id: number;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare score_player1: number;

	@AllowNull(false)
	@Column(DataType.INTEGER)
	declare score_player2: number;

	@ForeignKey(() => User)
	@AllowNull(false)
	@Column(DataType.BIGINT)
	declare winner_id: number;

	@AllowNull(false)
	@Column(DataType.STRING(50))
	declare status: string;
}
