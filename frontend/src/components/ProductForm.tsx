import React, {useEffect, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {AlertCircle, Loader2} from "lucide-react";
import type {Product} from "../utils/types";
import api from "../utils/api";
import ImageKit from "imagekit-javascript";

interface ProductFormProps {
    productToEdit: Product | null;
    onSuccess: () => void;
    onCancel: () => void;
    getToken: () => Promise<string>;
    isAdmin: boolean;
}

const initialFormData = {
    name: "", description: "", price: "", image_urls: [] as string[],
};

const imagekit = new ImageKit({
    publicKey: process.env.REACT_APP_IMAGEKIT_PUBLIC_KEY!, urlEndpoint: process.env.REACT_APP_IMAGEKIT_URL_ENDPOINT!,
});

const ProductForm = ({
                         productToEdit, onSuccess, onCancel, getToken, isAdmin,
                     }: ProductFormProps) => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name,
                description: productToEdit.description,
                price: productToEdit.price.toString(),
                image_urls: productToEdit.image_url || [],
            });
        } else {
            setFormData(initialFormData);
        }
    }, [productToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const uploadedUrls: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const authResponse = await api.get("/imagekit-auth");
                const {signature, expire, token} = authResponse.data;

                const uploadResult = await imagekit.upload({
                    file: files[i], fileName: files[i].name, signature, token, expire, useUniqueFileName: true,
                });

                uploadedUrls.push(uploadResult.url);
            }

            setFormData((prev) => ({
                ...prev,
                image_urls: [...prev.image_urls, ...uploadedUrls],
            }));
        } catch (err: any) {
            setError(err.message || "Image upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) {
            setError("You are not authorized to perform this action.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const productData = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            image_url: formData.image_urls,
        };

        try {
            const token = await getToken();
            const headers = {Authorization: `Bearer ${token}`};

            if (productToEdit) {
                await api.put(`/products/${productToEdit.id}`, productData, {
                    headers,
                });
            } else {
                await api.post("/products", productData, {headers});
            }

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formTitle = productToEdit ? "Edit Product" : "Create New Product";

    return (
        <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200/80 sm:p-8">
            <h2 className="mb-8 text-center font-serif text-3xl font-bold text-stone-800">
                {formTitle}
            </h2>
            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-stone-700">
                            Product Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-stone-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-stone-700">
                            Description
                        </label>
                        <textarea
                            name="description"
                            id="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-stone-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-stone-700">
                            Price (₹)
                        </label>
                        <input
                            type="number"
                            name="price"
                            id="price"
                            step="0.01"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-lg border-stone-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="image_upload" className="block text-sm font-medium text-stone-700">
                            Upload Images
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            id="image_upload"
                            multiple
                            onChange={handleImageUpload}
                            className="mt-1 block w-full text-sm"
                            disabled={uploading}
                        />
                        {uploading && (<p className="mt-2 text-sm text-stone-500">Uploading images...</p>)}
                    </div>

                    {formData.image_urls.length > 0 && (<div className="mt-4 grid grid-cols-3 gap-4">
                            {formData.image_urls.map((url, i) => (<img
                                    key={i}
                                    src={url}
                                    alt={`Uploaded ${i + 1}`}
                                    className="h-24 w-full object-cover rounded-md border"
                                />))}
                        </div>)}
                </div>

                <AnimatePresence>
                    {error && (<motion.div
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -10}}
                            className="mt-6 flex items-center gap-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700"
                        >
                            <AlertCircle className="h-5 w-5 flex-shrink-0"/>
                            <span>{error}</span>
                        </motion.div>)}
                </AnimatePresence>

                <div className="mt-8 flex justify-end gap-4 border-t border-stone-200 pt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-full bg-stone-100 px-6 py-2.5 text-sm font-semibold text-stone-800 ring-1 ring-inset ring-stone-300 transition-colors hover:bg-stone-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex min-w-[130px] items-center justify-center rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400 disabled:shadow-none"
                    >
                        {isSubmitting ? (<Loader2
                                className="h-5 w-5 animate-spin"/>) : productToEdit ? ("Update Product") : ("Create Product")}
                    </button>
                </div>
            </form>
        </div>);
};

export default ProductForm;
