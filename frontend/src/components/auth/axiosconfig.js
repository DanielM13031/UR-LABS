import axios from 'axios';

axios.interceptors.response.use(
    response => response,
    error =>{
        if(error.response && error.response.status === 401){
            alert('La sesion ha expirado')
        
        localStorage.removeItem('token');
        window.location.href = '/login'
        }
        return Promise.reject(error);
    }
);

export default axios;