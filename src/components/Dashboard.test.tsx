import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = { name: 'Test User' };

  it('renders correctly and fetches data', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/sales')) {
        return Promise.resolve({ json: () => Promise.resolve({ sales: [] }), ok: true });
      }
      if (url.includes('/orders')) {
        return Promise.resolve({ 
          json: () => Promise.resolve({ orders: [{ id: 1, item: 'Mouse', quantity: 1, status: 'Pending' }] }), 
          ok: true 
        });
      }
    });

    render(<Dashboard user={mockUser} onLogout={vi.fn()} />);

    expect(screen.getByText(/Carregando dados/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Pedidos Recentes')).toBeInTheDocument();
    });

    expect(screen.getByText('Pedido #1')).toBeInTheDocument();
  });

  it('allows user to input payment amount', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/sales')) {
        return Promise.resolve({ json: () => Promise.resolve({ sales: [] }), ok: true });
      }
      if (url.includes('/orders')) {
        return Promise.resolve({ 
          json: () => Promise.resolve({ orders: [{ id: 1, item: 'Mouse', quantity: 1, status: 'Pending' }] }), 
          ok: true 
        });
      }
    });

    render(<Dashboard user={mockUser} onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Pedido #1')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Valor');
    fireEvent.change(input, { target: { value: '50' } });
    
    expect((input as HTMLInputElement).value).toBe('50');
  });

  it('allows user to create new order', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/sales')) {
        return Promise.resolve({ json: () => Promise.resolve({ sales: [] }), ok: true });
      }
      if (url.includes('/orders') && url.includes('localhost:3004')) {
        return Promise.resolve({ 
          json: () => Promise.resolve({ orders: [] }), 
          ok: true 
        });
      }
    });

    render(<Dashboard user={mockUser} onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Pedidos Recentes')).toBeInTheDocument();
    });

  const inputItem = screen.getByPlaceholderText('Nome do item');
    fireEvent.change(inputItem, { target: { value: 'Teclado' } });
    expect((inputItem as HTMLInputElement).value).toBe('Teclado');
  });

  it('registers a sale after successful payment', async () => {
    (global.fetch as any).mockImplementation((url: string, options: any) => {
      if (url.includes('/sales') && (!options || options.method === 'GET')) {
        return Promise.resolve({ json: () => Promise.resolve({ sales: [] }), ok: true });
      }
      if (url.includes('/orders')) {
        return Promise.resolve({ 
          json: () => Promise.resolve({ orders: [{ id: 1, item: 'Mouse', quantity: 1, status: 'Pending' }] }), 
          ok: true 
        });
      }
      if (url.includes('/pay') && options?.method === 'POST') {
        return Promise.resolve({ 
          json: () => Promise.resolve({ transactionId: '123' }), 
          ok: true 
        });
      }
      if (url.includes('/sales') && options?.method === 'POST') {
        return Promise.resolve({ 
          json: () => Promise.resolve({ sale: { id: 10, itemName: 'Mouse', amount: 50, date: '2026-07-08' } }), 
          ok: true 
        });
      }
    });
    
    // suppress alert in test
    window.alert = vi.fn();

    render(<Dashboard user={mockUser} onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Pedido #1')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Valor');
    fireEvent.change(input, { target: { value: '50' } });
    
    const payBtn = screen.getByText('Pagar');
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Pagamento aprovado! Transação: 123');
      // A sale should appear with value 50 and item Mouse
      expect(screen.getByText('$50')).toBeInTheDocument();
    });
  });
});
