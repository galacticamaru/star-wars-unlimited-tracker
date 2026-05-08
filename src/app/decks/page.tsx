import { getDecks } from '@/db/queries/decks';
import { getWantList } from '@/lib/want-list';
import { DecksClient } from '@/components/decks/decks-client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DecksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const userId = Number(session.user.id);

  const [decks, wantList] = await Promise.all([
    getDecks(userId),
    getWantList(userId),
  ]);

  return (
    <DecksClient 
        initialDecks={decks} 
        initialWantList={wantList} 
    />
  );
}
