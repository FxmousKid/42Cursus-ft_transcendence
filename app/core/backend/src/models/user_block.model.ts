import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
  Index,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({
  tableName: 'user_blocks',
  timestamps: true,
  underscored: true,
})
export class UserBlock extends Model {
  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare blocker_id: number;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare blocked_id: number;

  @BelongsTo(() => User, 'blocker_id')
  declare blocker: User;

  @BelongsTo(() => User, 'blocked_id')
  declare blocked: User;

  @Index('unique_user_block')
  static indexes = [{
    unique: true,
    fields: ['blocker_id', 'blocked_id'],
  }];
} 