import React, { useState, useEffect } from "react";
import './Login.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from "react-router-dom";

function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    let isEmpty = (val) => {
        if (val==null || val=='') return true;
        else return false;
    }

    let validate = (e) => {
        e.preventDefault(); 
        if (isEmpty(name) || isEmpty(password)) 
        {
            alert("Proszę wpisać login i hasło!");
        }
        else
        {
            fetch('http://localhost:3000/login',{
                method: 'POST',
                credentials: 'include', 
                headers:{
                    'Content-Type': 'application/json'
            },
            body: JSON.stringify({name:name, password: password })
            })
            .then(response => {
                if (response.ok) {
                    console.log(response);
                    return response.json();
                } else {
                    console.log(response);
                    throw new Error('Niepoprawny login lub hasło');
                }
            })
            .then(data => {
                console.log("Zalogowano użytkownika!");
                navigate('/home');
            })
            .catch(error => {
                alert(error.message);
            });
        }
    }
    const navigate = useNavigate();
    const clickSignUpButton = () => {
        navigate('/signup');
    }
    const forgotPasswordClick = () => {
        navigate('/forgotPassword')
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
                        <input id="login" placeholder="Wpisz login:" value={name} type='text' onChange={(e) => setName(e.target.value)}></input>
                        <label htmlFor="password">Hasło</label>
                        <input id="password" placeholder="Wpisz hasło:" value={password} type='password' onChange={(e) => setPassword(e.target.value)}></input>
                        <button type='button' id='login_button' onClick={(e) => validate(e)}>Zaloguj się</button>
                        <div className="bottom_buttons">
                            <button type='button' id='sign_up_button' onClick={clickSignUpButton}>Zarejestruj się</button>
                            <button type='button' id='forgot_password_button' onClick={forgotPasswordClick}>Przypomnij hasło</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
export default Login;