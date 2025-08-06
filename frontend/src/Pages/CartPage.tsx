import React from "react";
import { useCart } from "../contexts/CartContext";
import { Link } from "react-router-dom";
import { ChevronLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const EmptyCart = () => (
    <div className="flex min-h-[70vh] items-center justify-center bg-stone-50 p-6 text-center font-sans">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center"
        >
            <ShoppingBag size={64} className="mx-auto text-stone-300" />
            <h1 className="mt-8 font-serif text-4xl font-bold text-stone-800">
                Your Cart is a Blank Canvas
            </h1>
            <p className="mt-3 max-w-md text-stone-500">
                It looks like you haven't added any beautiful creations yet. Find something you love!
            </p>
            <Link
                to="/products"
                className="mt-8 inline-block transform rounded-full bg-rose-600 px-10 py-4 font-semibold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-500/30"
            >
                Explore The Collection
            </Link>
        </motion.div>
    </div>
);

const CartItem = ({ item, onUpdate, onRemove }: {
    item: any;
    onUpdate: (id: string, qty: number) => void;
    onRemove: (id: string) => void;
}) => (
    <motion.li
        layout
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
        className="flex items-center py-6"
    >
        <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200">
            <img
                src={item.image_url?.[0] || 'https://via.placeholder.com/150'}
                alt={item.name}
                className="h-full w-full object-cover object-center"
            />
        </div>
        <div className="ml-4 flex flex-1 flex-col sm:ml-6">
            <div className="flex justify-between font-serif text-lg font-medium text-stone-900">
                <h3>
                    <Link to={`/products/${item.productId}`} className="hover:text-rose-700">
                        {item.name}
                    </Link>
                </h3>
                <p className="ml-4 font-sans font-semibold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                </p>
            </div>
            <p className="mt-1 text-sm text-stone-500">
                ₹{item.price.toFixed(2)} each
            </p>
            <div className="mt-4 flex flex-1 items-end justify-between text-sm">
                <div className="flex items-center rounded-full border border-stone-300">
                    <button
                        onClick={() => onUpdate(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="rounded-l-full p-2 text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-50"
                    >
                        <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                    <button
                        onClick={() => onUpdate(item.productId, item.quantity + 1)}
                        className="rounded-r-full p-2 text-stone-600 transition-colors hover:bg-stone-100"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                <button
                    onClick={() => onRemove(item.productId)}
                    type="button"
                    className="flex items-center gap-1.5 font-medium text-stone-500 transition-colors hover:text-red-600"
                >
                    <Trash2 size={16} /> Remove
                </button>
            </div>
        </div>
    </motion.li>
);

const CartPage: React.FC = () => {
    const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cartItems.length === 0) {
        return <EmptyCart />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-stone-50 font-sans"
        >
            <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-20">
                <header className="mb-10 text-center">
                    <h1 className="font-serif text-5xl font-bold text-stone-800">Shopping Cart</h1>
                    <Link
                        to="/products"
                        className="mt-4 inline-flex items-center gap-1.5 font-semibold text-rose-600 transition-colors hover:text-rose-500"
                    >
                        <ChevronLeft size={16} />
                        Continue Shopping
                    </Link>
                </header>

                <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flow-root">
                        <ul className="-my-6 divide-y divide-stone-200">
                            <AnimatePresence>
                                {cartItems.map((item) => (
                                    <CartItem key={item.productId} item={item} onUpdate={updateQuantity} onRemove={removeFromCart} />
                                ))}
                            </AnimatePresence>
                        </ul>
                    </div>

                    <div className="mt-10 border-t border-stone-200 pt-6">
                        <div className="space-y-4 text-base text-stone-700">
                            <div className="flex justify-between">
                                <p>Subtotal</p>
                                <p className="font-medium">₹{totalPrice.toFixed(2)}</p>
                            </div>
                            <div className="flex justify-between">
                                <p>Shipping</p>
                                <p className="font-medium text-green-600">Free</p>
                            </div>
                            <div className="mt-4 flex justify-between border-t border-stone-300 pt-4 text-xl font-bold text-stone-900">
                                <p>Total</p>
                                <p>₹{totalPrice.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="mt-8">
                            <Link to="/order">
                                <button className="w-full transform rounded-full bg-rose-600 px-6 py-4 font-semibold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-500/30">
                                    Proceed to Checkout
                                </button>
                            </Link>
                        </div>
                        <div className="mt-6 flex justify-center text-center text-sm">
                            <p>
                                or&nbsp;
                                <button
                                    onClick={clearCart}
                                    type="button"
                                    className="font-medium text-red-500 transition-colors hover:text-red-400"
                                >
                                    Clear Cart
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default CartPage;