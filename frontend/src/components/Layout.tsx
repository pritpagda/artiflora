import React, {useEffect, useState} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {onAuthStateChanged, signOut, User} from "firebase/auth";
import {auth} from "../utils/firebase";
import {useAdminCheck} from "../hooks/useAdminCheck";
import {
    Flower2,
    LogIn,
    LogOut,
    Menu,
    Package,
    ReceiptText,
    Shield,
    ShoppingBag,
    User as UserIcon,
    X,
} from "lucide-react";
import {AnimatePresence, motion} from "framer-motion";
import {useCart} from "../contexts/CartContext";

const NavLink = ({
                     to, children, className = "",
                 }: {
    to: string; children: React.ReactNode; className?: string;
}) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (<Link
        to={to}
        className={`relative rounded-full px-4 py-2 font-medium transition-colors duration-200 ${isActive ? "text-rose-600" : "text-stone-600 hover:text-rose-600"} ${className}`}
    >
        {children}
        {isActive && (<motion.div
            className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-rose-500"
            layoutId="underline"
            transition={{type: "spring", stiffness: 380, damping: 30}}
        />)}
    </Link>);
};

const UserMenu = ({user, onLogout}: { user: User; onLogout: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const {isAdmin} = useAdminCheck(user);

    return (<div
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
    >
        <button
            aria-haspopup="true"
            aria-expanded={isOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 transition-colors hover:bg-stone-200"
        >
            <UserIcon className="h-5 w-5 text-stone-600"/>
        </button>
        <AnimatePresence>
            {isOpen && (<motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: 10}}
                className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-stone-200/80 bg-white p-2 shadow-lg"
            >
                <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-stone-800">
                        {user.displayName || "Welcome"}
                    </p>
                    <p className="truncate text-xs text-stone-500">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-stone-200"/>
                <Link
                    to="/disp"
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-100"
                >
                    <ReceiptText size={16}/> My Orders
                </Link>
                {isAdmin && (<Link
                    to="/admin"
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-100"
                >
                    <Shield size={16}/> Admin
                </Link>)}
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                    <LogOut size={16}/> Logout
                </button>
            </motion.div>)}
        </AnimatePresence>
    </div>);
};

export const Header = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const {cartItems} = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isMenuOpen]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navLinks = [{name: "Home", path: "/"}, {name: "Products", path: "/products"}, {
        name: "Best Sellers",
        path: "/#products"
    }, {name: "Reviews", path: "/#testimonials"}, {name: "About Us", path: "/#story"},];

    return (<header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-[60px] items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-end">
                <img
                    src="https://ik.imagekit.io/atmib1uew/arti/Artiflora-removebg-preview.png?updatedAt=1752362278269"
                    alt="Artiflora logo"
                    className="h-[175px]"
                />
            </Link>


            <nav className="hidden items-center md:flex" aria-label="Primary navigation">
                {navLinks.map((link) => (<NavLink key={link.path} to={link.path}>
                    {link.name}
                </NavLink>))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
                <Link
                    to="/cart"
                    className="relative rounded-full p-2 text-stone-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                    <ShoppingBag size={22}/>
                    {cartItems.length > 0 && (<span
                        className="absolute -top-0 -right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                    {cartItems.length}
                  </span>)}
                </Link>
                {user ? (<UserMenu user={user} onLogout={handleLogout}/>) : (<Link
                    to="/login"
                    className="hidden items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-700 sm:flex"
                >
                    <LogIn size={16}/> Login
                </Link>)}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="rounded-full p-2 text-stone-600 md:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={22}/>
                </button>
            </div>
        </div>

        <AnimatePresence>
            {isMenuOpen && (<MobileMenu
                onLogout={handleLogout}
                user={user}
                onClose={() => setIsMenuOpen(false)}
            />)}
        </AnimatePresence>
    </header>);
};

const MobileMenu = ({
                        user, onLogout, onClose,
                    }: {
    user: User | null; onLogout: () => void; onClose: () => void;
}) => {
    const {isAdmin} = useAdminCheck(user);

    const mobileLinks = [{name: "Home", path: "/", icon: Flower2}, {
        name: "Products", path: "/products", icon: Package
    }, ...(user ? [{name: "My Orders", path: "/disp", icon: ReceiptText}] : []), ...(isAdmin ? [{
        name: "Admin", path: "/admin", icon: Shield
    }] : []),];

    return (<motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
    >
        <motion.div
            initial={{x: "100%"}}
            animate={{x: 0}}
            exit={{x: "100%"}}
            transition={{type: "spring", stiffness: 300, damping: 30}}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-white p-6"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold">Menu</h2>
                <button onClick={onClose} className="rounded-full p-2">
                    <X size={22}/>
                </button>
            </div>
            <div className="my-6 h-px bg-stone-200"/>
            <nav className="flex flex-col gap-4">
                {mobileLinks.map((link) => (<Link
                    key={link.path}
                    to={link.path}
                    onClick={onClose}
                    className="flex items-center gap-4 rounded-lg p-3 text-lg font-medium text-stone-700 transition-colors hover:bg-stone-100"
                >
                    <link.icon size={20}/>
                    {link.name}
                </Link>))}
            </nav>
            <div className="absolute bottom-6 left-6 right-6">
                {user ? (<button
                    onClick={() => {
                        onLogout();
                        onClose();
                    }}
                    className="w-full flex items-center justify-center gap-3 rounded-lg bg-stone-100 p-3 font-semibold text-stone-700 transition-colors hover:bg-stone-200"
                >
                    <LogOut size={18}/> Logout
                </button>) : (<Link
                    to="/login"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-3 rounded-lg bg-rose-600 p-3 font-semibold text-white transition-colors hover:bg-rose-700"
                >
                    <LogIn size={18}/> Login / Sign Up
                </Link>)}
            </div>
        </motion.div>
    </motion.div>);
};

export const Layout = ({children}: { children: React.ReactNode }) => (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans">
        <Header/>
        <main className="flex-1">{children}</main>
    </div>);

export default Layout;
