import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem('agriconnect_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('agriconnect_cart', JSON.stringify(cart));
  }, [cart]);

  // cart item: { product, quantity }
  // Note: Since orders currently require grouping by farmer_id, 
  // the checkout process will need to handle splitting if there are multiple farmers.
  function addToCart(product, quantity = 1) {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: Math.min(product.available_quantity, item.quantity + quantity) } 
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.available_quantity, quantity) }];
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price_per_unit * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
