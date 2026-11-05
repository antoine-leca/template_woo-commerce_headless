import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Page réservée aux comptes connectés : un visiteur est renvoyé à l'accueil.
//
// L'application s'affiche avant que le serveur ait dit s'il y a une session
// (voir initializeApp dans main.jsx) : la garde attend user.sessionChecked
// avant de décider. Elle réagit aussi à la déconnexion faite depuis la page
// elle-même.
//
// `replace` : l'adresse refusée ne reste pas dans l'historique, le bouton
// « page précédente » ne ramène pas sur une redirection.
export default function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const sessionChecked = useSelector((state) => state.user.sessionChecked);

  // L'application s'affiche avant la réponse du serveur sur la session :
  // isAuthenticated vaut false sans que ce soit un verdict. Renvoyer à
  // l'accueil à ce moment-là chasserait un client connecté qui recharge /profile.
  if (!sessionChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
