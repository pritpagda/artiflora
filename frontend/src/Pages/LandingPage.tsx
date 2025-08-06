import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Product } from '../utils/types';
import api from '../utils/api';
import { FiEye, FiShoppingCart, FiHeart } from 'react-icons/fi';

const getPlaceholderImage = (index: number) => {
    const images = [
        'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=800',
        'https://images.unsplash.com/photo-1508380733194-71e8979e2473?w=800',
        'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=800',
    ];
    return images[index % images.length];
};

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
    const hasImage = product.image_url && product.image_url.length > 0;
    const placeholderImage = getPlaceholderImage(index);

    return (
        <motion.li
            className="group"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <div className="relative block bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">
                <Link to={`/products/${product.id}`} className="block relative w-full aspect-square overflow-hidden">
                    <img
                        src={hasImage ? product.image_url[0] : placeholderImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <FiEye className="text-white text-4xl" />
                    </div>
                </Link>
                <div className="p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-800 font-serif truncate" title={product.name}>
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 h-10 overflow-hidden">
                        {product.description}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                        <p className="text-2xl font-extrabold text-pink-600 font-sans">
                            ₹{product.price.toFixed(2)}
                        </p>
                        <button
                            className="bg-pink-500 text-white p-3 rounded-full hover:bg-pink-600 transform group-hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
                            aria-label="Add to cart"
                        >
                            <FiShoppingCart />
                        </button>
                    </div>
                </div>
            </div>
        </motion.li>
    );
};

const SkeletonCard = () => (
    <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden animate-pulse">
        <div className="w-full aspect-square bg-gray-300"></div>
        <div className="p-6">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6 mb-6"></div>
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
        </div>
    </div>
);

const testimonials = [
    { text: "The flowers are absolutely stunning! They bring so much joy and color to my room.", name: "Priya" },
    { text: "Incredible craftsmanship. You can tell each piece is made with love and care.", name: "Rahul" },
    { text: "A unique and beautiful gift. My friend was so happy to receive them.", name: "Anjali" },
    { text: "The colors are so vibrant and the quality is amazing. Highly recommended!", name: "Vikram" },
    { text: "These handmade flowers are a true work of art. I'm so glad I found this shop.", name: "Sunita" },
];
const duplicatedTestimonials = [...testimonials, ...testimonials];

const LandingPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const heroTextOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const heroTextY = useTransform(scrollYProgress, [0, 0.5], ['0%', '-100%']);

    useEffect(() => {
        document.body.style.backgroundColor = '#FFFBFB';
        document.body.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FADADD' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

        const fetchProducts = async () => {
            try {
                const res = await api.get<Product[]>("products");
                setProducts(res.data.slice(0, 3));
            } catch (err: any) {
                setError(err.message || "Failed to fetch products");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();

        return () => {
            document.body.style.backgroundColor = '';
            document.body.style.backgroundImage = '';
        };
    }, []);

    return (
        <div className="font-sans text-gray-800">
            <section
                ref={heroRef}
                className="relative h-screen text-white flex items-center justify-center text-center p-6 overflow-hidden"
            >
                <motion.div
                    className="absolute inset-0 z-0"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1559563458-527926bf12db?w=1800')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        y: backgroundY,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-purple-900/30 to-pink-900/40 z-10" />
                <motion.div
                    className="relative z-20 max-w-4xl mx-auto"
                    style={{ opacity: heroTextOpacity, y: heroTextY }}
                >
                    <motion.h1
                        className="text-6xl md:text-8xl font-bold font-serif mb-6 text-shadow-lg"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                        Everlasting Blooms
                    </motion.h1>
                    <motion.p
                        className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 text-shadow"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    >
                        Discover unique, handcrafted pipe cleaner flowers that bring joy and color to any space.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                    >
                        <Link
                            to="/products"
                            className="bg-pink-600 text-white font-bold px-10 py-5 rounded-full text-xl hover:bg-pink-700 transition-all transform hover:scale-110 shadow-xl inline-block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-300/70"
                        >
                            Explore The Collection
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            <motion.section
                id="products"
                className="py-28"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-6">
                    <h2
                        className="text-5xl font-bold text-center mb-20 font-serif bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Our Favorite Blooms
                    </h2>
                    {loading && (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                        </ul>
                    )}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-center max-w-xl mx-auto" role="alert">
                            <p>We couldn't fetch the flowers. Please try again later.</p>
                        </div>
                    )}
                    {!loading && !error && products.length > 0 && (
                        <>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                                {products.map((product, index) => (
                                    <ProductCard key={product.id} product={product} index={index} />
                                ))}
                            </ul>
                            <div className="text-center mt-20">
                                <Link
                                    to="/products"
                                    className="inline-block bg-gray-800 text-white px-10 py-4 rounded-full font-semibold hover:bg-gray-900 transition-colors duration-300 transform hover:scale-105"
                                >
                                    View All Products
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </motion.section>

            <section className="py-28 bg-white overflow-hidden">
                <div className="container mx-auto px-6 text-center">
                     <h2
                        className="text-5xl font-bold text-center mb-16 font-serif bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Crafted With Love
                    </h2>
                    <div className="grid md:grid-cols-3 gap-12 text-center">
                        <motion.div initial={{y: 30, opacity: 0}} whileInView={{y: 0, opacity: 1}} transition={{delay: 0.1, duration: 0.5}} viewport={{ once: true }}>
                            <div className="bg-pink-100 text-pink-600 w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4">
                                <FiHeart />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Handmade Quality</h3>
                            <p className="text-gray-600">Each flower is meticulously twisted, shaped, and assembled by hand.</p>
                        </motion.div>
                        <motion.div initial={{y: 30, opacity: 0}} whileInView={{y: 0, opacity: 1}} transition={{delay: 0.2, duration: 0.5}} viewport={{ once: true }}>
                            <div className="bg-purple-100 text-purple-600 w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4">
                                🎨
                            </div>
                            <h3 className="text-xl font-bold mb-2">Unique Designs</h3>
                            <p className="text-gray-600">Our original designs mean you're getting a one-of-a-kind piece of art.</p>
                        </motion.div>
                        <motion.div initial={{y: 30, opacity: 0}} whileInView={{y: 0, opacity: 1}} transition={{delay: 0.3, duration: 0.5}} viewport={{ once: true }}>
                           <div className="bg-green-100 text-green-600 w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-4">
                                🌿
                            </div>
                            <h3 className="text-xl font-bold mb-2">Built to Last</h3>
                            <p className="text-gray-600">Unlike real flowers, our creations offer everlasting beauty without wilting.</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section id="story" className="py-28 md:py-36">
                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-x-20 gap-y-16 items-center">
                     <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                         <h2
                            className="text-5xl font-bold mb-8 font-serif bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                         >
                            From a Simple Thread
                        </h2>
                        <div className="text-lg text-gray-700 space-y-6 leading-relaxed">
                            <p>Artiflora began with a simple idea: to create beautiful, lasting floral arrangements from everyday materials. Each flower is handcrafted with care, turning simple pipe cleaners into intricate works of art.</p>
                            <p>We believe in the joy of handmade items and the unique character they bring to any home. Our passion is to create pieces that you will cherish for years to come.</p>
                        </div>
                    </motion.div>
                     <motion.div
                        className="h-[550px] w-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <img
                            src="https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=800"
                            alt="Artist crafting a pipe cleaner flower"
                            className="rounded-2xl shadow-2xl w-full h-full object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            <section id="testimonials" className="py-28 md:py-36 bg-white overflow-hidden">
                <div className="container mx-auto">
                    <h2
                        className="text-5xl font-bold text-center mb-20 font-serif bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Words From Our Customers
                    </h2>
                    <div className="relative">
                        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-white via-transparent to-white z-10" />
                        <motion.div
                            className="flex gap-10"
                            animate={{ x: ['0%', '-100%'] }}
                            transition={{ ease: 'linear', duration: 40, repeat: Infinity }}
                        >
                            {duplicatedTestimonials.map(({ text, name }, idx) => (
                                <figure key={idx} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex-shrink-0 w-[450px]">
                                    <blockquote className="text-gray-700 italic text-lg">"{text}"</blockquote>
                                    <figcaption className="mt-6">
                                        <p className="font-bold text-pink-600">- {name}</p>
                                        <div className="text-yellow-500 mt-2 text-xl tracking-widest">★★★★★</div>
                                    </figcaption>
                                </figure>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            <footer className="bg-gray-800 text-gray-200">
                <div className="container mx-auto px-6 py-16 text-center">
                     <p
                        className="text-4xl mb-5 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Artiflora
                    </p>
                    <p className="text-md text-gray-400 max-w-lg mx-auto">
                        Everlasting Beauty, Handcrafted For You. Discover unique floral art that brings timeless joy to any space.
                    </p>
                    <div className="flex justify-center space-x-8 mt-8">
                        <a href="#" className="hover:text-pink-400 transition-colors">Instagram</a>
                        <a href="#" className="hover:text-pink-400 transition-colors">Facebook</a>
                        <a href="#" className="hover:text-pink-400 transition-colors">Pinterest</a>
                    </div>
                    <div className="mt-12 border-t border-gray-700 pt-8">
                        <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Artiflora. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;