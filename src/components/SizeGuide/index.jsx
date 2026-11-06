import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./index.css";

/**
 * Guide des tailles : un bouton qui ouvre une fenêtre avec le tableau des
 * mesures (texte et valeurs dans les fichiers de langue : sizeGuide.*).
 */
export default function SizeGuide() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const rows = t("sizeGuide.rows", { returnObjects: true });

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="size-guide__trigger"
        onClick={() => setOpen(true)}
      >
        {t("sizeGuide.open")}
      </button>

      {open && (
        <div className="size-guide__backdrop" onClick={() => setOpen(false)}>
          <div
            className="size-guide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="size-guide-title">{t("sizeGuide.title")}</h3>
            <p>{t("sizeGuide.intro")}</p>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t("sizeGuide.size")}</th>
                  <th scope="col">{t("sizeGuide.chest")}</th>
                  <th scope="col">{t("sizeGuide.waist")}</th>
                  <th scope="col">{t("sizeGuide.hips")}</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(rows) &&
                  rows.map((r) => (
                    <tr key={r.size}>
                      <th scope="row">{r.size}</th>
                      <td>{r.chest}</td>
                      <td>{r.waist}</td>
                      <td>{r.hips}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <p className="size-guide__tip">{t("sizeGuide.tip")}</p>
            <button
              ref={closeRef}
              type="button"
              className="size-guide__close"
              onClick={() => setOpen(false)}
            >
              {t("sizeGuide.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
