import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModule } from './user/user.module';


@Module({
	imports: [
		SequelizeModule.forRoot({
			dialect: 'sqlite',
			storage: './data/db.sqlite',
			autoLoadModels: true,
			synchronize: true,
		}),
		UserModule,
	],
	controllers: [AppController],
	providers: [AppService],
})

export class AppModule {}
