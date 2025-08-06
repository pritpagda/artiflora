import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "../utils/types";
import api from "../utils/api";

const getPlaceholderImage = (index: number) => {
    const images = [
        "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=800",
        "https://images.unsplash.com/photo-1508380733194-71e8979e2473?w=800",
        "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800",
    ];
    return images[index % images.length];
};

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
    const hasImage = product.image_url && product.image_url.length > 0;
    const placeholderImage = getPlaceholderImage(index);

    return (
        <motion.li
            className="group flex h-full flex-col"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
        >
            <Link
                to={`/products/${product.id}`}
                className="block flex-grow flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
                <div className="relative w-full aspect-square overflow-hidden">
                    <img
                        src={hasImage ? product.image_url[0] : placeholderImage}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
                <div className="flex flex-col flex-grow p-6">
                    <h3 className="font-serif text-2xl font-bold text-gray-800" title={product.name}>
                        {product.name}
                    </h3>
                    <div className="mt-5 flex items-center justify-between">
                        <p className="font-sans text-2xl font-extrabold text-pink-600">
                            ₹{product.price.toFixed(2)}
                        </p>
                        <span className="text-md rounded-full bg-pink-100 px-4 py-2 font-semibold text-pink-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            View Details
                        </span>
                    </div>
                </div>
            </Link>
        </motion.li>
    );
};

const SkeletonCard = () => (
    <div className="overflow-hidden rounded-2xl bg-gray-100 shadow-lg animate-pulse">
        <div className="aspect-square w-full bg-gray-300"></div>
        <div className="p-6">
            <div className="mb-4 h-6 w-3/4 rounded bg-gray-300"></div>
            <div className="h-8 w-1/3 rounded bg-gray-300"></div>
        </div>
    </div>
);

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                await new Promise(res => setTimeout(res, 800));
                const res = await api.get<Product[]>("/products");
                setProducts(res.data);
            } catch (err: any) {
                setError(err.message || "Failed to fetch products");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const renderContent = () => {
        if (loading) {
            return Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />);
        }

        if (error) {
            return (
                <div className="col-span-full mx-auto max-w-xl rounded-xl border border-red-400 bg-red-100 px-4 py-3 text-center text-red-700" role="alert">
                    <h3 className="font-serif text-2xl font-bold">Something went wrong</h3>
                    <p>We had trouble fetching our beautiful flowers. Please try again later.</p>
                </div>
            );
        }

        if (products.length > 0) {
            return products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
            ));
        }

        return (
            <div className="col-span-full py-20 text-center text-gray-500">
                <ShoppingBag className="mx-auto h-20 w-20 text-gray-300" />
                <h3 className="mt-8 font-serif text-3xl font-bold text-gray-700">
                    Our Bouquets are Being Prepared
                </h3>
                <p className="mt-3">
                    Our collection is currently empty. Please check back soon for new creations!
                </p>
            </div>
        );
    };

    return (
        <div className="font-sans text-gray-800 bg-pink-50">
            <header className="py-24 text-center">
                <div className="container mx-auto px-6">
                    <motion.h1
                        className="text-6xl md:text-8xl font-bold font-serif text-shadow-lg"
                        style={{ fontFamily: "'Pacifico', cursive" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        The Collection
                    </motion.h1>
                    <motion.p
                        className="mx-auto mt-6 max-w-2xl text-xl md:text-2xl text-shadow"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                        Discover our curated selection of handcrafted floral art, designed to bring timeless joy and elegance to your space.
                    </motion.p>
                </div>
            </header>

            <main className="pb-28">
                <div className="container mx-auto px-6">
                    <ul className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {renderContent()}
                    </ul>
                </div>
            </main>

            <footer className="bg-gray-800 text-gray-200">
                <div className="container mx-auto px-6 py-16 text-center">
                    <p className="font-serif text-4xl mb-5" style={{ fontFamily: "'Pacifico', cursive" }}>Artiflora</p>
                    <p className="text-md text-gray-400 max-w-lg mx-auto">
                        Everlasting Beauty, Handcrafted For You. Discover unique floral art that brings timeless joy to
                        any space.
                    </p>
                    <div className="flex justify-center space-x-8 mt-8">
                        <a href="#" className="hover:text-pink-400 transition-colors">Instagram</a>
                    </div>
                    <div className="mt-12 border-t border-gray-700 pt-8">
                        <p className="text-sm text-gray-500">
                            © {new Date().getFullYear()} Artiflora. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ProductsPage;