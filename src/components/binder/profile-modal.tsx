'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
  currentTradeNote: string;
}

export function ProfileModal({
  open,
  onOpenChange,
  currentUsername,
  currentTradeNote,
}: ProfileModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [tradeNote, setTradeNote] = useState(currentTradeNote);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  // Re-seed fields from props every time the modal opens (D-04/UI-SPEC Interaction
  // Contract) so stale edits from a previously-cancelled open don't linger.
  useEffect(() => {
    if (open) {
      setUsername(currentUsername);
      setTradeNote(currentTradeNote);
      setError(false);
    }
  }, [open, currentUsername, currentTradeNote]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(false);
    const { error: saveError } = await authClient.updateUser({
      username: username.toLowerCase().trim(),
      displayUsername: username.trim(),
      tradeNote: tradeNote.trim(), // '' clears the note (D-05)
    });
    setIsSaving(false);
    if (!saveError) {
      onOpenChange(false);
    } else {
      setError(true);
    }
  };

  const isUnchanged = username === currentUsername && tradeNote === currentTradeNote;
  const publicUrl = username ? `swu-tracker.com/binder/${username}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Trade Profile</DialogTitle>
        <DialogDescription>
          Set your public username and trade note for your binder.
        </DialogDescription>

        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="profile-username" className="text-sm font-medium">
              Username
            </label>
            <Input
              id="profile-username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username..."
              className="mt-1"
            />
            {publicUrl && (
              <p className="text-[10px] mt-1 text-muted-foreground">
                Your binder will be at: {publicUrl}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-trade-note" className="text-sm font-medium">
              Trade Note <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              id="profile-trade-note"
              value={tradeNote}
              onChange={e => setTradeNote(e.target.value.slice(0, 140))}
              maxLength={140}
              rows={3}
              placeholder="e.g. EU only, will ship"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground text-right">{tradeNote.length}/140</p>
          </div>

          {error && (
            <p className="text-sm text-destructive">
              Couldn&apos;t save changes. Check your connection and try again.
            </p>
          )}
        </div>

        <DialogFooter className="items-end">
          <Button onClick={handleSave} disabled={isSaving || isUnchanged}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
