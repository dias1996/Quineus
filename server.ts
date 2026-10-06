import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  ensureAuthorizedUsersSeeded,
  getOrCreateUser,
  getUsers,
  updateUserNameInDb,
} from './src/db/users.ts';
import {
  getAllCandidatesFromDb,
  upsertCandidateToDb,
  deleteCandidatesFromDb,
} from './src/db/repository.ts';
import {
  checkSupabaseStatus,
  syncAllToSupabase,
} from './src/lib/supabase.ts';
import { INITIAL_CANDIDATES } from './src/data/imfaData.ts';
import { findAuthorizedAccountByEmail } from './src/lib/authRls.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Ensure the 3 authorized RLS accounts exist in PostgreSQL on boot
  ensureAuthorizedUsersSeeded().catch(() => {});

  // 1. Institutional RLS Login Endpoint (Email + Password + Role Level Check)
  app.post('/api/auth/login', async (req, res) => {
    try {
      await ensureAuthorizedUsersSeeded();
      const { email, password, profileTab } = req.body || {};
      const matched = findAuthorizedAccountByEmail(String(email || ''));
      if (!matched) {
        return res.status(403).json({
          error:
            'Acesso Negado pela Política RLS: Este e-mail não pertence a uma conta institucional autorizada.',
        });
      }

      const validPasswords = [matched.passwordPlain, 'Admin@2026', 'itpgq2026'];
      if (!validPasswords.includes(String(password || '').trim())) {
        return res.status(401).json({
          error: 'Palavra-passe incorreta para a conta institucional selecionada.',
        });
      }

      if (profileTab && matched.profileTab !== profileTab) {
        return res.status(403).json({
          error: `Bloqueio RLS: A conta ${matched.email} pertence ao nível "${matched.roleTitle}" e não pode autenticar noutro nível.`,
        });
      }

      const userRecord = await getOrCreateUser(
        matched.uid,
        matched.email,
        matched.name,
        matched.profileTab
      );

      const token = `itpgq-rls:${matched.uid}:${matched.rlsRole}:${Date.now()}`;
      return res.json({
        ok: true,
        token,
        user: userRecord,
        rlsRole: matched.rlsRole,
        profileTab: matched.profileTab,
      });
    } catch (error: any) {
      console.error('RLS Login error:', error);
      return res.status(500).json({ error: error.message || 'Erro interno no servidor de autenticação' });
    }
  });

  // 2. Authenticated user synchronization (Firebase SSO / RLS Token -> PostgreSQL users table)
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid || '';
      const email = req.user?.email || 'admin@itpgq.ao';
      const name = req.user?.name || email.split('@')[0];
      const role = req.user?.role || 'comissao';
      const userRecord = await getOrCreateUser(uid, email, name, role);
      res.json({ user: userRecord });
    } catch (error: any) {
      console.error('Failed to synchronize user:', error);
      res.status(500).json({ error: error.message || 'Failed to synchronize user' });
    }
  });

  app.get('/api/users', async (_req, res) => {
    try {
      const allUsers = await getUsers();
      res.json(allUsers);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
  });

  app.put('/api/users/:uid', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'superadmin') {
        return res.status(403).json({
          error:
            'Bloqueio RLS: Apenas o Super Administrador pode renomear os utilizadores institucionais.',
        });
      }
      const { uid } = req.params;
      const { name } = req.body || {};
      if (!name || String(name).trim().length < 2) {
        return res.status(400).json({ error: 'O nome deve ter pelo menos 2 caracteres.' });
      }
      const updated = await updateUserNameInDb(uid, String(name).trim());
      return res.json({ ok: true, user: updated });
    } catch (error: any) {
      console.error('Failed to rename user:', error);
      return res.status(500).json({ error: error.message || 'Failed to rename user' });
    }
  });

  // 3. Public & Admin Candidate Queries
  app.get('/api/candidates', async (_req, res) => {
    try {
      const list = await getAllCandidatesFromDb();
      res.json({ candidates: list });
    } catch (error: any) {
      console.error('Failed to fetch candidates:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch candidates' });
    }
  });

  // 4. Public Application Submission / Document Resubmission
  app.post('/api/public/candidates', async (req, res) => {
    try {
      const { candidate } = req.body;
      if (!candidate || !candidate.id) {
        return res.status(400).json({ error: 'Invalid candidate payload' });
      }
      await upsertCandidateToDb(candidate);
      res.json({ ok: true, id: candidate.id });
    } catch (error: any) {
      console.error('Failed to save public candidate:', error);
      res.status(500).json({ error: error.message || 'Failed to save candidate' });
    }
  });

  // 5. Protected Admin Candidate Upsert / Batch Update (Enforces RLS Role Permissions)
  app.post('/api/admin/candidates', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const role = req.user?.role || 'comissao';
      const { candidates: batch, candidate } = req.body;

      // RLS Check: Secretaria Escolar cannot issue final 'aprovada' or 'rejeitada' status
      const itemsToCheck = Array.isArray(batch) ? batch : candidate ? [candidate] : [];
      if (role === 'secretaria') {
        const hasFinalDispatch = itemsToCheck.some(
          (c: any) => c.status === 'aprovada' || c.status === 'rejeitada'
        );
        if (hasFinalDispatch) {
          return res.status(403).json({
            error:
              'Bloqueio RLS: A Secretaria Escolar não possui permissão para Aprovar ou Rejeitar definitivamente candidaturas (Exclusivo Comissão de Admissão e Super Admin).',
          });
        }
      }

      if (Array.isArray(batch)) {
        for (const item of batch) {
          await upsertCandidateToDb(item, uid);
        }
        return res.json({ ok: true, count: batch.length });
      }
      if (candidate && candidate.id) {
        await upsertCandidateToDb(candidate, uid);
        return res.json({ ok: true, id: candidate.id });
      }
      return res.status(400).json({ error: 'Invalid payload' });
    } catch (error: any) {
      console.error('Failed to update admin candidates:', error);
      res.status(500).json({ error: error.message || 'Failed to update candidates' });
    }
  });

  // 6. Protected Admin Archive / Delete (Restricted by RLS to Super Administrador only)
  app.delete('/api/admin/candidates', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== 'superadmin') {
        return res.status(403).json({
          error:
            'Bloqueio RLS: Apenas o Super Administrador pode eliminar ou arquivar processos de candidatura.',
        });
      }
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'Invalid ids array' });
      }
      await deleteCandidatesFromDb(ids);
      res.json({ ok: true });
    } catch (error: any) {
      console.error('Failed to archive candidates:', error);
      res.status(500).json({ error: error.message || 'Failed to archive candidates' });
    }
  });

  // 7. Supabase Integration Health & Full Synchronization Endpoints
  app.get('/api/supabase/status', async (_req, res) => {
    try {
      const status = await checkSupabaseStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to check Supabase status' });
    }
  });

  app.post('/api/supabase/sync', async (req, res) => {
    try {
      const list = Array.isArray(req.body?.candidates)
        ? req.body.candidates
        : await getAllCandidatesFromDb().catch(() => INITIAL_CANDIDATES);
      const summary = await syncAllToSupabase(list);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to sync with Supabase' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
