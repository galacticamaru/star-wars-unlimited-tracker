import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CollectionPage from '../app/collection/page';

// Mock the external dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

global.fetch = jest.fn();

describe('CollectionPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (global.fetch as jest.Mock).mockClear();
  });

  it('should handle successful CSV import', async () => {
    // Mock a successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 10 }),
    });

    render(<CollectionPage />);

    // Simulate file upload
    const file = new File([''], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Choose CSV File');
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for the success message
    await waitFor(() => {
      expect(screen.getByText('Successfully imported 10 cards for !')).toBeInTheDocument();
    });
  });

  it('should handle failed CSV import', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<CollectionPage />);

    // Simulate file upload
    const file = new File([''], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Choose CSV File');
    fireEvent.change(input, { target: { files: [file] } });

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please check your CSV format and columns.')).toBeInTheDocument();
    });
  });
});
