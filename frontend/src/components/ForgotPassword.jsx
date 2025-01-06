import React, { useEffect, useState } from "react";
import './ForgotPassword.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState(""); // Stan do przechowywania e-maila
    const [message, setMessage] = useState(""); // Wiadomość o wyniku akcji (sukces/błąd)

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
                setLoading(false); // Jeśli niezalogowany, zakończ ładowanie
            }
        })
        .catch(error => {
            console.error("Błąd podczas sprawdzania sesji:", error);
            setLoading(false); // Pozwól użytkownikowi pozostać na stronie
        });
    }, [navigate]);

    const handleEmailChange = (e) => {
        setEmail(e.target.value); // Aktualizuj e-mail na podstawie wpisu użytkownika
    };
    
    function GoBack(){
        navigate('/login');}

    const handleSubmit = async (e) => {
        e.preventDefault(); // Zapobiega przeładowaniu strony po wysłaniu formularza
        try {
            const response = await fetch("http://localhost:3000/forgotPassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }), // Wysyła e-mail w formacie JSON
            });

            if (response.ok) {
                setMessage("Link do zresetowania hasła został wysłany na Twój e-mail.");
                setTimeout(() => navigate('/login'), 3000); // Po 3 sekundach przekierowuje na stronę logowania
            } else {
                const errorData = await response.json();
                setMessage(errorData.message || "Wystąpił problem. Spróbuj ponownie.");
            }
        } catch (error) {
            console.error("Błąd podczas wysyłania żądania:", error);
            setMessage("Nie udało się wysłać wiadomości. Sprawdź połączenie internetowe.");
        }
    };

    return (
        <div className=".page_forget_password">
            <div className="header_log">
                <img src={logo} alt="logo" id="logo_login" />
            </div>
            <div className="page_forget_password">
                <div className="forget_password_window">
                    <form className="forget_password_form" onSubmit={handleSubmit}>
                        <label htmlFor="email">Podaj e-mail:</label>
                        <input 
                            id="email" 
                            placeholder="Podaj mail:"
                            value={email} 
                            onChange={handleEmailChange} 
                            required
                        />
                        <button type='submit' id='remind_password_button'>Wyślij</button>
                        <button type='button' id='back_button' onClick={GoBack}>Powrót</button>
                    </form>
                    {message && <p className="message">{message}</p>} {/* Wyświetla wiadomość */}
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword;
