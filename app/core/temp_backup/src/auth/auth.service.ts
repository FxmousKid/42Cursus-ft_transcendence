import { Injectable, ConflictException, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../user/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectModel(User)
        private userModel: typeof User,
        private jwtService: JwtService,
    ) {}

    async register(createUserDto: CreateUserDto): Promise<Partial<User>> {
        const { username, email, password } = createUserDto;
        this.logger.log(`Processing registration for user: ${username}, email: ${email}`);

        try {
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await this.userModel.findOne({
                where: {
                    [Op.or]: [
                        { username },
                        { email }
                    ]
                }
            });
            
            if (existingUser) {
                const field = existingUser.email === email ? 'email' : 'username';
                this.logger.warn(`Registration failed: ${field} already exists`);
                throw new ConflictException(`${field} already exists`);
            }
            
            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Créer l'utilisateur
            const newUser = await this.userModel.create({
                username,
                email,
                password: hashedPassword
            });

            // Retourner l'utilisateur sans le mot de passe
            const result = newUser.get({ plain: true });
            const { password: _, ...userWithoutPassword } = result;

            this.logger.log(`New user registered successfully: ${username}`);
            return userWithoutPassword;
        } catch (error: any) {
            if (error instanceof ConflictException) {
                throw error; // Re-lancer les exceptions de conflit
            }
            
            this.logger.error(`Registration error: ${error.message}`, error.stack);
            
            if (error.name === 'SequelizeUniqueConstraintError') {
                const field = error.errors[0]?.path;
                throw new ConflictException(
                    field ? `${field} already exists` : 'Username or email already exists'
                );
            }
            
            throw new InternalServerErrorException('Could not register user: ' + error.message);
        }
    }

    async login(email: string, password: string): Promise<any> {
        this.logger.log(`Login attempt for email: ${email}`);
        
        try {
            // Trouver l'utilisateur par email
            const user = await this.userModel.findOne({ where: { email } });
            
            if (!user) {
                this.logger.warn(`Login failed: No user found with email ${email}`);
                throw new UnauthorizedException('Invalid email or password');
            }
            
            // Vérifier le mot de passe
            const isPasswordValid = await bcrypt.compare(password, user.password);
            
            if (!isPasswordValid) {
                this.logger.warn(`Login failed: Invalid password for email ${email}`);
                throw new UnauthorizedException('Invalid email or password');
            }
            
            // Mettre à jour le statut de l'utilisateur
            user.status = 'online';
            await user.save();
            
            // Generate JWT token
            const payload = { 
                sub: user.id, 
                email: user.email,
                username: user.username 
            };
            
            // Retourner l'utilisateur sans le mot de passe et le token
            const result = user.get({ plain: true });
            const { password: _, ...userWithoutPassword } = result;
            
            this.logger.log(`User logged in successfully: ${user.username}`);
            return {
                ...userWithoutPassword,
                access_token: this.jwtService.sign(payload),
            };
        } catch (error) {
            this.logger.error(`Login error: ${error.message}`);
            throw error;
        }
    }
    
    async logout(userId: number): Promise<void> {
        try {
            const user = await this.userModel.findByPk(userId);
            
            if (!user) {
                throw new UnauthorizedException('User not found');
            }
            
            // Mettre à jour le statut de l'utilisateur
            user.status = 'offline';
            await user.save();
            
            this.logger.log(`User logged out successfully: ${user.username}`);
        } catch (error) {
            this.logger.error(`Logout error: ${error.message}`);
            throw error;
        }
    }
} 