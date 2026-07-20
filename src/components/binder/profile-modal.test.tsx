/**
 * @vitest-environment jsdom
 */
import { expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    updateUser: vi.fn(),
  },
}));

import { authClient } from '@/lib/auth-client';
import { ProfileModal } from './profile-modal';

const mockUpdateUser = authClient.updateUser as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockUpdateUser.mockReset();
});

test('renders username input seeded from currentUsername, helper text, and note textarea seeded from currentTradeNote', () => {
  render(
    <ProfileModal
      open
      onOpenChange={vi.fn()}
      currentUsername="lukeskywalker"
      currentTradeNote="EU only, will ship"
    />
  );

  expect(screen.getByDisplayValue('lukeskywalker')).toBeDefined();
  expect(
    screen.getByText('Your binder will be at: swu-tracker.com/binder/lukeskywalker')
  ).toBeDefined();
  expect(screen.getByDisplayValue('EU only, will ship')).toBeDefined();
});

test('typing into the textarea clamps to 140 characters and the counter updates per keystroke', () => {
  render(
    <ProfileModal
      open
      onOpenChange={vi.fn()}
      currentUsername="lukeskywalker"
      currentTradeNote=""
    />
  );

  const textarea = screen.getByPlaceholderText('e.g. EU only, will ship');
  expect(screen.getByText('0/140')).toBeDefined();

  fireEvent.change(textarea, { target: { value: 'a'.repeat(200) } });
  expect((textarea as HTMLTextAreaElement).value.length).toBe(140);
  expect(screen.getByText('140/140')).toBeDefined();

  fireEvent.change(textarea, { target: { value: 'short note' } });
  expect(screen.getByText('10/140')).toBeDefined();
});

test('clicking Save calls authClient.updateUser with lowercased+trimmed username, trimmed displayUsername, and trimmed tradeNote in one call', async () => {
  mockUpdateUser.mockResolvedValue({ error: null });
  const onOpenChange = vi.fn();

  render(
    <ProfileModal
      open
      onOpenChange={onOpenChange}
      currentUsername="lukeskywalker"
      currentTradeNote="old note"
    />
  );

  const usernameInput = screen.getByDisplayValue('lukeskywalker');
  fireEvent.change(usernameInput, { target: { value: '  LukeSkywalker  ' } });

  const textarea = screen.getByDisplayValue('old note');
  fireEvent.change(textarea, { target: { value: '  new note  ' } });

  fireEvent.click(screen.getByText('Save Profile'));

  await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledTimes(1));
  expect(mockUpdateUser).toHaveBeenCalledWith({
    username: 'lukeskywalker',
    displayUsername: 'LukeSkywalker',
    tradeNote: 'new note',
  });
});

test('clearing the textarea and saving sends tradeNote: "" to clear the note', async () => {
  mockUpdateUser.mockResolvedValue({ error: null });

  render(
    <ProfileModal
      open
      onOpenChange={vi.fn()}
      currentUsername="lukeskywalker"
      currentTradeNote="old note"
    />
  );

  const textarea = screen.getByDisplayValue('old note');
  fireEvent.change(textarea, { target: { value: '' } });

  fireEvent.click(screen.getByText('Save Profile'));

  await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledTimes(1));
  expect(mockUpdateUser).toHaveBeenCalledWith(
    expect.objectContaining({ tradeNote: '' })
  );
});

test('Save is disabled when neither field has changed from its seeded value', () => {
  render(
    <ProfileModal
      open
      onOpenChange={vi.fn()}
      currentUsername="lukeskywalker"
      currentTradeNote="old note"
    />
  );

  const saveButton = screen.getByText('Save Profile').closest('button');
  expect((saveButton as HTMLButtonElement).disabled).toBe(true);

  const textarea = screen.getByDisplayValue('old note');
  fireEvent.change(textarea, { target: { value: 'new note' } });
  expect((saveButton as HTMLButtonElement).disabled).toBe(false);
});

test('Save is disabled while a save is in flight', async () => {
  let resolveSave: (value: { error: null }) => void = () => {};
  mockUpdateUser.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveSave = resolve;
      })
  );

  render(
    <ProfileModal
      open
      onOpenChange={vi.fn()}
      currentUsername="lukeskywalker"
      currentTradeNote="old note"
    />
  );

  const textarea = screen.getByDisplayValue('old note');
  fireEvent.change(textarea, { target: { value: 'new note' } });

  const saveButton = screen.getByText('Save Profile').closest('button');
  fireEvent.click(saveButton!);

  await waitFor(() => expect((saveButton as HTMLButtonElement).disabled).toBe(true));

  resolveSave({ error: null });
});

test('when updateUser resolves with an error, the modal stays open and shows the inline error copy', async () => {
  mockUpdateUser.mockResolvedValue({ error: { message: 'failed' } });
  const onOpenChange = vi.fn();

  render(
    <ProfileModal
      open
      onOpenChange={onOpenChange}
      currentUsername="lukeskywalker"
      currentTradeNote="old note"
    />
  );

  const textarea = screen.getByDisplayValue('old note');
  fireEvent.change(textarea, { target: { value: 'new note' } });
  fireEvent.click(screen.getByText('Save Profile'));

  await waitFor(() =>
    expect(
      screen.getByText("Couldn't save changes. Check your connection and try again.")
    ).toBeDefined()
  );
  expect(onOpenChange).not.toHaveBeenCalled();
});

test('when updateUser resolves without an error, onOpenChange(false) is called to close the modal', async () => {
  mockUpdateUser.mockResolvedValue({ error: null });
  const onOpenChange = vi.fn();

  render(
    <ProfileModal
      open
      onOpenChange={onOpenChange}
      currentUsername="lukeskywalker"
      currentTradeNote="old note"
    />
  );

  const textarea = screen.getByDisplayValue('old note');
  fireEvent.change(textarea, { target: { value: 'new note' } });
  fireEvent.click(screen.getByText('Save Profile'));

  await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
});
