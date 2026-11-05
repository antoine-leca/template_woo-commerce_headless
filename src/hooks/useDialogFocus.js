import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportement clavier d'une fenêtre modale :
 *  - le focus entre dans la fenêtre à l'ouverture (premier élément utilisable) ;
 *  - Tab et Maj+Tab bouclent à l'intérieur, sans atteindre la page derrière ;
 *  - Échap la ferme ;
 *  - le défilement de la page derrière est bloqué ;
 *  - à la fermeture, le focus retourne à l'élément qui l'avait ouverte.
 *
 * `dialogRef` désigne l'élément role="dialog" (avec tabIndex={-1}, pour que le
 * focus ait toujours un point d'arrivée). `active` permet de l'utiliser dans un
 * composant toujours monté, comme AuthDrawer, qui n'affiche son contenu que
 * ouvert. Même logique que CheckoutAuthPromptModal.
 */
export default function useDialogFocus(dialogRef, { active = true, onClose }) {
  // Toujours la dernière version de onClose, sans relancer l'effet : le
  // relancer à chaque rendu ramènerait le focus au début de la fenêtre.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!active || !dialog) return undefined;

    const triggerElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    (dialog.querySelector(FOCUSABLE) || dialog).focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [...dialog.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerElement?.focus?.();
    };
  }, [active, dialogRef]);
}
