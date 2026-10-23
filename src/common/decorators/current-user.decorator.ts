import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export type CurrentUserType = Omit<User, 'passwordHash'>;

export const CurrentUser = createParamDecorator(
  (
    data: keyof CurrentUserType | undefined,
    ctx: ExecutionContext,
  ): any => {
    const request = ctx.switchToHttp().getRequest<{ user?: CurrentUserType }>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
