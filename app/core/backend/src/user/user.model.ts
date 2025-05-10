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
  avatar_url?: string;
  status?: string;
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
  
  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare avatar_url: string;
  
  @AllowNull(false)
  @Default('offline')
  @Column(DataType.ENUM('online', 'offline', 'in-game'))
  declare status: string;
}
