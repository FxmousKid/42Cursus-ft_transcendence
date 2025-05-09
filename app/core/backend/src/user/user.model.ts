import {
  Table,
  Column,
  Model,
  DataType,
  Unique,
  AllowNull,
} from 'sequelize-typescript';

interface UserAttributes {
	id?: number;
	username: string;
	email: string;
	password: string;
}

@Table({ 
	tableName: 'users'
})
export class User extends Model<UserAttributes> {

	@AllowNull(false)
	@Unique
	@Column(DataType.STRING(50))
	declare username: string;

	@AllowNull(false)
	@Unique
	@Column(DataType.STRING(255))
	declare email: string;

	@AllowNull(false)
	@Column(DataType.STRING(255))
	declare password: string;
}
