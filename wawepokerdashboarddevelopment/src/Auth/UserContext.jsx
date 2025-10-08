import React, { createContext, useState, useEffect } from 'react';
import sessionManager from './sessionManager';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');  // Use localStorage here
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [username, setUsername] = useState(() => {
        const savedUsername = sessionManager.getUsername();
        return savedUsername || '';
    });
    const [email, setemail] = useState(() => {
        const savedemail = sessionManager.getemail();
        return savedemail || '';
    });
    const[role,setRole] = useState(() => {
        const savedRole = sessionManager.getRole();
        return savedRole || '';
    });
    const[userId,setUserId] = useState(() => {
        const savedUserId = sessionManager.getUserId();
        return savedUserId || '';
    });

    useEffect(() => {
        localStorage.setItem('user', JSON.stringify(user));  // Store user in localStorage
    }, [user]);

    return (
        <UserContext.Provider value={{ user, setUser, username, setUsername, email, setemail,role,setRole,userId,setUserId }}>
            {children}
        </UserContext.Provider>
    );
};