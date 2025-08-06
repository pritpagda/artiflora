import {useEffect, useState} from "react";
import {User} from "firebase/auth";
import api from "../utils/api";

export function useAdminCheck(user: User | null) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const token = await user.getIdToken();
                const response = await api.get("/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.data && response.data.isAdmin === true) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
                setError(null);
            } catch (err: any) {
                setIsAdmin(false);
                setError(err.message || "Failed to fetch admin status");
                console.error("Admin check failed:", err);
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, [user]);

    return {isAdmin, loading, error};
}
