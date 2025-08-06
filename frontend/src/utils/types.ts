export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string[];
}

export interface OrderItem {
    product_id: string;
    quantity: number;
}

export interface Order {
    id?: string;
    user_id: string;
    items: OrderItem[];
    email: string;
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone_number: string;
    message?: string;
    total_price: number;
    status: "Paid" | "Pending" | "Completed" | "Cancelled";
    created_at?: string;
    custom?: Record<string, unknown>;
}
