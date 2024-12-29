import React, { useState, useEffect } from "react";
import './Adoptions.css';
import logo from "../assets/logo.jpg";
import { useNavigate } from 'react-router-dom';

function Adoptions() {
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [dogs, setDogs] = useState([]); 

    useEffect(() => {
        fetch('http://localhost:3000/checkSession', {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd podczas sprawdzania sesji');
                }
                return response.json();
            })
            .then(data => {
                console.log('Sesja użytkownika:', data);
                if (data.loggedIn && data.role) {
                    setUserRole(data.role);
                }
            })
            .catch(error => {
                console.error('Błąd:', error);
            });
    }, []);

    useEffect(() => {
        fetch('http://localhost:3000/adoptions', {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Nieautoryzowany dostęp');
                }
                return response.json();
            })
            .then(data => {
                console.log('Pobrane dane:', data);
                setDogs(data); 
            })
            .catch((error) => {
                console.error('Błąd przy fetchingu /adoptions:', error);
                navigate('/login');
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
                if (response.ok) {
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
        <div className="adoptions">
            <div className="menu">
                <img src={logo} alt="logo" id="logo" />
                <button className={`menu_buttons ${activeButton === 'home' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/home', 'home')}>Psiaki w G4</button>
                <button className={`menu_buttons ${activeButton === 'walks' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/walks', 'walks')}>Spacery</button>
                <button className={`menu_buttons ${activeButton === 'statistics' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/statistics', 'statistics')}>Statystyki spacerowe</button>
                <button className={`menu_buttons ${activeButton === 'adoptions' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/adoptions', 'adoptions')}>Procesy adopcyjne</button>
                {userRole === 'admin' && (
                    <button
                        className={`menu_buttons ${activeButton === 'approveUser' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/approveUser', 'approveUser')}
                    >
                        Prośby
                    </button>
                )}
                <button className="menu_buttons" id="log_out_button" onClick={logOut}>Wyloguj</button>
            </div>
            <div className="page">
                <h2>Wybierz pieska, aby zobaczyć szczegóły adopcji:</h2>
                <div className="dogs-list">
                    {dogs.length > 0 ? (
                        dogs.map((dog) => (
                            <button
                                key={dog.dog_id}
                                className="dog-button"
                                onClick={() => navigate(`/adoptions/${dog.dog_id}`)}
                            >
                                {dog.dog_name}
                            </button>
                        ))
                    ) : (
                        <p>Brak aktualnych procesów adopcyjnych.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Adoptions;
