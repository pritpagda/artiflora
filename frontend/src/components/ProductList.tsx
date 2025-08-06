import React, { useState } from "react";
import type { Product } from "../utils/types";
import api from "../utils/api";
import { AlertCircle, Edit, Loader2, PackageSearch, Trash2 } from "lucide-react";

interface ProductListProps {
    isAdmin: boolean;
    products: Product[];
    loadingProducts: boolean;
    errorProducts: string | null;
    onEdit: (product: Product) => void;
    onDeleteSuccess: () => void;
    getToken: () => Promise<string>;
}

const ProductCard = ({ product, onEdit, onDeleteSuccess, getToken }: {
    product: Product;
    onEdit: (product: Product) => void;
    onDeleteSuccess: () => void;
    getToken: () => Promise<string>;
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
            return;
        }
        setIsDeleting(true);
        try {
            const token = await getToken();
            await api.delete(`/products/${product.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onDeleteSuccess();
        } catch (error) {
            console.error("Failed to delete product:", error);
            alert("Failed to delete product. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const imageUrl = product.image_url?.[0];

    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <div className="relative h-52 w-full bg-stone-100">
                {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-400">
                        No Image
                    </div>
                )}
            </div>

            <div className="flex flex-grow flex-col p-4">
                <h3 className="font-serif text-lg font-bold text-stone-800">{product.name}</h3>
                <p className="mt-1 font-sans text-xl font-semibold text-rose-600">
                    ₹{product.price.toFixed(2)}
                </p>
                <p className="mt-2 flex-grow text-sm text-stone-600 line-clamp-3">
                    {product.description}
                </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-100 bg-stone-50/50 p-3">
                <button
                    onClick={() => onEdit(product)}
                    className="rounded-md p-2 text-stone-500 transition-colors hover:bg-blue-100 hover:text-blue-700"
                    aria-label={`Edit ${product.name}`}
                >
                    <Edit className="h-5 w-5" />
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="rounded-md p-2 text-stone-500 transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Delete ${product.name}`}
                >
                    {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};

const ListStateDisplay = ({ icon: Icon, title, children }: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col items-center justify-center rounded-lg bg-stone-100/80 p-12 text-center">
        <Icon className="h-12 w-12 text-stone-400" />
        <h3 className="mt-4 font-serif text-xl font-semibold text-stone-700">{title}</h3>
        <p className="mt-1 text-stone-500">{children}</p>
    </div>
);


const ProductList = ({
    products,
    loadingProducts,
    errorProducts,
    onEdit,
    onDeleteSuccess,
    getToken,
}: ProductListProps) => {

    if (loadingProducts) {
        return <ListStateDisplay icon={Loader2} title="Loading Products...">Please wait a moment.</ListStateDisplay>;
    }

    if (errorProducts) {
        return (
            <div className="rounded-md border-l-4 border-red-500 bg-red-50 p-4 text-red-900" role="alert">
                <div className="flex items-start">
                    <AlertCircle className="mr-3 h-5 w-5 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">An Error Occurred</h3>
                        <p className="mt-1 text-sm">{errorProducts}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <ListStateDisplay icon={PackageSearch} title="No Products Found">
                Click the "Add New" button to get started.
            </ListStateDisplay>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={onEdit}
                    onDeleteSuccess={onDeleteSuccess}
                    getToken={getToken}
                />
            ))}
        </div>
    );
};

export default ProductList;