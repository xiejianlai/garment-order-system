import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'default-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return {
      userId: payload.userId,
      companyId: payload.companyId,
      username: payload.username,
      realName: payload.realName,
      role: payload.role,
      customerId: payload.customerId,
      platform: payload.platform,
    };
  }
}
