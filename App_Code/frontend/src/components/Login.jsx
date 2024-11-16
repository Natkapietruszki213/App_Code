import React, { useState, useEffect } from "react";
import './Login.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from "react-router-dom";

function Login() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');

    let isEmpty = (val) => {
        if (val==null || val=='') return true;
        else return false;
    }

    let validate = (e) => {
        e.preventDefault(); 
        if (isEmpty(login) || isEmpty(password)) 
        {
            alert("Proszę wpisać login i hasło!");
        }
        else
        {
            alert(JSON.stringify({login: login, password: password}));
        }
    }
    const navigate = useNavigate();
    const clickSignUpButton = () => {
        navigate('/signup');
    }
    const forgetPasswordClick = () => {
        navigate('/forgetPassword')
    }

    return (
        <div className="App">
            <div className="header_log">
                <img src={logo} alt="logo" id="logo_login" />
            </div>
            <div className="page_login">
                <div className="login_window">
                    <form className="login_form">
                        <label htmlFor="login">Login</label>
                        <input id="login" placeholder="Wpisz login:" value={login} type='text' onChange={(e) => setLogin(e.target.value)}></input>
                        <label htmlFor="password">Hasło</label>
                        <input id="password" placeholder="Wpisz hasło:" value={password} type='text' onChange={(e) => setPassword(e.target.value)}></input>
                        <button type='submit' id='login_button' onClick={(e) => validate(e)}>Zaloguj się</button>
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