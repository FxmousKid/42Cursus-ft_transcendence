import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from './user/user.module';
import { User } from './user/user.model';
import { Friendships } from './friendships/friendships.model';
import { AuthModule } from './auth/auth.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Matches } from './matches/matches.model';
import { MatchesModule } from './matches/matches.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		SequelizeModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				dialect: 'sqlite',
				storage: './data/db.sqlite',
				autoLoadModels: true,
				synchronize: true,
				// Configurations pour la synchronisation
				sync: {
					force: false, // Ne pas supprimer les tables existantes
					alter: true  // Enable alter to update table schema
				},
				logging: console.log, // Activer les logs pour debug avec fonction explicite
				models: [User, Friendships, Matches],
				// Additional SQLite options for better compatibility
				dialectOptions: {
					// For SQLite
					pragma: {
						foreign_keys: 1,
					},
				},
			}),
			inject: [ConfigService],
		}),
		UserModule,
		FriendshipsModule,
		MatchesModule,
		AuthModule,
	],
	controllers: [AppController],
	providers: [AppService],
})

export class AppModule { }
