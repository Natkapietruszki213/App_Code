import React, { useState } from "react";
import './Modal.css';

function Modal() {
    const [isOpen, setIsOpen] = useState(true);
    const closeCookieWindow = () => {
        setIsOpen(false)
    };
    if (!isOpen) return null;

    return (
        <div className="cookies">
            <div id="cookies_info">Zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. 
            informujemy, że przetwarzamy Twoje dane osobowe (imię, nazwisko, adres e-mail) w celu usprawnienia opieki nad zwierzętami.
            Ta strona internetowa korzysta z plików cookie, aby zapewnić lepszą jakość przeglądania, analizować ruch na stronie 
            oraz dostosować treści do Twoich preferencji. Kontynuując korzystanie z tej witryny, wyrażasz zgodę na używanie plików 
            cookie zgodnie z naszą polityką prywatności.
                <button id="cookies_button" onClick={closeCookieWindow}>Zaakceptuj</button>
            </div>
        </div>
    )
}
export default Modal;