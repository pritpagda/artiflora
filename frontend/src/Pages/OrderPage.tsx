import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCart } from "../contexts/CartContext";
import { Order, OrderItem } from "../utils/types";
import { AlertCircle, CheckCircle, CreditCard, ShoppingBag } from "lucide-react";
import api from "../utils/api";

const FormInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-800 transition-colors focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-gray-100"
    />
);

const FormTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        className="w-full min-h-[100px] rounded-lg border border-gray-300 bg-white p-3 text-gray-800 transition-colors focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
    />
);

const PageState = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-6 bg-stone-50 font-sans">
        <Icon className="h-16 w-16 text-gray-300" />
        <h2 className="mt-6 font-serif text-3xl font-bold text-gray-700">{title}</h2>
        <p className="mt-2 text-gray-500">{children}</p>
    </div>
);

const loadRazorpayScript = (): Promise<boolean> => new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
        resolve(true);
        return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const OrderPage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [jwtToken, setJwtToken] = useState("");
    const [loading, setLoading] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const { cartItems, clearCart } = useCart();

    const [shippingDetails, setShippingDetails] = useState({
        email: "",
        first_name: "",
        last_name: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone_number: "",
        message: "",
    });

    const totalPrice = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setShippingDetails((prev) => ({ ...prev, email: firebaseUser.email || "" }));
                try {
                    const token = await firebaseUser.getIdToken();
                    setJwtToken(token);
                } catch {
                    setError("Your session could not be validated. Please try logging in again.");
                } finally {
                    setLoading(false);
                }
            } else {
                navigate("/login", { replace: true, state: { from: "/order" } });
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setShippingDetails({ ...shippingDetails, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || cartItems.length === 0 || isPlacingOrder) return;
        setIsPlacingOrder(true);
        setError("");
        setSuccess("");

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setError("Failed to load payment gateway. Please try again.");
            setIsPlacingOrder(false);
            return;
        }

        try {
            const createOrderRes = await api.post("razorpay/create-order", { amount: Math.round(totalPrice * 100) }, { headers: { Authorization: `Bearer ${jwtToken}` } });

            const { order_id, amount, currency, error: orderError } = createOrderRes.data;
            if (orderError) throw new Error(orderError);

            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID || "",
                amount,
                currency,
                order_id,
                name: "Artiflora",
                description: "Complete your payment",
                handler: async (response: any) => {
                    try {
                        const verifyRes = await api.post("razorpay/verify-payment", {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        }, { headers: { Authorization: `Bearer ${jwtToken}` } });

                        if (verifyRes.data.status !== "Payment signature verified") {
                            throw new Error("Payment verification failed");
                        }

                        const itemsToOrder: OrderItem[] = cartItems.map((item) => ({
                            product_id: item.productId, quantity: item.quantity,
                        }));

                        const orderToSend: Omit<Order, "id" | "created_at" | "custom"> = {
                            user_id: user.uid,
                            items: itemsToOrder,
                            ...shippingDetails,
                            total_price: totalPrice,
                            status: "Paid",
                        };

                        await api.post("orders", orderToSend, {
                            headers: { Authorization: `Bearer ${jwtToken}` },
                        });

                        setSuccess("Payment successful! Your order has been placed.");
                        clearCart();
                        setTimeout(() => navigate("/disp"), 3000);
                    } catch (err: any) {
                        setError(err.message || "Payment verification or order placement failed.");
                        setIsPlacingOrder(false);
                    }
                },
                prefill: {
                    email: shippingDetails.email,
                    contact: shippingDetails.phone_number,
                },
                theme: {
                    color: "#E11D48",
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err: any) {
            setError(axios.isAxiosError(err) && err.response ? err.response.data?.detail || err.message || "An error occurred." : err.message || "An error occurred.");
            setIsPlacingOrder(false);
        }
    };

    if (loading) {
        return <PageState icon={CreditCard} title="Validating Session...">Please wait a moment.</PageState>;
    }

    if (!loading && cartItems.length === 0 && !success) {
        return (
            <PageState icon={ShoppingBag} title="Your Cart is Empty">
                <p className="max-w-md">You need items in your cart to place an order. Let's find something beautiful.</p>
                <Link
                    to="/products"
                    className="mt-6 inline-block transform rounded-full bg-rose-600 px-8 py-3 font-semibold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-500/30"
                >
                    Continue Shopping
                </Link>
            </PageState>
        );
    }

    return (
        <div className="bg-stone-50 font-sans">
            <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
                <header className="mb-10 text-center">
                    <h1 className="font-serif text-5xl font-bold text-gray-800">Checkout</h1>
                    <p className="mt-3 text-gray-500">Please provide your shipping details to complete the order.</p>
                </header>

                <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-5">
                    <div className="lg:col-span-3">
                        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-subtle sm:p-8">
                            <h2 className="font-serif text-2xl font-semibold text-gray-800">Shipping Information</h2>
                            <div className="my-5 h-0.5 w-10 rounded-full bg-rose-600" />
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <FormInput name="first_name" placeholder="First Name" value={shippingDetails.first_name} onChange={handleChange} required />
                                    <FormInput name="last_name" placeholder="Last Name" value={shippingDetails.last_name} onChange={handleChange} required />
                                </div>
                                <FormInput type="email" name="email" placeholder="Email Address" value={shippingDetails.email} onChange={handleChange} required />
                                <FormInput name="phone_number" placeholder="Phone Number" type="tel" pattern="^[0-9]{10}$" value={shippingDetails.phone_number} onChange={handleChange} required />
                                <FormTextarea name="address" placeholder="Full Address" value={shippingDetails.address} onChange={handleChange} required />
                                <div className="grid grid-cols-3 gap-6">
                                    <FormInput name="city" placeholder="City" value={shippingDetails.city} onChange={handleChange} required />
                                    <FormInput name="state" placeholder="State" value={shippingDetails.state} onChange={handleChange} required />
                                    <FormInput name="pincode" placeholder="Pincode" pattern="^[0-9]{6}$" value={shippingDetails.pincode} onChange={handleChange} required />
                                </div>
                                <FormTextarea name="message" placeholder="Additional Notes (Optional)" value={shippingDetails.message} onChange={handleChange} />

                                {error && (
                                    <div className="flex items-center gap-2 rounded-md bg-red-100 p-4 text-red-700">
                                        <AlertCircle size={18} />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="flex items-center gap-2 rounded-md bg-green-100 p-4 text-green-700">
                                        <CheckCircle size={18} />
                                        <p>{success}</p>
                                    </div>
                                )}

                                <button type="submit" disabled={isPlacingOrder} className={`flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-500/30 ${isPlacingOrder ? "cursor-not-allowed opacity-70" : ""}`}>
                                    {isPlacingOrder ? "Processing Payment..." : "Pay Now"}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-subtle sm:p-8">
                        <h2 className="mb-5 font-serif text-2xl font-semibold text-gray-800">Order Summary</h2>
                        <ul className="divide-y divide-gray-200/80">
                            {cartItems.map((item) => (
                                <li key={item.productId} className="flex items-center gap-4 py-4">
                                    <img src={item.image_url[0] || ""} alt={item.name} className="h-16 w-16 rounded-lg border border-gray-200 object-cover" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{item.name}</p>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 flex justify-between border-t border-gray-200 pt-4 font-semibold text-gray-800">
                            <p>Total:</p>
                            <p>₹{totalPrice.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderPage;