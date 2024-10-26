import './Home.css';
import React, {useEffect, useState} from 'react';

const Home = () => {
    const [profileimg, setProfileimg] = useState('');
    useEffect(() => {

        const imgUrl = localStorage.getItem('img_ref');
        if(imgUrl){
            setProfileimg(imgUrl);
        }
    }, []);

    return(
        <div id ='background_home'>
            <div id = 'u_barra'>

            </div>
        </div>
    );
}

export default Home;