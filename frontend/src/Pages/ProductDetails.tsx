import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { AlertTriangle, ChevronLeft, ChevronRight, ImageOff, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Product } from "../utils/types";
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
    <div className="flex min-h-[70vh] items-center justify-center bg-stone-50 text-center">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="flex flex-col items-center p-8"
        >
            <Icon className="h-20 w-20 text-stone-300" />
            <h2 className="mt-8 font-serif text-3xl font-bold text-stone-700">{title}</h2>
            <p className="mt-2 max-w-sm text-stone-500">{children}</p>
        </motion.div>
    </div>
);

const ProductDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        async function fetchProduct() {
            if (!id) {
                setError("No product ID provided.");
                setLoading(false);
                return;
            }
            try {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const res = await api.get<Product>(`/products/${id}`);
                setProduct(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to load product.");
            } finally {
                setLoading(false);
            }
        }

        fetchProduct();
    }, [id]);

    const handleNextImage = () => {
        if (product && product.image_url.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % product.image_url.length);
        }
    };

    const handlePrevImage = () => {
        if (product && product.image_url.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + product.image_url.length) % product.image_url.length);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;
        addToCart({
            productId: product.id!,
            name: product.name,
            price: product.price,
            quantity,
            image_url: product.image_url,
        });
        toast.success(`${quantity} x ${product.name} added to cart!`, {
            description: `Total: ₹${(product.price * quantity).toFixed(2)}`,
            action: {
                label: "View Cart",
                onClick: () => navigate("/cart"),
            },
        });
    };

    if (loading) {
        return <PageState icon={ShoppingBag} title="Loading...">Fetching product details, please wait.</PageState>;
    }
    if (error) {
        return <PageState icon={AlertTriangle} title="An Error Occurred">{error}</PageState>;
    }
    if (!product) {
        return <PageState icon={ImageOff} title="Product Not Found">We couldn't find the product you're looking for.</PageState>;
    }

    const hasImages = product.image_url && product.image_url.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-stone-50 font-sans"
        >
            <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-8 lg:py-16">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-stone-600 transition-colors hover:bg-stone-200/60"
                >
                    <ChevronLeft size={18} /> Back to Collection
                </button>

                <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
                    <div className="flex flex-col-reverse items-center gap-4 lg:flex-row">
                        {hasImages && product.image_url.length > 1 && (
                            <div className="flex flex-row gap-3 lg:flex-col">
                                {product.image_url.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200
                                          ${currentImageIndex === idx ? "border-rose-500 shadow-md" : "border-transparent opacity-60 hover:opacity-100 hover:border-rose-300"}`}
                                    >
                                        <img src={url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
                            <AnimatePresence initial={false} mode="wait">
                                <motion.img
                                    key={currentImageIndex}
                                    src={hasImages ? product.image_url[currentImageIndex] : ""}
                                    alt={`${product.name} image ${currentImageIndex + 1}`}
                                    className="absolute h-full w-full object-cover"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                />
                            </AnimatePresence>
                            {!hasImages && (
                                <div className="flex h-full w-full items-center justify-center text-stone-400">
                                    <ImageOff size={48} />
                                </div>
                            )}
                            {hasImages && product.image_url.length > 1 && (
                                <>
                                    <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2 shadow-md backdrop-blur-sm transition hover:scale-110 hover:bg-white">
                                        <ChevronLeft />
                                    </button>
                                    <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/70 p-2 shadow-md backdrop-blur-sm transition hover:scale-110 hover:bg-white">
                                        <ChevronRight />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <div className="rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm lg:p-10">
                            <h1 className="font-serif text-4xl font-bold text-stone-800 lg:text-5xl">{product.name}</h1>
                            <p className="mt-4 font-sans text-3xl font-bold text-rose-600">₹{product.price.toFixed(2)}</p>
                            <div className="my-6 h-px bg-stone-200" />
                            <p className="leading-relaxed text-stone-600">{product.description}</p>

                            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch">
                                <div className="flex items-center rounded-full border border-stone-300">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="rounded-l-full px-4 py-3 text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-50" disabled={quantity <= 1}>
                                        <Minus size={16} />
                                    </button>
                                    <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)} className="rounded-r-full px-4 py-3 text-stone-600 transition-colors hover:bg-stone-100">
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-grow transform rounded-full bg-rose-600 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-500/30"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductDetails;