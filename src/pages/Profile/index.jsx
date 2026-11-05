import React, { useEffect, useState } from "react";

import "./index.scss";
import AddressBook from "./components/AddressBook";
import UserInfo from "./components/UserInfo";
import OrdersList from "./components/OrdersList";
import ProfileNavigation from "./components/ProfileNavigation";
import { useTranslation } from "react-i18next";
import Seo from "../../components/Seo";

export default function Profile() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("profil");
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (!isDesktop) {
      setIsMobileMenuVisible(false); // Cache le menu vertical sur mobile
    }
  };

  const handleBackToMenu = () => {
    setIsMobileMenuVisible(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profil":
        return <UserInfo />;
      case "adresses":
        return <AddressBook />;
      case "commandes":
        return <OrdersList />;
      default:
        return <UserInfo />;
    }
  };

  return (
    <div className="profile-container">
      <Seo title={t("seo.profile")} noIndex />
      {/* Navigation visible si desktop OU si menu mobile actif */}
      {(isDesktop || isMobileMenuVisible) && (
        <ProfileNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}

      {/* Contenu visible si desktop OU si un onglet a été cliqué en mobile */}
      {(isDesktop || !isMobileMenuVisible) && (
        <div className="profile-content-wrapper">
          {!isDesktop && (
            <button className="back-btn" onClick={handleBackToMenu}>
              {t("account.previous")}
            </button>
          )}
          {renderContent()}
        </div>
      )}
    </div>
  );
}
