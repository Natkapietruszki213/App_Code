import React, { useState, useEffect } from "react";
import './Adoptions.css';
import logo from "../assets/logo.jpg";
import { useNavigate } from 'react-router-dom';

function Adoptions() {
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [dogs, setDogs] = useState([]); 
    const [isAdding, setIsAdding] = useState(false);
    const [newAdoption, setNewAdoption] = useState({
        dog_id: '',
        form_date: '',
        ba_note: '',
        walks_amount: '',
        estimated_adoption_date: ''
    });

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
    function handleDelete(dogId) {
        if (window.confirm("Czy na pewno chcesz usunąć ten proces adopcyjny?")) {
            fetch(`http://localhost:3000/adoptions/${dogId}`, {
                method: 'DELETE',
                credentials: 'include',
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Błąd podczas usuwania procesu adopcyjnego");
                    }
                    setDogs(dogs.filter(dog => dog.dog_id !== dogId)); // Aktualizacja listy psów
                    alert("Proces adopcyjny został usunięty.");
                })
                .catch((error) => {
                    console.error("Błąd:", error);
                    alert("Nie udało się usunąć procesu adopcyjnego.");
                });
        }
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
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAdoption({ ...newAdoption, [name]: value });
    };

    const handleAddAdoption = () => {
        fetch('http://localhost:3000/adoptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(newAdoption),
        })
            .then(response => {
                if (!response.ok) throw new Error('Błąd podczas dodawania procesu adopcyjnego');
                return response.json();
            })
            .then(data => {
                alert('Proces adopcyjny został dodany');
                setDogs([...dogs, { dog_name: newAdoption.dog_name }]);
                setIsAdding(false); // Zamknij formularz po dodaniu
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Nie udało się dodać procesu adopcyjnego.');
            });
    };
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
                {isAdding ? (
                        <div className="add-adoption-form">
                            <label>
                                Imię Psa:
                                <input
                                    type="text"
                                    name="dog_name"
                                    value={newAdoption.dog_name}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Data złożenia ankiety przedadopcyjnej:
                                <input
                                    type="date"
                                    name="form_date"
                                    value={newAdoption.form_date}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Opinia BA:
                                <textarea
                                    name="ba_note"
                                    value={newAdoption.ba_note}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Liczba odbytych spacerów przedadopcyjnych:
                                <input
                                    type="number"
                                    name="walks_amount"
                                    value={newAdoption.walks_amount}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <label>
                                Przewidywana data adopcji:
                                <input
                                    type="date"
                                    name="estimated_adoption_date"
                                    value={newAdoption.estimated_adoption_date}
                                    onChange={handleInputChange}
                                />
                            </label>
                            <div class="add_form_buttons">
                                <button className="save_button" onClick={handleAddAdoption}>Dodaj proces adopcyjny</button>
                                <button className="cancel_button" onClick={() => setIsAdding(false)}>Anuluj</button>
                            </div>
                        </div>
                    ) : (
                        <button className="add_button" onClick={() => setIsAdding(true)}>Dodaj proces adopcyjny</button>
                    )}
                <h2>Wybierz pieska, aby zobaczyć szczegóły adopcji:</h2>
                <div className="dogs-list">
                    {dogs.length > 0 ? (
                    dogs.map((dog) => (
                    <div key={dog.dog_id} className="dog-item2">
                        <button
                            className="dog-button"
                            onClick={() => navigate(`/adoptions/${dog.dog_id}`)}
                        >
                            {dog.dog_name}
                        </button>
                        <div className="changes_buttons">
                            <button
                                className="edit_button"
                                onClick={() => navigate(`/adoptions/edit/${dog.dog_id}`)}
                            >
                                Edytuj
                            </button>
                            <button
                                className="delete_button"
                                onClick={() => handleDelete(dog.dog_id)}
                            >
                                Usuń
                            </button>
                        </div>
                    </div>
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
