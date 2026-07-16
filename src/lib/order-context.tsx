"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { safeLocalStorage } from "./safe-storage";

export interface OrderItem {
  id: string;
  type: "book" | "tool";
  title: string;
  author?: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    zipCode: string;
  };
  createdAt: string;
  estimatedDelivery?: string;
  cancellationReason?: string;
  cancelledAt?: string;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "createdAt" | "status">) => Order;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders from localStorage on mount
  useEffect(() => {
    const savedOrders = safeLocalStorage.getItem("mubarista_orders");
    if (savedOrders) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error("Failed to load orders:", e);
      }
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    safeLocalStorage.setItem("mubarista_orders", JSON.stringify(orders));
  }, [orders]);

  const addOrder = (order: Omit<Order, "id" | "createdAt" | "status">) => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      estimatedDelivery: calculateEstimatedDelivery(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const cancelOrder = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "cancelled",
              cancellationReason: reason,
              cancelledAt: new Date().toISOString(),
            }
          : order
      )
    );
  };

  const getOrderById = (orderId: string) => {
    return orders.find((order) => order.id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrderStatus,
        cancelOrder,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}

function calculateEstimatedDelivery(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7); // 7 days from now
  return date.toISOString();
}
