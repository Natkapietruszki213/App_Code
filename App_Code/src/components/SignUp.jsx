import React from "react";
import './SignUp.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from "react-router-dom";
function SignUp() {

    const navigate = useNavigate();
    const newAccountButton = () => {
        navigate('/');
    }
    return (
        <div className="App">
            <div className="header_log">
                <img src={logo} alt="logo" id="logo_login" />
            </div>
            <div className="page_signup">
                <div className="signup_window">
                    <form className="signup_form">
                        <label htmlFor="name">Imię:</label>
                        <input id="name" placeholder="Podaj imię:"></input>
                        <label htmlFor="surname">Nazwisko:</label>
                        <input id="surname" placeholder="Podaj nazwisko:"></input>
                        <label htmlFor="email">E-mail:</label>
                        <input id="email" placeholder="Podaj mail:"></input>
                        <label htmlFor="login">Login:</label>
                        <input id="login" placeholder="Podaj login:"></input>
                        <label htmlFor="password">Hasło:</label>
                        <input id="password" placeholder="Podaj hasło:"></input>
                        <button type='submit' onClick={newAccountButton} id='try_sign_up_button'>Załóż konto</button>
                        <div className="bottom_buttons">
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
export default SignUp;