import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebase";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  PackageSearch,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { Order, Product } from "../utils/types";
import api from "../utils/api";

const PageState = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center bg-stone-50 font-sans">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <Icon className="h-20 w-20 text-stone-300" />
      <h2 className="mt-8 font-serif text-3xl font-bold text-stone-700">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-stone-500">{children}</p>
    </motion.div>
  </div>
);

const DetailCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-3">
      <Icon className="h-6 w-6 text-rose-500" />
      <h3 className="font-serif text-xl font-bold text-stone-800">{title}</h3>
    </div>
    <div className="mt-4 pl-9">{children}</div>
  </div>
);

const getStatusChipClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "processing":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "shipped":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-stone-100 text-stone-800 border-stone-300";
  }
};

const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [productMap, setProductMap] = useState<Map<string, Product>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async (token: string) => {
      if (!id) {
        setError("No order ID provided.");
        setLoading(false);
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [orderRes, productsRes] = await Promise.all([
          api.get(`/orders/${id}`, { headers }),
          api.get("/products", { headers }),
        ]);

        setOrder(orderRes.data);

        const map = new Map<string, Product>();
        productsRes.data.forEach((p: Product) => map.set(p.id, p));
        setProductMap(map);
      } catch (err: any) {
        setError(
          "Failed to fetch order details. The order may not exist or you may not have permission to view it."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        fetchOrderDetails(token);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const orderedProducts = useMemo(() => {
    if (!order || productMap.size === 0) return [];
    return order.items
      .map((item) => {
        const product = productMap.get(item.product_id);
        return product
          ? { ...product, quantity: item.quantity }
          : null;
      })
      .filter(
        (p): p is Product & { quantity: number } => p !== null
      );
  }, [order, productMap]);

  if (loading) {
    return (
      <PageState
        icon={PackageSearch}
        title="Loading Order Details..."
      >
        Please wait while we retrieve the order information.
      </PageState>
    );
  }

  if (error) {
    return (
      <PageState icon={AlertTriangle} title="An Error Occurred">
        {error}
      </PageState>
    );
  }

  if (!order) {
    return (
      <PageState icon={PackageSearch} title="Order Not Found">
        We couldn't find the order you're looking for.
      </PageState>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-stone-600 transition-colors hover:bg-stone-200/60"
          >
            <ChevronLeft size={18} />
            Back to Orders
          </button>
          <header className="mb-10 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="font-serif text-3xl font-bold text-stone-800">
                  Order #{order?.id?.substring(0, 8)}
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                  {order?.created_at
                    ? `Placed on ${new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}`
                    : "Date not available"}
                </p>
              </div>
              <div
                className={`rounded-full px-4 py-1.5 text-sm font-bold border ${getStatusChipClass(order.status)}`}
              >
                {order.status}
              </div>
            </div>
            <div className="mt-4 h-px bg-stone-200" />
            <div className="mt-4 flex items-center justify-between">
              <span className="text-stone-600">Order Total:</span>
              <span className="font-serif text-2xl font-bold text-rose-600">
                ₹{order.total_price.toFixed(2)}
              </span>
            </div>
          </header>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
            <DetailCard icon={User} title="Shipping Details">
              <div className="space-y-2 text-stone-600">
                <p className="font-semibold text-stone-800">
                  {order.first_name} {order.last_name}
                </p>
                <p>
                  <MapPin size={14} className="inline mr-2" />
                  {order.address}, {order.city}, {order.state} - {order.pincode}
                </p>
                <p>
                  <Mail size={14} className="inline mr-2" />
                  {order.email}
                </p>
                <p>
                  <Phone size={14} className="inline mr-2" />
                  {order.phone_number}
                </p>
                {order.message && (
                  <p className="pt-2 italic border-t border-stone-200/60 mt-2">
                    "{order.message}"
                  </p>
                )}
              </div>
            </DetailCard>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}>
            <DetailCard icon={FileText} title="Order Summary">
              <ul className="divide-y divide-stone-200/80">
                {orderedProducts.map((product) => (
                  <li key={product.id} className="flex items-center gap-4 py-3">
                    <img
                      src={product.image_url?.[0] || "https://via.placeholder.com/100"}
                      alt={product.name}
                      className="h-16 w-16 rounded-lg border border-stone-200 object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800">{product.name}</p>
                      <p className="text-sm text-stone-500">
                        {product.quantity} x ₹{product.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold text-stone-800">
                      ₹{(product.price * product.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </DetailCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
