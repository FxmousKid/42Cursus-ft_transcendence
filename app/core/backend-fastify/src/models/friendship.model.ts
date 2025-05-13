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

interface FriendshipAttributes {
  id?: number;
  user_id: number;
  friend_id: number;
  status: string; // 'pending', 'accepted', 'rejected', 'blocked'
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'friendships',
  timestamps: true,
})
export class Friendship extends Model<FriendshipAttributes> {
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare user_id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare friend_id: number;

  @AllowNull(false)
  @Default('pending')
  @Column(DataType.ENUM('pending', 'accepted', 'rejected', 'blocked'))
  declare status: string;

  @BelongsTo(() => User, 'user_id')
  declare user: User;

  @BelongsTo(() => User, 'friend_id')
  declare friend: User;
} 