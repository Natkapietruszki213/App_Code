import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './AdoptionEdit.css';

function AdoptionEdit() {
    const { dog_id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        form_date: "",
        ba_note: "",
        walks_amount: 0,
        estimated_adoption_date: "",
    });

    useEffect(() => {
        fetch(`http://localhost:3000/adoptions/${dog_id}`, {
            method: "GET",
            credentials: "include",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Nie udało się pobrać danych adopcyjnych.");
                }
                return response.json();
            })
            .then((data) => {
                setFormData({
                    form_date: data.form_date || "",
                    ba_note: data.ba_note || "",
                    walks_amount: data.walks_amount || 0,
                    estimated_adoption_date: data.estimated_adoption_date || "",
                });
            })
            .catch((error) => {
                console.error("Błąd:", error);
                alert("Błąd podczas pobierania danych adopcyjnych.");
            });
    }, [dog_id]);

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    }

    function handleSubmit(e) {
        e.preventDefault();
        fetch(`http://localhost:3000/adoptions/${dog_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(formData),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Nie udało się zaktualizować procesu adopcyjnego.");
                }
                alert("Proces adopcyjny został zaktualizowany.");
                navigate("/adoptions");
            })
            .catch((error) => {
                console.error("Błąd:", error);
                alert("Błąd podczas aktualizacji procesu adopcyjnego.");
            });
    }

    return (
        <div className="edit-adoption">
            <h2>Edytuj proces adopcyjny</h2>
            <form  className="edit-adoption-form" onSubmit={handleSubmit}>
                <label>
                    Data złożenia ankiety przedadopcyjnej:
                    <input
                        type="date"
                        name="form_date"
                        value={formData.form_date}
                        onChange={handleInputChange}
                    />
                </label>
                <label>
                    Opinia Biura Adopcji:
                    <textarea
                        name="ba_note"
                        value={formData.ba_note}
                        onChange={handleInputChange}
                    />
                </label>
                <label>
                    Liczba odbytych spacerów przedadopcyjnych:
                    <input
                        type="number"
                        name="walks_amount"
                        value={formData.walks_amount}
                        onChange={handleInputChange}
                    />
                </label>
                <label>
                    Przewidywana data adopcji:
                    <input
                        type="date"
                        name="estimated_adoption_date"
                        value={formData.estimated_adoption_date}
                        onChange={handleInputChange}
                    />
                </label>
                <div className="edit_buttons">
                <button type="submit">Zapisz zmiany</button>
                <button type="button" onClick={() => navigate("/adoptions")}>
                    Anuluj
                </button>
                </div>
            </form>
        </div>
    );
}

export default AdoptionEdit;
