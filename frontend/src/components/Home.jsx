import React, { useState, useEffect } from "react";
import './Home.css';
import logo from "../assets/logo.jpg"
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState('');
    const [userRole, setUserRole] = useState(null); 
    const [dogs, setDogs] = useState([]);
    const [editingDog, setEditingDog] = useState(null);
    const [formVisible, setFormVisible] = useState(false);
    const [dogData, setDogData] = useState({
        name: '',
        weight: '',
        age: '',
        box: '',
        arrived: '',
        work: '',
        image: null
    });
    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (!dogData.name || !dogData.weight || !dogData.age || !dogData.box || !dogData.arrived || !dogData.work) {
            alert("Wszystkie pola są wymagane!");
            return;
        }
    
        const formData = new FormData();
        formData.append('name', dogData.name);
        formData.append('weight', dogData.weight);
        formData.append('age', dogData.age);
        formData.append('box', dogData.box);
        formData.append('arrived', dogData.arrived);
        formData.append('work', dogData.work);
        if (dogData.image) {
            formData.append('image', dogData.image);
        }
    
        const method = editingDog ? 'PUT' : 'POST';
        const url = editingDog ? `http://localhost:3000/dogs/${editingDog.dog_id}` : 'http://localhost:3000/dogs';
    
        fetch(url, {
            method,
            credentials: 'include',
            body: formData,
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd przy zapisie psa');
                }
                return response.json();
            })
            .then(data => {
                if (editingDog) {
                    setDogs(prev => prev.map(d => (d.dog_id === editingDog.dog_id ? { ...dogData, dog_id: editingDog.dog_id } : d)));
                } else {
                    setDogs(prev => [...prev, { ...dogData, dog_id: data.dog_id }]);
                }
                resetForm();
            })
            .catch(err => alert(err.message));
    };

    const deleteDog = (dogId) => {
        fetch(`http://localhost:3000/dogs/${dogId}`, {
            method: 'DELETE',
            credentials: 'include',
        })
            .then(response => {
                if (!response.ok) throw new Error('Błąd przy usuwaniu psa');
                setDogs(prevDogs => prevDogs.filter(dog => dog.dog_id !== dogId));
            })
            .catch(err => alert(err.message));
    };

    const startEditing = (dog) => {
        setEditingDog(dog);
        setDogData({
            name: dog.name,
            weight: dog.weight,
            age: dog.age,
            box: dog.box,
            arrived: dog.arrived,
            work: dog.work,
        });
        setFormVisible(true);
    };
    const resetForm = () => {
        setDogData({ name: '', weight: '', age: '', box: '', arrived: '', work: '' });
        setEditingDog(null);
        setFormVisible(false);
    };

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
            <button className="add_button" onClick={() => setFormVisible(true)}>Dodaj psa</button>
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
                                    <button className="form_buttons" onClick={() => startEditing(dog)}>Edytuj</button>
                                    <button className="form_buttons"  onClick={() => deleteDog(dog.dog_id)}>Usuń</button>
                        </div>
                    </li>
                ))}
            </ul>
            {formVisible && (
                    <form onSubmit={handleFormSubmit} className="dog-form">
                        <h3>{editingDog ? 'Edytuj psa' : 'Dodaj psa'}</h3>
                        Imię: <input
                            type="text"
                            placeholder="Imię"
                            value={dogData.name}
                            onChange={(e) => setDogData({ ...dogData, name: e.target.value })}
                            required
                        />
                        Wiek: <input
                            type="number"
                            placeholder="Wiek"
                            value={dogData.age}
                            onChange={(e) => setDogData({ ...dogData, age: e.target.value })}
                            required
                        />
                        Waga: <input
                            type="number"
                            placeholder="Waga"
                            value={dogData.weight}
                            onChange={(e) => setDogData({ ...dogData, weight: e.target.value })}
                            required
                        />
                        Nr boksu: <input
                            type="number"
                            placeholder="Nr boksu"
                            value={dogData.box}
                            onChange={(e) => setDogData({ ...dogData, box: e.target.value })}
                            required
                        />
                        Przyjęty: <input
                            type="date"
                            placeholder="Data przyjęcia"
                            value={dogData.arrived}
                            onChange={(e) => setDogData({ ...dogData, arrived: e.target.value })}
                            required
                        />
                        Uwagi: <textarea
                            id="work"
                            placeholder="Uwagi"
                            value={dogData.work}
                            onChange={(e) => setDogData({ ...dogData, work: e.target.value })}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setDogData({ ...dogData, image: e.target.files[0] })}
                        />
                        <div className="buttons">
                            <button className="form_buttons"  type="submit">{editingDog ? 'Zapisz' : 'Dodaj'}</button>
                            <button className="form_buttons"  type="button" onClick={resetForm}>Anuluj</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
export default Home;