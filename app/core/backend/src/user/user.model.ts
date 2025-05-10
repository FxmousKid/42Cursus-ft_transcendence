import {
  Table,
  Column,
  Model,
  DataType,
  Unique,
  AllowNull,
  Default,
} from 'sequelize-typescript';

interface UserAttributes {
	id?: number;
	username: string;
	email: string;
	password: string;
	status?: string;
	avatar_url?: string;
}

@Table({
  tableName: 'users',
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
	
	@AllowNull(false)
	@Default('offline')
	@Column(DataType.STRING(20))
	declare status: string;
	
	@AllowNull(true)
	@Column(DataType.STRING(255))
	declare avatar_url: string;
}
