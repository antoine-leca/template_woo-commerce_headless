import React, { useRef, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutThunk } from "../../../thunkActionsCreator/userThunks";
import { showToast } from "../../../slices/toastSlice";
import { useTranslation } from "react-i18next";

export default function ProfileNavigation({ activeTab, onTabChange }) {
  const { t } = useTranslation();
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Déclaré APRÈS le hook : les libellés sont calculés à chaque rendu, donc
  // recalculés au changement de langue. Les placer avant utiliserait t()
  // avant son initialisation — une erreur que le bundler ne voit pas.
  const tabs = [
    { id: "profil", label: t("account.myProfile") },
    { id: "adresses", label: t("account.addressBook") },
    { id: "commandes", label: t("account.myOrders") },
  ];

  // La barre du header n'expose plus de menu : c'est ici que la déconnexion
  // se fait désormais. `logoutThunk` vide aussi le jeton de panier invité, via
  // l'écouteur du store — la session suivante repart d'un panier propre.
  const handleLogout = () => {
    dispatch(logoutThunk());
    dispatch(showToast(t("account.loggedOut")));
    navigate("/");
  };

  // Met à jour la position de la ligne animée
  useEffect(() => {
    const updateIndicator = () => {
      if (window.innerWidth >= 768 && navRef.current) {
        const activeBtn = navRef.current.querySelector(
          `button[data-id="${activeTab}"]`,
        );
        if (activeBtn) {
          setIndicatorStyle({
            left: activeBtn.offsetLeft + "px",
            width: activeBtn.clientWidth + "px",
          });
        }
      }
    };

    updateIndicator();
    // Recalcule au redimensionnement de la fenêtre
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab]);

  return (
    <nav className="profile-nav" ref={navRef}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-id={tab.id}
          className={activeTab === tab.id ? "active" : ""}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
      {/* La ligne qui glisse */}
      <div className="nav-indicator" style={indicatorStyle} />

      <button className="logout-btn" onClick={handleLogout}>
        {t("account.logout")}
      </button>
    </nav>
  );
}
