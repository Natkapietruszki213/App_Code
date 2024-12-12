import React, { useState } from "react";
import './SignUp.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from "react-router-dom";
function SignUp() {

    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');

    function GoBack(){
        navigate('/login');}

    const validate = async (e) => {
        e.preventDefault();

        if (!name || !surname || !login || !password || !email ) {
            alert("Wypełnij wszystkie pola!");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert("Wprowadź poprawny adres e-mail.");
            return;
        }

        const response = await fetch('http://localhost:3000/signUp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
            name: name,
            surname: surname,
            email: email,
            login: login,
            password: password})
        });
          console.log(response);
        if (response.ok) {
                alert(JSON.stringify("Konto zostało pomyślnie utworzone!"));
                navigate('/login');
            } 
            else {
                alert(JSON.stringify("Wystąpił błąd."));
            }
        };
    
    return (
        <div className="App">
            <div className="header_log">
                <img src={logo} alt="logo" id="logo_login" />
            </div>
            <div className="page_signup">
                <div className="signup_window">
                    <form className="signup_form" id="signup_form" onSubmit={validate}>
                        <label htmlFor="name">Imię:</label>
                        <input id="name" placeholder="Podaj imię:" type="text" onChange={(e) => setName(e.target.value)} value={name}></input>
                        <label htmlFor="surname">Nazwisko:</label>
                        <input id="surname" placeholder="Podaj nazwisko:" type="text" onChange={(e) => setSurname(e.target.value)} value={surname}></input>
                        <label htmlFor="email">E-mail:</label>
                        <input id="email" placeholder="Podaj mail:" type="text" onChange={(e) => setEmail(e.target.value)} value={email}></input>
                        <label htmlFor="login">Login:</label>
                        <input id="login" placeholder="Podaj login:" type="text" onChange={(e) => setLogin(e.target.value)} value={login}></input>
                        <label htmlFor="password">Hasło:</label>
                        <input id="password" placeholder="Podaj hasło:" value={password} type="password" onChange={(e) => setPassword(e.target.value)}></input>
                        <button type='submit' id='try_sign_up_button'>Załóż konto</button>
                        <button type='button' id='back_button' onClick={GoBack}>Powrót</button>
                        <div className="bottom_buttons">
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
export default SignUp;