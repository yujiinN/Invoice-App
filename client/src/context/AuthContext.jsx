import { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // In a real app, you might check localStorage here for a token
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const login = () => {
        // In a real app, this would be after a successful API call
        setIsLoggedIn(true);
    };

    const logout = () => {
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};