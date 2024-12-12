import React, { useState, useEffect } from "react";
import './Home.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from 'react-router-dom';

function Home() {
    const [dogs, setDogs] = useState([]);
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState('');

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
        .catch((error) => {
            console.error('Błąd przy fetchingu /home:', error);
            navigate('/login');
        });
    }, []);
    useEffect(() => {
        fetch('http://localhost:3000/dogs', {
            method: 'GET',
            credentials: 'include',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Błąd w pobieraniu danych psów');
            }
            return response.json();
        })
        .then(data => {
            setDogs(data); // Przypisz pobrane psy do stanu
        })
        .catch((error) => {
            console.error('Błąd przy fetchingu /dogs:', error);
        });
    }, []);

    function handleNavigation(path, buttonName) {
        setActiveButton(buttonName);
        navigate(path);
    }

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
                <button className={`menu_buttons ${activeButton === 'home' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/home', 'home')}>Psiaki w G4</button>
                <button  className={`menu_buttons ${activeButton === 'walks' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/walks', 'walks')}>Spacery</button>
                <button className={`menu_buttons ${activeButton === 'statistics' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/statistics', 'statistics')}>Statystyki spacerowe</button>
                <button className={`menu_buttons ${activeButton === 'adoptions' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/adoptions', 'adoptions')}>Procesy adopcyjne</button>
                <button className="menu_buttons" id="log_out_button" onClick={logOut}>Wyloguj</button>
            </div>
            <div className="page">
            <ul className="dogs-list">
                {dogs.map(dog => (
                    <li key={dog.id} className="dog-item">
                        <img 
                            src={`/src/assets/${dog.name.toLowerCase()}.jpg`} 
                            alt={dog.name} 
                            className="dog-image"
                            onError={(e) => { e.target.src = "/src/assents/default.jpg"; }} 
                        />
                        <div className="dog-details">
                            <span>{dog.name}</span>
                            <span>Waga: {dog.weight} kg</span>
                            <span>Wiek: {dog.age} lat</span>
                            <span>Nr boksu: {dog.box}</span>
                            <span>Przyjęty: {dog.arrived}</span>
                            <span>Uwagi: {dog.work}</span>
                        </div>
                    </li>
                ))}
            </ul>
            </div>
        </div>
    )
}
export default Home;