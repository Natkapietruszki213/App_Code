import React from "react";
import './Home.css';
import logo from "../assets/logo.jpg"

function Home() {
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

            </div>
            <div className="footer">

            </div>
        </div>
    )
}
export default Home;