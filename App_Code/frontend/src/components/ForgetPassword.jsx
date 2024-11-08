import React from "react";
import './ForgetPassword.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from "react-router-dom";
function ForgetPassword() {

    const navigate = useNavigate();
    const remindPasswordClick = () => {
        navigate('/');
    }
    return (
        <div className="App">
            <div className="header_log">
                <img src={logo} alt="logo" id="logo_login" />
            </div>
            <div className="page_forget_password">
                <div className="forget_password_window">
                <form className="forget_password_form">
                        <label htmlFor="email">Podaj e-mail:</label>
                        <input id="email" placeholder="Podaj mail:"></input>
                        <button type='submit' onClick={remindPasswordClick} id='remind_password_button'>Przypomnij hasło</button>
                </form>
                </div>
            </div>
        </div>
    )
}
export default ForgetPassword;