import React, { useEffect, useState } from "react";
import './newPassword.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";


function NewPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState("");
    const token = searchParams.get("token");
    
    const handlePasswordChange = (e) => {
        setPassword(e.target.value); 
    };
    
     // Sprawdzenie sesji użytkownika na starcie
     useEffect(() => {
        fetch('http://localhost:3000/checkSession', {
            method: 'GET',
            credentials: 'include',
        })
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                navigate('/home'); // Przekierowanie zalogowanego użytkownika
            } else {
            }
        })
        .catch(error => {
            console.error("Błąd podczas sprawdzania sesji:", error);
        });
    }, [navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const response = await fetch("http://localhost:3000/newPassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password, token }), // Upewnij się, że token jest poprawnie przekazany
            });
    
            if (response.ok) {
                alert("Hasło zostało zmienione!");
                navigate('/login');
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Wystąpił błąd.");
            }
        } catch (error) {
            console.error("Błąd podczas zmiany hasła:", error);
            alert("Nie udało się zmienić hasła.");
        }
    };    
    
    return (
        <div className=".page_forget_password">
            <div className="header_log">
                <img src={logo} alt="logo" id="logo_login" />
            </div>
            <div className="page_new_password">
                <div className="new_password_window">
                    <form className="new_password_form" onSubmit={handleSubmit}>
                        <label htmlFor="password">Podaj nowe hasło:</label>
                        <input 
                            id="password" 
                            placeholder="Podaj nowe hasło:"
                            value={password} 
                            type="password"
                            onChange={handlePasswordChange} 
                            required
                        />
                        <button type='submit' id='new_password_button'>Ustaw nowe hasło</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default NewPassword;
