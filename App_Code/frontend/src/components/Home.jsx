import React, { useState, useEffect } from "react";
import './Home.css';
import logo from "../assets/logo.jpg"

function Home() {
    const [dogs, setDogs] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/dogs')
            .then(response => response.json())
            .then(data => setDogs(data.users)) // Ustawienie stanu psów pobranych z API
            .catch(error => console.error('Error:', error));
    }, []);

    return (
        <div className="home">
            <div className="menu">
                <img src={logo} alt="logo" id="logo" />
                <button className="menu_buttons">Psiaki w G4</button>
                <button className="menu_buttons">Spacery</button>
                <button className="menu_buttons">Procesy adopcyjne</button>
                <button className="menu_buttons">Samouczek</button>
            </div>
            <div className="page">
            <h1>Psiaki w schronisku:</h1>
                <ul>
                    {dogs.map(dog => (
                        <li key={dog.id}>{dog.name} - {dog.weight}</li> // Przykładowe wyświetlanie imienia i rasy psa
                    ))}
                </ul>
            </div>
            <div className="footer">

            </div>
        </div>
    )
}
export default Home;