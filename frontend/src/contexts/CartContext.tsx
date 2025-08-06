import React, {createContext, useContext, useEffect, useState} from "react";

type CartItem = {
    productId: string; name: string; price: number; quantity: number; image_url: string[];
};

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (item: CartItem, quantity?: number) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "myApp_cart";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item: CartItem, quantity: number = 1) => {
        setCartItems((current) => {
            const index = current.findIndex((ci) => ci.productId === item.productId);
            if (index === -1) {
                return [...current, {...item, quantity}];
            } else {
                const updated = [...current];
                updated[index].quantity += quantity;
                return updated;
            }
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return;
        setCartItems((current) => current.map((item) => item.productId === productId ? {...item, quantity} : item));
    };

    const removeFromCart = (productId: string) => {
        setCartItems((current) => current.filter((item) => item.productId !== productId));
    };

    const clearCart = () => setCartItems([]);

    return (<CartContext.Provider
        value={{cartItems, addToCart, updateQuantity, removeFromCart, clearCart}}
    >
        {children}
    </CartContext.Provider>);
};

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
};
