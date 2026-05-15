import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CreditCard, ShoppingCart, CheckCircle, Clock, Package, Loader2, DollarSign
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '../../lib/api';

interface Order {
  id: string;
  orderId: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export function PaymentSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paidCourses, setPaidCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/payments/orders`, { headers: getAuthHeaders() }).then(r => r.json()),
      fetch(`${API_BASE}/api/courses`).then(r => r.json()),
    ]).then(([o, c]) => {
      if (o.success) setOrders(o.orders);
      if (c.success) setPaidCourses(c.courses.filter((c: any) => !c.isFree && c.price > 0));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMockPay = async (courseId: string, courseTitle: string, price: number) => {
    setPaying(courseId);
    setMsg(null);
    try {
      // Create order
      const r1 = await fetch(`${API_BASE}/api/payments/orders`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ courseId }),
      });
      const d1 = await r1.json();

      if (!d1.success && !d1.order) {
        setMsg({ type: 'error', text: d1.message || 'Failed to create order' });
        return;
      }

      // Complete order (mock payment)
      const r2 = await fetch(`${API_BASE}/api/payments/orders/${d1.order?.orderId}/complete`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ paymentMethod: 'mock_card_visa' }),
      });
      const d2 = await r2.json();

      if (d2.success) {
        setMsg({ type: 'success', text: `Payment successful! You're enrolled in "${courseTitle}"` });
        load();
      } else {
        setMsg({ type: 'error', text: d2.message || 'Payment failed' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' });
    } finally {
      setPaying(null);
    }
  };

  const completedOrders = new Set(orders.filter(o => o.status === 'completed').map(o => o.courseId));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={40} className="animate-spin text-indigo-500" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Payments</h2>
        <p className="text-sm text-zinc-500 mt-1">Purchase paid courses (mock payment for demo)</p>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Available Paid Courses */}
      {paidCourses.length > 0 && (
        <div>
          <h3 className="font-bold mb-3 text-zinc-300">Paid Courses</h3>
          <div className="space-y-3">
            {paidCourses.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-white/20 transition-all"
              >
                <div className="flex-1">
                  <h4 className="font-bold">{course.title}</h4>
                  <p className="text-sm text-zinc-500">{course.category} • {course.difficulty}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">${course.price}</p>
                  <p className="text-xs text-zinc-500">USD</p>
                </div>
                {completedOrders.has(course.id) ? (
                  <div className="flex items-center gap-1 text-green-400 text-sm font-medium bg-green-500/10 px-4 py-2 rounded-xl">
                    <CheckCircle size={14} /> Purchased
                  </div>
                ) : (
                  <button onClick={() => handleMockPay(course.id, course.title, course.price)}
                    disabled={paying === course.id}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    {paying === course.id ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    {paying === course.id ? 'Processing...' : 'Buy Now'}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {paidCourses.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <DollarSign size={40} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">No paid courses available. All courses are currently free!</p>
        </div>
      )}

      {/* Order History */}
      {orders.length > 0 && (
        <div>
          <h3 className="font-bold mb-3 text-zinc-300">Order History</h3>
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.status === 'completed' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                  {order.status === 'completed' ? <CheckCircle size={18} className="text-green-400" /> : <Clock size={18} className="text-yellow-400" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{order.courseTitle}</h4>
                  <p className="text-xs text-zinc-500">Order #{order.orderId} • {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${order.amount}</p>
                  <span className={`text-xs capitalize ${order.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>{order.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
