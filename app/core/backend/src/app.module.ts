import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from './user/user.module';
import { User } from './user/user.model';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
				  alter: false  // Désactiver les modifications de tables pour éviter les erreurs
				},
				logging: console.log, // Activer les logs pour debug avec fonction explicite
				models: [User],
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
		AuthModule,
	],
	controllers: [AppController],
	providers: [AppService],
})

export class AppModule {}
