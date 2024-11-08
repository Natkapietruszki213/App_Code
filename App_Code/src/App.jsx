
import './App.css';
import React from 'react';
import Login from './components/Login';
import Home from './components/Home';
import Modal from './components/Modal';
import SignUp from './components/SignUp';
import ForgetPassword from './components/ForgetPassword';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
    return (
        <div className='App'>
            <Router>
                <Modal />
                <Routes>
                    <Route path="/" exact element={<Login />} />
                    <Route path="/home" exact element={<Home />} />
                    <Route path="/SignUp" exact element={<SignUp />} />
                    <Route path="/ForgetPassword" exact element={<ForgetPassword />} />

                </Routes>
            </Router>
        </div>
    );
}

export default App;
