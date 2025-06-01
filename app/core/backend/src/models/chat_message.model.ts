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

@Table({
  tableName: 'chat_messages',
  timestamps: true,
  underscored: true,
})
export class ChatMessage extends Model {
  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare sender_id: number;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare receiver_id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare content: string;

  @AllowNull(false)
  @Default('text')
  @Column(DataType.ENUM('text', 'game_invite', 'tournament_notification'))
  declare type: 'text' | 'game_invite' | 'tournament_notification';

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare read: boolean;

  @AllowNull(true)
  @Default('pending')
  @Column(DataType.ENUM('pending', 'accepted', 'rejected'))
  declare status?: 'pending' | 'accepted' | 'rejected';

  @BelongsTo(() => User, 'sender_id')
  declare sender: User;

  @BelongsTo(() => User, 'receiver_id')
  declare receiver: User;
} 