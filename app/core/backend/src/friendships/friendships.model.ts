import { Table, Column, Model, DataType, Default, ForeignKey, AllowNull } from 'sequelize-typescript';
import { User } from '../user/user.model';

interface FriendshipsAttributes {
	id?: number;
	user_id: number;
	friend_id: number;
	status: string;
	created_at: Date;
}

@Table({
	tableName: 'friendships'
})
export class Friendships extends Model<FriendshipsAttributes> {

	@ForeignKey(() => User)
	@AllowNull(false)
	@Column(DataType.BIGINT)
	declare user_id: number;

	@ForeignKey(() => User)
	@AllowNull(false)
	@Column(DataType.BIGINT)
	declare friend_id: number;

	@AllowNull(false)
	@Column(DataType.STRING(50))
	declare status: string;

	@AllowNull(false)
	@Default(DataType.NOW)
	@Column(DataType.DATE)
	declare created_at: Date;
}
