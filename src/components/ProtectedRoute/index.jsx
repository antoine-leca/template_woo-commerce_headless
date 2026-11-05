import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Page réservée aux comptes connectés : un visiteur est renvoyé à l'accueil.
//
// La session est restaurée avant le premier rendu (voir initializeApp dans
// main.jsx) : isAuthenticated est donc déjà exact ici, sans état « en cours
// de vérification » à gérer. La garde réagit aussi à la déconnexion faite
// depuis la page elle-même.
//
// `replace` : l'adresse refusée ne reste pas dans l'historique, le bouton
// « page précédente » ne ramène pas sur une redirection.
export default function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
