import React, { useEffect, useState } from "react";
import './Statistics.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from 'react-router-dom';

function Statistics() {
    const [statistics, setStatistics] = useState([]);
    const navigate = useNavigate();
const [activeButton, setActiveButton] = useState('');

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

useEffect(() => {
    fetch('http://localhost:3000/statistics', {
        method: 'GET',
        credentials: 'include',
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error('Nieautoryzowany dostęp');
        }
        return response.json(); // Przekształć odpowiedź w JSON
    })
    .then(data => {
        console.log('Pobrane dane:', data); // Logowanie danych do weryfikacji
        setStatistics(data); // Ustaw dane w stanie
    })
    .catch((error) => {
        console.error('Błąd przy fetchingu /statistics:', error);
        navigate('/login');
    });                
}, []);

    return (
        <div className="statistics">
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
                <h2>Statystyki spacerów</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Piesek</th>
                            <th>Data ostatniego spaceru</th>
                            <th>Ile dni temu spacerował?</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statistics.map((stat, index) => (
                            <tr key={index}>
                                <td>{stat.dog_name}</td>
                                <td>{stat.last_walk_date}</td>
                                <td>{stat.days_ago}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        
    );
}

export default Statistics;