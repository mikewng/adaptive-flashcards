import DeckView from "../screens/deckview/DeckView"
import Landing from "../screens/landing/Landing"
import Login from "../screens/login/Login"

export const navMapping = {
    "Home": <Landing />,
    "Decks": <DeckView />,
    "Login": <Login />
}