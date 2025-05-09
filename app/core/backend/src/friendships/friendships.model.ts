import { Table, Column, Model, DataType, AllowNull } from 'sequelize-typescript';

interface FriendshipsAttributes {
	id?: number;
	user_id: number;
	friend_id: number;
	status: string;
	created_at: string;
}

@Table({
	tableName: 'friendships'
})
export class Friendships extends Model<FriendshipsAttributes> {

	@AllowNull(false)
	@Column(DataType.BIGINT)
	declare user_id: number;

	@AllowNull(false)
	@Column(DataType.BIGINT)
	declare friend_id: number;

	@AllowNull(false)
	@Column(DataType.STRING(50))
	declare status: string;

	@AllowNull(false)
	@Column(DataType.STRING(50))
	declare created_at: string;
}
