import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../components/Login";

describe("Login Component", () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Czyści wszystkie mocki przed każdym testem
    });

    it("renders login form", async () => {
        // Mock odpowiedzi fetch
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ loggedIn: false }),
            })
        );

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByPlaceholderText(/wpisz login/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/wpisz hasło/i)).toBeInTheDocument();
    });
});
