import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';
import { AUTHORIZED_RLS_ACCOUNTS, findAuthorizedAccountByEmail } from '../lib/authRls.ts';

export async function ensureAuthorizedUsersSeeded() {
  try {
    const existing = await db.select().from(users);
    const existingUids = new Set(existing.map((u) => u.uid));

    for (const acc of AUTHORIZED_RLS_ACCOUNTS) {
      if (!existingUids.has(acc.uid)) {
        await db
          .insert(users)
          .values({
            uid: acc.uid,
            email: acc.email,
            name: acc.name,
            role: acc.profileTab,
          })
          .onConflictDoNothing();
      }
    }
  } catch (error) {
    console.error('Failed to seed authorized RLS users:', error);
  }
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  name?: string,
  role?: string
) {
  try {
    const existing = await getUserByUid(uid);
    if (existing) {
      return existing;
    }

    const matched = findAuthorizedAccountByEmail(email);
    const resolvedRole = role || matched?.profileTab || 'comissao';
    const resolvedName = name || matched?.name || 'Utilizador ITPGQ';

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: resolvedName,
        role: resolvedRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          role: resolvedRole,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database user upsert failed:', error);
    throw new Error('Failed to synchronize user profile.', { cause: error });
  }
}

export async function updateUserNameInDb(uid: string, newName: string) {
  try {
    const cleanName = newName.trim();
    const result = await db
      .update(users)
      .set({ name: cleanName })
      .where(eq(users.uid, uid))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Failed to rename user in database:', error);
    throw new Error('Failed to rename user in database.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid));
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function getUsers() {
  try {
    await ensureAuthorizedUsersSeeded();
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
