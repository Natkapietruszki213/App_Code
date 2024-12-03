import React, { useState, useEffect } from "react";
import './Home.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from 'react-router-dom';

function Home() {
    const [dogs, setDogs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:3000/home', {
            method: 'GET',
            credentials: 'include',
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Nieautoryzowany dostęp');
            }
            return response.text(); 
        })
        .then(data => {
            console.log('Dane odpowiedzi:', data);
        })
        .catch((error) => {
            console.error('Błąd przy fetchingu /home:', error);
            navigate('/login');
        });
    }, []);
    
    
    function logOut() {
    console.log('Wylogowanie rozpoczęte');
    fetch('http://localhost:3000/logout', {
        method: 'POST', 
        credentials: 'include' 
    })
    .then(response => {
        if(response.ok) {
            console.log('Wylogowano pomyślnie');
            navigate('/login');
        } else {
            throw new Error('Problem przy wylogowywaniu');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

    return (
        <div className="home">
            <div className="menu">
                <img src={logo} alt="logo" id="logo" />
                <button className="menu_buttons">Psiaki w G4</button>
                <button className="menu_buttons">Spacery</button>
                <button className="menu_buttons">Procesy adopcyjne</button>
                <button className="menu_buttons" id="log_out_button" onClick={logOut}>Wyloguj</button>
            </div>
            <div className="page">
            <h1>Psiaki w schronisku:</h1>
                <ul>
                    {dogs.map(dog => (
                        <li key={dog.id}>{dog.name} - {dog.weight}</li> 
                    ))}
                </ul>
            </div>
            <div className="footer">

            </div>
        </div>
    )
}
export default Home;