import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebase";
import { motion } from "framer-motion";
import { AlertTriangle, PackageSearch, ReceiptText } from "lucide-react";
import { Order, Product } from "../utils/types";
import api from "../utils/api";

const PageState = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode; }) => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center"
        >
            <Icon className="h-20 w-20 text-stone-300" />
            <h2 className="mt-8 font-serif text-3xl font-bold text-stone-700">{title}</h2>
            <p className="mt-2 max-w-sm text-stone-500">{children}</p>
        </motion.div>
    </div>
);

const OrderCard = ({ order, products }: { order: Order; products: Product[] }) => {
    const navigate = useNavigate();

    const getStatusChipClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'shipped':
                return 'bg-blue-100 text-blue-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-stone-100 text-stone-800';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onClick={() => navigate(`/orders/${order.id}`)}
            className="group grid cursor-pointer grid-cols-1 gap-6 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-100/50 sm:grid-cols-3"
        >
            <div className="relative flex h-32 w-full items-center justify-center sm:h-full sm:w-auto">
                {products.length > 0 ? (
                    products.slice(0, 3).map((product, index) => (
                        <div
                            key={product.id}
                            className="absolute h-24 w-24 overflow-hidden rounded-lg border-4 border-white bg-stone-100 shadow-md transition-transform duration-500 ease-out group-hover:rotate-0"
                            style={{
                                transform: `translateX(${(index - 1) * 20}px) rotate(${(index - 1) * 8}deg) translateZ(${2 - index}px)`,
                                zIndex: 3 - index,
                            }}
                        >
                            {product.image_url?.[0] ? (
                                <img src={product.image_url[0]} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">No Img</div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-stone-400">No Product Info</div>
                )}
            </div>

            <div className="sm:col-span-2">
                <div className="flex flex-col-reverse items-start sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-sans text-sm font-semibold text-stone-500">Order #{order.id!.substring(0, 8)}</p>
                        <p className="mt-1 text-sm text-stone-500">
                            {new Date(order.created_at!).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusChipClass(order.status)}`}>
                        {order.status}
                    </div>
                </div>
                <div className="my-4 h-px bg-stone-200" />
                <div className="space-y-1 text-sm text-stone-600">
                    {products.slice(0, 2).map(p => <p key={p.id} className="truncate">• {p.name}</p>)}
                    {products.length > 2 && <p className="font-medium text-stone-700">+ {products.length - 2} more item(s)</p>}
                </div>
                <p className="mt-4 text-right font-serif text-xl font-bold text-stone-800">
                    Total: ₹{order.total_price.toFixed(2)}
                </p>
            </div>
        </motion.div>
    );
};

const MyOrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [productMap, setProductMap] = useState<Map<string, Product>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllData = async (user: any) => {
            try {
                const token = await user.getIdToken();
                const headers = { Authorization: `Bearer ${token}` };

                const [ordersRes, productsRes] = await Promise.all([
                    api.get("orders/me", { headers }),
                    api.get("products", { headers })
                ]);

                const validOrders: Order[] = ordersRes.data.filter((order: Order) => order.id && order.created_at);
                const fetchedProducts: Product[] = productsRes.data;

                const map = new Map<string, Product>();
                fetchedProducts.forEach(product => {
                    if (product.id) map.set(product.id, product);
                });

                setOrders(validOrders);
                setProductMap(map);
            } catch (err: any) {
                console.error("Failed to fetch data:", err);
                setError("We couldn't retrieve your order history. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchAllData(user);
            } else {
                navigate("/login");
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-stone-50 font-sans">
            <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-20">
                <header className="mb-12 text-center">
                    <h1 className="font-serif text-5xl font-bold text-stone-800">My Orders</h1>
                    <p className="mt-3 text-stone-500">View your order history and track your beautiful purchases.</p>
                </header>

                {loading ? (
                    <PageState icon={PackageSearch} title="Loading Your Orders...">
                        We're gathering your order history. Please wait a moment.
                    </PageState>
                ) : error ? (
                    <PageState icon={AlertTriangle} title="Something Went Wrong">
                        {error}
                    </PageState>
                ) : orders.length === 0 ? (
                    <PageState icon={ReceiptText} title="No Orders Found">
                        You haven't placed any orders with us yet. Let's find something you'll love!
                    </PageState>
                ) : (
                    <motion.div
                        className="space-y-6"
                        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                        initial="hidden"
                        animate="visible"
                    >
                        {orders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                products={order.items
                                    .map(item => productMap.get(item.product_id))
                                    .filter((p): p is Product => p !== undefined)}
                            />
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MyOrdersPage;