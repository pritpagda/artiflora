import React, { useState } from 'react';
import type { Order, Product } from '../utils/types';
import api from '../utils/api';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderManagementProps {
  orders: Order[];
  loadingOrders: boolean;
  errorOrders: string | null;
  productMap: Map<string, Product>;
  fetchOrders: () => void;
  getToken: () => Promise<string>;
}

const OrderManagement = ({
  orders,
  loadingOrders,
  errorOrders,
  productMap,
  fetchOrders,
  getToken,
}: OrderManagementProps) => {
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingStatusId(orderId);
    try {
      const token = await getToken();
      await api.patch(
        `/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (loadingOrders) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    );
  }

  if (errorOrders) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 mr-3" />
          <div>
            <p className="font-bold">Error Loading Orders</p>
            <p>{errorOrders}</p>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return <p className="text-center text-stone-500 mt-8">No customer orders found.</p>;
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:bg-stone-50 transition-colors"
          onClick={() => navigate(`/orders/${order.id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') navigate(`/orders/${order.id}`);
          }}
        >
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <p className="text-sm text-stone-500">Order ID: {order.id}</p>
              <p className="font-bold text-stone-800">
                {order.first_name} {order.last_name}
              </p>
              <p className="text-sm text-stone-600">{order.email}</p>
              <p className="text-sm text-stone-600">{order.phone_number}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-rose-600">${order.total_price.toFixed(2)}</p>
              <p className="text-sm text-stone-500">
                Placed on: {new Date(order.created_at!).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="border-t border-b border-stone-200 my-4 py-4">
            <h4 className="font-semibold mb-2">Items</h4>
            <ul className="space-y-2">
              {order.items.map((item, index) => {
                const product = productMap.get(item.product_id);
                return (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="text-stone-700">
                      {item.quantity} x {product ? product.name : 'Unknown Product'}
                    </span>
                    <span className="text-stone-500">
                      {product ? `₹${(product.price * item.quantity).toFixed(2)}` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 mt-4">
            <div>
              <h4 className="font-semibold text-sm">Shipping Address</h4>
              <p className="text-sm text-stone-600">
                {order.address}, {order.city}, {order.state} {order.pincode}
              </p>
            </div>
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3"
            >
              <label htmlFor={`status-${order.id}`} className="text-sm font-medium">
                Status:
              </label>
              {updatingStatusId === order.id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <select
                  id={`status-${order.id}`}
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id!, e.target.value as Order['status'])}
                  className="rounded-md border-stone-300 shadow-sm focus:ring-rose-500 focus:border-rose-500 text-sm"
                >
                  <option>Pending</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderManagement;
