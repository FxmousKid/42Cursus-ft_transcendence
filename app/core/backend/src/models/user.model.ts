import {
  Table,
  Column,
  Model,
  DataType,
  Unique,
  AllowNull,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { Friendship } from './friendship.model';
import { Match } from './match.model';

interface UserAttributes {
  id?: number;
  username: string;
  email: string;
  password?: string;
  status?: string;
  avatar_url?: string;
  google_id?: string;
  avatar_data?: Buffer | null;
  avatar_mime_type?: string | null;
  two_factor_enabled?: boolean;
  two_factor_secret?: string;
  two_factor_temp_secret?: string;
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

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare password: string;
  
  @AllowNull(false)
  @Default('offline')
  @Column(DataType.STRING(20))
  declare status: string;
  
  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare avatar_url: string;
  
  @AllowNull(true)
  @Unique
  @Column(DataType.STRING(255))
  declare google_id: string;

  @AllowNull(true)
  @Column(DataType.BLOB('long'))
  declare avatar_data: Buffer | null;  // FIXED: Added | null

  @AllowNull(true)
  @Column(DataType.STRING(50))
  declare avatar_mime_type: string | null;  // FIXED: Added | null

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare two_factor_enabled: boolean;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare two_factor_secret: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare two_factor_temp_secret: string | null;

  // Relationships
  @HasMany(() => Friendship, 'user_id')
  declare sent_friendships: Friendship[];

  @HasMany(() => Friendship, 'friend_id')
  declare received_friendships: Friendship[];

  @HasMany(() => Match, 'player1_id')
  declare matches_as_player1: Match[];

  @HasMany(() => Match, 'player2_id')
  declare matches_as_player2: Match[];
}