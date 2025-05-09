import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    try {
      return super.canActivate(context);
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token or access denied');
    }
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      this.logger.error(`JWT auth failed: ${err?.message || 'No user found'}`);
      throw err || new UnauthorizedException('Access denied');
    }
    return user;
  }
} 