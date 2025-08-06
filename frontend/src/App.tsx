import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import {CartProvider} from './contexts/CartContext';
import Layout from './components/Layout';
import AdminDashboard from './Pages/AdminDashboard';
import CartPage from './Pages/CartPage';
import LandingPage from './Pages/LandingPage';
import LoginPage from './Pages/LoginPage';
import MyOrdersPage from './Pages/MyOrdersPage';
import OrderPage from './Pages/OrderPage';
import ProductDetails from './Pages/ProductDetails';
import ProductsPage from './Pages/ProductsPage';
import OrderDetailsPage from './Pages/OrderDetails';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
    return (<Router>
        <CartProvider>
            <Layout>
                <ErrorBoundary>
                    <Routes>
                        <Route path="/" element={<LandingPage/>}/>
                        <Route path="/login" element={<LoginPage/>}/>
                        <Route path="/products" element={<ProductsPage/>}/>
                        <Route path="/products/:id" element={<ProductDetails/>}/>
                        <Route path="/cart" element={<CartPage/>}/>
                        <Route path="/disp" element={<MyOrdersPage/>}/>
                        <Route path="/admin" element={<AdminDashboard/>}/>
                        <Route path="/order" element={<OrderPage/>}/>
                        <Route path="/orders/:id" element={<OrderDetailsPage />} />

                        <Route path="*"
                               element={<div className="p-4 text-center text-red-500">404 - Page Not Found</div>}/>
                    </Routes>
                </ErrorBoundary>
            </Layout>
        </CartProvider>
    </Router>);
};

export default App;