import { useState, useEffect } from 'react';

export default function Dashboard({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [sales, setSales] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for new order
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  
  // State for payment amount (map of orderId to amount)
  const [paymentAmounts, setPaymentAmounts] = useState<Record<number, string>>({});

  const fetchData = async () => {
    try {
      const [salesRes, ordersRes] = await Promise.all([
        fetch('http://localhost:3003/sales'),
        fetch('http://localhost:3004/orders')
      ]);
      const salesData = await salesRes.json();
      const ordersData = await ordersRes.json();
      
      setSales(salesData.sales || []);
      setOrders(ordersData.orders || []);
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePay = async (orderId: number) => {
    const amountToPay = parseFloat(paymentAmounts[orderId] || '0');
    if (amountToPay <= 0) {
      alert('Por favor, informe um valor maior que zero.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3002/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount: amountToPay })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Pagamento aprovado! Transação: ${data.transactionId}`);
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'Paid' } : o));
        
        // Registrar a venda no sales-service
        const orderPaid = orders.find(o => o.id === orderId);
        if (orderPaid) {
          const salesRes = await fetch('http://localhost:3003/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemName: orderPaid.item, amount: amountToPay })
          });
          if (salesRes.ok) {
            const salesData = await salesRes.json();
            setSales(prevSales => [...prevSales, salesData.sale]);
          }
        }
      } else {
        alert('Erro no pagamento');
      }
    } catch (err) {
      alert('Erro de conexão ao payment-service');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    try {
      const res = await fetch('http://localhost:3004/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: newItemName, quantity: newQuantity })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Pedido criado com sucesso!');
        setOrders([...orders, data.order]);
        setNewItemName('');
        setNewQuantity(1);
      } else {
        alert('Erro ao criar pedido');
      }
    } catch (err) {
      alert('Erro de conexão ao order-service');
    }
  };

  const handlePaymentAmountChange = (orderId: number, value: string) => {
    setPaymentAmounts(prev => ({ ...prev, [orderId]: value }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Dashboard - Olá, {user.name}</h2>
        <button onClick={onLogout} className="btn-sm" style={{ background: 'transparent', border: '1px solid var(--border-color)' }}>Sair</button>
      </div>

      {loading ? <p>Carregando dados...</p> : (
        <div className="grid grid-cols-2">
          {/* Pedidos */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Pedidos Recentes</h3>
            </div>
            
            {/* Form to create new order */}
            <form onSubmit={handleCreateOrder} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Nome do item" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                style={{ flex: '1', minWidth: '150px' }}
                required
              />
              <input 
                type="number" 
                min="1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                style={{ width: '80px' }}
                required
              />
              <button type="submit" className="btn-sm">Novo Pedido</button>
            </form>

            {orders.length === 0 ? <p className="text-muted">Nenhum pedido encontrado.</p> : (
              <div>
                {orders.map(order => (
                  <div key={order.id} className="list-item" style={{ flexWrap: 'wrap' }}>
                    <div>
                      <strong>Pedido #{order.id}</strong>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>{order.item} (Qtd: {order.quantity})</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                      <span className={`badge ${order.status === 'Paid' ? 'badge-approved' : 'badge-pending'}`}>{order.status}</span>
                      {order.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="number" 
                            placeholder="Valor"
                            value={paymentAmounts[order.id] || ''}
                            onChange={(e) => handlePaymentAmountChange(order.id, e.target.value)}
                            style={{ width: '80px', padding: '0.4rem' }}
                          />
                          <button onClick={() => handlePay(order.id)} className="btn-sm btn-success">Pagar</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Vendas */}
          <div className="card">
            <h3>Histórico de Vendas</h3>
            {sales.length === 0 ? <p className="text-muted">Nenhuma venda encontrada.</p> : (
              <div>
                {sales.map(sale => (
                  <div key={sale.id} className="list-item">
                    <div>
                      <strong>{sale.itemName}</strong>
                      <div className="text-muted" style={{ fontSize: '0.875rem' }}>{sale.date}</div>
                    </div>
                    <div>
                      <span className="text-success">${sale.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
