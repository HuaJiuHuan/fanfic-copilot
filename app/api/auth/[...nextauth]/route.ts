import { Auth } from '@auth/core';
import { authConfig } from '@/lib/auth';

export async function request(req: Request) {
  return Auth(req, authConfig);
}

export { request as GET, request as POST };
