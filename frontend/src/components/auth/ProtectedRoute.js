import React from 'react';
import { Navigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';


const ProtectedRoute =({children}) => {
    const token = localStorage.getItem('token');

    if(!token){
        return <Navigate to= '/login'/>;
    }

    try{
        const decodedToken = jwtDecode(token);
        const ctime = Date.now() /1000;

        if(decodedToken.exp < ctime){
            localStorage.removeItem(token);
            return <Navigate to='/login'/>;
        }
    }catch (error){
        localStorage.removeItem(token);
        return <Navigate to='/login'/>;
    }




    return children;
}


export default ProtectedRoute;