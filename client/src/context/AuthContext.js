"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import { verifyToken } from "../services/api";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const setAuth = (boolean) => {
        setIsAuthenticated(boolean);
    };

    async function isAuth() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            const userData = await verifyToken(token);

            if (userData) {
                setIsAuthenticated(true);
                setUser(userData);
            } else {
                setIsAuthenticated(false);
                localStorage.removeItem("token");
            }
        } catch (err) {
            console.error(err.message);
            setIsAuthenticated(false);
            localStorage.removeItem("token");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        isAuth();
    }, []);

    const login = (token, userData) => {
        localStorage.setItem("token", token);
        setIsAuthenticated(true);
        setUser(userData);
        router.push("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
        router.push("/login"); // or /
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                setAuth,
                loading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
