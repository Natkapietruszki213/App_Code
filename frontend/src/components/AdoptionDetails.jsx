import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './AdoptionsDetails.css';
import logo from "../assets/logo.jpg";

const AdoptionDetails = () => {
    const { dog_id } = useParams(); 
    const [adoptionData, setAdoptionData] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState('');
    const [userRole, setUserRole] = useState(null);

    function handleNavigation(path, buttonName) {
        setActiveButton(buttonName);
        navigate(path);
    }
    function GoBack() {
        navigate('/adoptions');
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
        const fetchAdoptionData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/adoptions/${dog_id}`, {
                    method: 'GET',
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Nie udało się pobrać danych');
                }

                const data = await response.json();
                setAdoptionData(data); 
            } catch (err) {
                console.error('Błąd pobierania danych adopcyjnych:', err);
                setError('Nie udało się pobrać szczegółów adopcji.');
                navigate('/login');
            }
        };

        fetchAdoptionData();
    }, [dog_id]);

    return (
        <div className="adoptionDetails">
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
                        onClick={() => handleNavigation('/approveUser', 'approveUser')}>
                        Prośby
                    </button>
                )}
                <button className="menu_buttons" id="log_out_button" onClick={logOut}>Wyloguj</button>
            </div>

            <div className="adoption-page">
                {error ? (
                    <p className="error">{error}</p>
                ) : !adoptionData ? (
                    <p>Ładowanie danych adopcji...</p>
                ) : (
                    <>
                        <img
                            src={`/src/assets/${adoptionData.dog_name.toLowerCase()}.jpg`}
                            alt={`Zdjęcie psa ${adoptionData.dog_name}`}
                            className="dog-photo"
                        />
                        <h2 className="adoption-header">Szczegóły procesu adopcyjnego psa {adoptionData.dog_name}</h2>
                        <div className="adoption-details">
                            <span>
                                <label>Data złożenia ankiety:</label>
                                <span>{new Date(adoptionData.form_date).toLocaleDateString()}</span>
                            </span>
                            <span>
                                <label>Opinia pracownika BA:</label>
                                <span>{adoptionData.ba_note || "Ankieta jeszcze nieomówiona"}</span>
                            </span>
                            <span>
                                <label>Liczba odbytych spacerów:</label>
                                <span>{adoptionData.walks_amount}</span>
                            </span>
                            <span>
                                <label>Przewidywana data adopcji:</label>
                                <span>{adoptionData.estimated_adoption_date
                                        ? new Date(adoptionData.estimated_adoption_date).toLocaleDateString()
                                        : "Nieznana"}</span>
                            </span>
                            <div className='button_area'><button type='button' id='back_button' onClick={GoBack}>Powrót</button></div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdoptionDetails;
