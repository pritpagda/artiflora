import React, { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../utils/firebase";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useAdminCheck } from "../hooks/useAdminCheck";
import { Order, Product } from "../utils/types";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Flower2, LogOut, Package, PlusCircle, ShieldAlert, ShieldCheck, ShoppingCart } from "lucide-react";
import ProductForm from "../components/ProductForm";
import ProductList from "../components/ProductList";
import OrderManagement from "../components/OrderManagement";
import api from "../utils/api";

type View = "productList" | "productForm" | "orders";

const VIEW_CONFIG: Record<View, { title: string; icon: React.ElementType }> = {
    productList: { title: "Manage Products", icon: Package },
    productForm: { title: "New / Edit Product", icon: PlusCircle },
    orders: { title: "Customer Orders", icon: ShoppingCart },
};

const NavLink = ({ icon: Icon, label, isActive, onClick }: {
    icon: React.ElementType; label: string; isActive: boolean; onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${isActive ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" : "text-stone-600 hover:bg-rose-50 hover:text-rose-700"}`}
    >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
    </button>
);

const AuthScreen = ({ icon: Icon, title, children }: {
    icon: React.ElementType; title: string; children: React.ReactNode;
}) => (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-6 font-sans">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-10 text-center shadow-sm"
        >
            <Icon className="mx-auto h-16 w-16 text-rose-400" />
            <h1 className="mt-6 font-serif text-3xl font-bold text-stone-800">{title}</h1>
            <p className="mt-3 text-stone-500">{children}</p>
        </motion.div>
    </div>
);

const DashboardHeader = ({ title, onAddNew }: {
    title: string; onAddNew?: () => void;
}) => (
    <header className="sticky top-0 z-10 flex min-h-[5rem] items-center justify-between border-b border-stone-200 bg-white/70 px-6 py-4 backdrop-blur-lg sm:px-8">
        <h1 className="font-serif text-3xl font-bold text-stone-800 md:text-4xl">{title}</h1>
        {onAddNew && (
            <button
                onClick={onAddNew}
                className="flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-500/30 transform hover:-translate-y-0.5"
            >
                <PlusCircle className="h-5 w-5" />
                <span>Add New</span>
            </button>
        )}
    </header>
);

const AdminDashboard = () => {
    const [user, setUser] = useState<User | null>(null);
    const { isAdmin, loading: adminLoading, error: adminError } = useAdminCheck(user);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
    const [errorOrders, setErrorOrders] = useState<string | null>(null);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [activeView, setActiveView] = useState<View>("productList");

    const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

    const getToken = useCallback(async () => {
        if (!user) throw new Error("Authentication token not available.");
        return await user.getIdToken(true);
    }, [user]);

    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true);
        setErrorProducts(null);
        try {
            const token = await getToken();
            const { data } = await api.get("products", { headers: { Authorization: `Bearer ${token}` } });
            setProducts(data);
        } catch (e: any) {
            setErrorProducts(e.message || "Failed to load products.");
        } finally {
            setLoadingProducts(false);
        }
    }, [getToken]);

    const fetchOrders = useCallback(async () => {
        setLoadingOrders(true);
        setErrorOrders(null);
        try {
            const token = await getToken();
            const { data } = await api.get("orders", { headers: { Authorization: `Bearer ${token}` } });
            setOrders(data);
        } catch (e: any) {
            setErrorOrders(e.message || "Failed to load orders.");
        } finally {
            setLoadingOrders(false);
        }
    }, [getToken]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            fetchProducts();
            fetchOrders();
        }
    }, [isAdmin, fetchProducts, fetchOrders]);


    const handleEditProduct = (product: Product) => {
        setProductToEdit(product);
        setActiveView("productForm");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleFormSuccess = () => {
        setProductToEdit(null);
        fetchProducts();
        setActiveView("productList");
    };

    if (adminLoading) {
        return <AuthScreen icon={ShieldCheck} title="Verifying Access...">Please wait while we check your credentials.</AuthScreen>;
    }
    if (adminError) {
        return <AuthScreen icon={AlertTriangle} title="Authentication Error">{adminError}</AuthScreen>;
    }
    if (!isAdmin) {
        return <AuthScreen icon={ShieldAlert} title="Access Denied">This protected area is for administrators only.</AuthScreen>;
    }

    const renderView = () => {
        switch (activeView) {
            case "productList":
                return <ProductList isAdmin={isAdmin} products={products} loadingProducts={loadingProducts} errorProducts={errorProducts} onEdit={handleEditProduct} onDeleteSuccess={fetchProducts} getToken={getToken} />;
            case "productForm":
                return <ProductForm isAdmin={isAdmin} productToEdit={productToEdit} onSuccess={handleFormSuccess} onCancel={() => {
                    setProductToEdit(null);
                    setActiveView("productList");
                }} getToken={getToken} />;
            case "orders":
                return <OrderManagement orders={orders} loadingOrders={loadingOrders} errorOrders={errorOrders} productMap={productMap} fetchOrders={fetchOrders} getToken={getToken} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-stone-100 font-sans text-stone-800">
            <aside className="fixed left-0 top-0 hidden h-full w-72 flex-col border-r border-stone-200 bg-white p-6 lg:flex">
                <div className="mb-12 flex items-center gap-3 px-2">
                    <Flower2 className="h-10 w-10 text-rose-500" />
                    <div>
                        <h1 className="font-serif text-2xl font-bold text-stone-800">Artiflora</h1>
                        <p className="text-sm text-stone-500">Admin Panel</p>
                    </div>
                </div>
                <nav className="flex flex-col gap-4">
                    <NavLink icon={Package} label="Products" isActive={activeView === "productList" || activeView === "productForm"} onClick={() => setActiveView("productList")} />
                    <NavLink icon={ShoppingCart} label="Orders" isActive={activeView === "orders"} onClick={() => setActiveView("orders")} />
                </nav>
                <div className="mt-auto flex flex-col gap-4">
                    <button onClick={() => auth.signOut()} className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-base font-medium text-stone-600 transition-colors hover:bg-stone-100">
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                    </button>
                    <p className="text-center text-xs text-stone-400">© {new Date().getFullYear()} Artiflora</p>
                </div>
            </aside>
            <main className="flex w-full flex-1 flex-col lg:pl-72">
                <DashboardHeader title={VIEW_CONFIG[activeView].title} onAddNew={activeView === "productList" ? () => {
                    setProductToEdit(null);
                    setActiveView("productForm");
                } : undefined} />
                <div className="flex-1 p-6 sm:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            {renderView()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;