import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';

// Définir l'interface pour le payload JWT
interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      const token = this.extractTokenFromRequest(request);
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }
      
      // Convertir d'abord en unknown, puis en JwtPayload
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret') as unknown as JwtPayload;
      
      // Ajouter l'utilisateur décodé à la requête
      request.user = {
        userId: payload.sub,
        email: payload.email,
        username: payload.username
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromRequest(request: any): string | null {
    // Vérifier l'en-tête Authorization
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Vérifier les cookies
    if (request.cookies && request.cookies.jwt) {
      return request.cookies.jwt;
    }
    
    return null;
  }
} 