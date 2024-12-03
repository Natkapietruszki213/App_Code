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
            <div id="cookies_info">Ta strona internetowa korzysta z plików cookie, aby zapewnić lepszą jakość przeglądania, analizować ruch na stronie oraz dostosować treści do Twoich preferencji. Kontynuując korzystanie z tej witryny, wyrażasz zgodę na używanie plików cookie zgodnie z naszą polityką prywatności.
                <button id="cookies_button" onClick={closeCookieWindow}>Zaakceptuj pliki cookie</button>
            </div>
        </div>
    )
}
export default Modal;