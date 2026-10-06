import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { AUTHORIZED_RLS_ACCOUNTS, findAuthorizedAccountByEmail } from '../lib/authRls.ts';
import { getUserByUid } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    role?: 'superadmin' | 'secretaria' | 'comissao';
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso Negado (RLS 401): Token de sessão ausente.' });
  }

  const token = authHeader.split('Bearer ')[1];

  // 1. Verify Institutional RLS Token (itpgq-rls:<uid>:<rlsRole>:<timestamp>)
  if (token.startsWith('itpgq-rls:')) {
    const parts = token.split(':');
    const uid = parts[1];
    const matchedAccount = AUTHORIZED_RLS_ACCOUNTS.find((a) => a.uid === uid);
    if (!matchedAccount) {
      return res.status(403).json({
        error: 'Acesso Negado pela Política RLS: Conta institucional não autorizada.',
      });
    }

    const dbUser = await getUserByUid(uid);
    req.user = {
      uid: matchedAccount.uid,
      email: matchedAccount.email,
      name: dbUser?.name || matchedAccount.name,
      role: matchedAccount.profileTab,
    };
    return next();
  }

  // 2. Verify Firebase ID Token or Supabase JWT
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const matched = decodedToken.email
      ? findAuthorizedAccountByEmail(decodedToken.email)
      : undefined;
    if (!matched) {
      return res.status(403).json({
        error: 'Acesso Negado pela Política RLS: E-mail não autorizado na tabela public.users.',
      });
    }
    req.user = {
      uid: matched.uid,
      email: matched.email,
      name: matched.name,
      role: matched.profileTab,
    };
    return next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Acesso Negado (RLS 401): Sessão inválida ou expirada.' });
  }
};
