import React, { useState, useEffect } from "react";
import './Walks.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from 'react-router-dom';

function Walks() {
    const today = new Date();
    const year = String(today.getFullYear());
    const month = String(today.getMonth()+1);
    const day = String(today.getDate()); 
    const today_date = `${day}-${month}-${year}`;
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState('');
    const [dogs, setDogs] = useState([]);
    const [selectedDogs, setSelectedDogs] = useState(new Set());

    useEffect(() => {
        // Sprawdź autoryzację przez endpoint /walks
        fetch('http://localhost:3000/walks', {
            method: 'GET',
            credentials: 'include',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Nieautoryzowany dostęp do /walks');
            }
            return response.json(); 
        })
        .then(() => {
            return fetch('http://localhost:3000/dogs', {
                method: 'GET',
                credentials: 'include',
            });
        })
        .then(response => {
            console.log('Nagłówki odpowiedzi:', response.headers.get('Content-Type'));
            if (!response.ok) {
                throw new Error(`Błąd HTTP: ${response.status}`);
            }
            if (response.headers.get('Content-Type')?.includes('application/json')) {
                return response.json(); 
            } else {
                throw new Error('Odpowiedź serwera nie jest w formacie JSON');
            }
        })
        .then(data => {
            console.log('Dane z /dogs:', data);
            setDogs(data); 
        })
        .catch(error => {
            console.error('Błąd podczas fetchowania:', error);
            navigate('/login'); 
        });
    }, [navigate]);    

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

    const toggleDogSelection = (dogId) => {
        setSelectedDogs(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(dogId)) {
                newSelected.delete(dogId);
            } else {
                newSelected.add(dogId);
            }
            return newSelected;
        });
    };

    const saveWalks = () => {
        const walkData = {
            date: today_date, 
            selectedDogs: Array.from(selectedDogs), 
        };
    
        if (walkData.selectedDogs.length === 0) {
            alert('Nie zaznaczono żadnego psa na spacer!');
            return;
        }
    
        fetch('http://localhost:3000/walks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(walkData), 
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Nie udało się zapisać spacerów');
                }
                return response.json();
            })
            .then(data => {
                console.log('Zapisano spacery:', data);
                alert('Spacery zostały zapisane!');
                setSelectedDogs(new Set()); 
            })
            .catch(error => {
                console.error('Błąd podczas zapisywania spacerów:', error);
                alert('Wystąpił błąd podczas zapisywania spacerów.');
            });
    };    

    return (
        <div className="walks">
            <div className="menu">
                <img src={logo} alt="logo" id="logo" />
                <button className={`menu_buttons ${activeButton === 'home' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/home', 'home')}>Psiaki w G4</button>
                <button  className={`menu_buttons ${activeButton === 'walks' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/walks', 'walks')}>Spacery</button>
                <button className={`menu_buttons ${activeButton === 'adoptions' ? 'active' : ''}`}
                    onClick={() => handleNavigation('/adoptions', 'adoptions')}>Procesy adopcyjne</button>
                <button className="menu_buttons" id="log_out_button" onClick={logOut}>Wyloguj</button>
            </div>
            <div className="page">
            <p>{today_date}</p>
                <h2>Lista psiaków</h2>
                <div className="dogs_list">
                    <ul>
                        {dogs.map((dog, index) => (
                            <li key={index}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedDogs.has(dog.name)}
                                        onChange={() => toggleDogSelection(dog.name)}
                                    />
                                    {dog.name}
                                </label>
                            </li>
                        ))}
                    </ul>
                    <button onClick={saveWalks} className="save_walks_button">
                        Zapisz spacery
                    </button>
                </div>
            </div>
            <div className="footer">
            </div>
        </div>
    )
}
export default Walks;