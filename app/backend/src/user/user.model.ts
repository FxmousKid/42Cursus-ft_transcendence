import { Table, Column, Model } from 'sequelize-typescript'; 

@Table({ tableName: 'users' })
export class User extends Model<User> {

	@Column
	username: string;

	@Column
	password: string;
}
