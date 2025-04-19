import './Home.css';
import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [profileimg, setProfileimg] = useState('');
    const [userMail, setUserMail] = useState('');
    const navigate = useNavigate();

    useEffect(() => {

        const imgUrl = localStorage.getItem('img_ref');
        const mail = localStorage.getItem('user_mail');

        if(imgUrl){
            setProfileimg(imgUrl);
        }

        if(mail){
            setUserMail(mail);
        }

    }, []);


const goToHome = () => {
    navigate('/home');
}

    return(
        <div id="background_home">
        <div id="u_barra">
        <div className="profile-section">
            <img src={profileimg} alt="perfil" className="profile-img" />
            <p className="user-mail">{userMail}</p>
        </div>

        <div className="menu-section">
            <button className="menu-button" onClick={goToHome}>PAG. PRINCIPAL</button>
        </div>

        <div className="footer-section">
            <img src="/images/logo_footer_h.png" alt="logo" className="footer-logo" />
        </div>
        </div>
    </div>
    );
};

export default Home;