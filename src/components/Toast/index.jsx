import "./index.scss";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideToast } from "../../slices/toastSlice";
import { decodeHtml } from "../../utils/decodeHtml";

export default function Toast() {
  const dispatch = useDispatch();
  const message = useSelector((state) => state.toast.message);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => dispatch(hideToast()), 3000);
    return () => clearTimeout(timeout);
  }, [message, dispatch]);

  // Texte, jamais du HTML : les messages (noms de produits, erreurs du
  // serveur) peuvent contenir des entités (&rsquo;, &#215;) qu'on décode, mais
  // pas du balisage à exécuter.
  // role="status" : un lecteur d'écran annonce le message sans déplacer le
  // focus. Le conteneur reste dans la page même sans message : une zone
  // créée en même temps que son texte n'est pas toujours annoncée.
  return (
    <div
      className={message ? "toast" : undefined}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message && <div>{decodeHtml(message)}</div>}
    </div>
  );
}
