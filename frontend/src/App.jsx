
import './App.css';
import React from 'react';
import Login from './components/Login';
import Walks from './components/Walks';
import Home from './components/Home';
import Adoptions from './components/Adoptions';
import Modal from './components/Modal';
import Statistics from './components/Statistics';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import NewPassword from './components/newPassword';
import ApproveUser from './components/ApproveUser';
import AdoptionDetails from './components/AdoptionDetails';
import AdoptionEdit from './components/AdoptionEdit';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {

    return (
        <div className='App'>
            <Router>
                <Modal />
                <Routes>
                    <Route path="/" exact element={<Login />} />
                    <Route path="/home" exact element={<Home />} />
                    <Route path="/walks" exact element={<Walks />} />
                    <Route path="/statistics" exact element={<Statistics />} />
                    <Route path="/signUp" exact element={<SignUp />} />
                    <Route path="/login" exact element={<Login />} />
                    <Route path="/adoptions" exact element={<Adoptions />} />
                    <Route path="/forgotPassword" exact element={<ForgotPassword />} />
                    <Route path="/newPassword" exact element={<NewPassword />} />
                    <Route path="/ApproveUser" exact element={<ApproveUser />} />
                    <Route path="/adoptions/:dog_id" exact element={<AdoptionDetails />} />
                    <Route path="/adoptions/edit/:dog_id" exact element={<AdoptionEdit />} />


                </Routes>
            </Router>
        </div>
    );
}

export default App;
