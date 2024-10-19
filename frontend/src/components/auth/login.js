import './Login.css';
import axios from './axiosconfig';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom'

function Login() {
//Funciones para el manejo de datos
    const [user, setuser] = useState({mail: '', password:''});
    const navigate= useNavigate();

    const handleChange = (e) =>{
        setuser({ ...user, [e.target.name]: e.target.value})
    };

    const handleSubmit = async(e) =>{
        e.preventDefault();
        try{
            const response = await axios.post('/Login', user);

            const token = response.data.token;
            localStorage.setItem('token', token);

            alert(response.data.message);
            navigate('/Home');
        }catch(err){
            if (err.response){
                if(err.response.status === 500){
                    alert('Error en el servidor')
                }else(alert(`${err.response.status}`))
            }else if(err.request){
                alert('No se pudo conectar con el servidor. Verifique su conexión a internet.')
            }else{
                alert('Ocurrió un error. Por favor intente de nuevo.');
            }
        }
    };




    //html para el UI
    return(
        <div id="background">
            <div id="back_form">
                <img src={require('../../assets/images/logo_footer.png')} alt="Logo Urosario"/>
                <form onSubmit={handleSubmit}>
                <label htmlFor ='mail'>Correo institucional:</label><br />
                <input 
                    type='text' 
                    id='mail' 
                    name='mail' 
                    value={user.mail} 
                    onChange={handleChange} 
                    required
                /><br /><br />

                <label htmlFor='password'>Contraseña:</label><br />
                <input 
                    type='password' 
                    id='password' 
                    name='password' 
                    value={user.password} 
                    onChange={handleChange} 
                    required
                /><br /><br />

                <input type='submit' value='Iniciar Sesion'/>
                </form>
            </div>
        </div>
    );
}



export default Login;