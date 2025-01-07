import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Login.css';
import logo from "../assets/logo.jpg";

function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // Sprawdzenie sesji użytkownika na starcie
    useEffect(() => {
        fetch('http://localhost:3000/checkSession', {
            method: 'GET',
            credentials: 'include',
        })
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                navigate('/home'); 
            }
        })
        .catch(error => {
            console.error("Błąd podczas sprawdzania sesji:", error);
        });
    }, [navigate]);

    // Funkcja walidacji pól
    const isEmpty = (value) => !value || value.trim() === '';

    // Obsługa logowania
    const handleLogin = (e) => {
        e.preventDefault();

        if (isEmpty(name) || isEmpty(password)) {
            alert("Proszę wpisać login i hasło!");
            return;
        }

        fetch('http://localhost:3000/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, password }),
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Niepoprawny login lub hasło');
            }
        })
        .then(() => {
            console.log("Zalogowano użytkownika!");
            navigate('/home'); // Przekierowanie na stronę główną
        })
        .catch(error => {
            alert(error.message);
        });
    };

    // Obsługa przekierowania na rejestrację
    const handleSignUpClick = () => {
        navigate('/signup');
    };

    // Obsługa przekierowania na "zapomniałem hasła"
    const handleForgotPasswordClick = () => {
        navigate('/forgotPassword');
    };
    
    return (
        <div className="App">
            <div className="header_log">
                <img src={logo} alt="logo" id="logo_login" />
            </div>
            <div className="page_login">
                <div className="login_window">
                    <form className="login_form" onSubmit={handleLogin}>
                        <label htmlFor="login">Login</label>
                        <input
                            id="login"
                            placeholder="Wpisz login"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <label htmlFor="password">Hasło</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Wpisz hasło"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="submit" id="login_button">Zaloguj się</button>
                        <div className="bottom_buttons">
                            <button
                                type="button"
                                id="sign_up_button"
                                onClick={handleSignUpClick}
                            >
                                Zarejestruj się
                            </button>
                            <button
                                type="button"
                                id="forgot_password_button"
                                onClick={handleForgotPasswordClick}
                            >
                                Zapomniałeś hasła?
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
