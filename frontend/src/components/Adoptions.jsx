import React, { useState, useEffect } from "react";
import './Adoptions.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from 'react-router-dom';

function Adoptions() {
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState('');
    const [userRole, setUserRole] = useState(null); 

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
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Nieautoryzowany dostęp');
            }
            return response.text(); 
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
        <div className="adoptions">
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
            </div>
        </div>
    )
}
export default Adoptions;