import React, { useEffect, useState } from "react";
import './ApproveUser.css';
import logo from "../assets/logo.jpg";
import { useNavigate } from "react-router-dom";

function ApproveUser() {
    const navigate = useNavigate();
    const [activeButton, setActiveButton] = useState('');
    const [pendingUsers, setPendingUsers] = useState([]); 
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
                if (data.loggedIn) {
                    setUserRole(data.role); 
                    if (data.role !== 'admin') {
                        navigate('/home'); 
                    }
                } else {
                    navigate('/login'); 
                }
            })
            .catch(error => {
                console.error('Błąd:', error);
            });

        fetch('http://localhost:3000/pendingUsers', {
            method: 'GET',
            credentials: 'include',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd podczas pobierania użytkowników');
                }
                return response.json();
            })
            .then(data => {
                console.log('Pobrano użytkowników:', data);
                setPendingUsers(data);
            })
            .catch(error => {
                console.error('Błąd:', error);
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

    function approveUser(userId) {
        fetch('http://localhost:3000/approveUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ userId })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd podczas zatwierdzania użytkownika');
                }
                return response.json();
            })
            .then(data => {
                console.log('Sukces:', data);
                alert('Użytkownik został zatwierdzony!');
                setPendingUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Nie udało się zatwierdzić użytkownika');
            });
    }
    function rejectUser(userId) {
        fetch('http://localhost:3000/rejectUser', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ userId })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd podczas odrzucania użytkownika');
                }
                return response.json();
            })
            .then(data => {
                console.log('Sukces:', data);
                alert('Użytkownik został odrzucony!');
                setPendingUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Nie udało się odrzucić użytkownika');
            });
    }

    return (
        <div className="home">
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
                <h1>Lista użytkowników do zatwierdzenia</h1>
                {pendingUsers.length === 0 ? (
                    <p>Brak użytkowników do zatwierdzenia</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Imię</th>
                                <th>Nazwisko</th>
                                <th>Email</th>
                                <th>Akcja</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingUsers.map(user => (
                                <tr key={user.user_id}>
                                    <td>{user.name}</td>
                                    <td>{user.surname}</td>
                                    <td>{user.mail}</td>
                                    <td>
                                        <button className="users_activity_button" id='acceptButton' onClick={() => approveUser(user.user_id)}>Zatwierdź</button>
                                        <button className="users_activity_button" id='rejectButton' onClick={() => rejectUser(user.user_id)}>Odrzuć</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default ApproveUser;
