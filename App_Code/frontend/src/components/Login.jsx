import React from "react";
import './Login.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from "react-router-dom";
function Login() {

    const navigate = useNavigate();
    const clickLoginButton = () => {
        navigate('/home');
    }
    const clickSignUpButton = () => {
        navigate('/signup');
    }
    const forgetPasswordClick = () => {
        navigate('/forgetPassword')
    }
    let data = ""
    const test = fetch("http://localhost:3000/dogs").then(res => data = res.json())
    return (
        <div className="App">
            <div className="header_log">
                <img src={logo} alt="logo" id="logo_login" />
            </div>
            <div className="page_login">
                <div className="login_window">
                    <form className="login_form">
                        <label htmlFor="login">{data.a}</label>
                        <input id="login" placeholder="Wpisz login:"></input>
                        <label htmlFor="password">Hasło</label>
                        <input id="password" placeholder="Wpisz hasło:"></input>
                        <button type='submit' id='login_button' onClick={clickLoginButton}>Zaloguj się</button>
                        <div className="bottom_buttons">
                            <button type='submit' id='sign_up_button' onClick={clickSignUpButton}>Zarejestruj się</button>
                            <button type='submit' id='forgot_password_button' onClick={forgetPasswordClick}>Przypomnij hasło</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
export default Login;