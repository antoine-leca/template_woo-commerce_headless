import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";

import store from "./store";
import "./i18n";

import { initializeCartThunk } from "./thunkActionsCreator/cartThunks";
import {
  restoreSessionThunk,
  fetchCurrentUserThunk,
  fetchCurrentCustomerThunk,
  fetchCurrentUserOrdersThunk,
} from "./thunkActionsCreator/userThunks";
import {
  fetchSiteThunk,
  fetchSiteSettingsThunk,
} from "./thunkActionsCreator/siteThunk";
import { setSiteSettings } from "./slices/siteSlice";
import { saveSiteHints } from "./utils/siteHints";
import {
  applySiteTexts,
  readCachedSiteTexts,
  updateSiteTexts,
} from "./i18n/siteTexts";

import Home from "./pages/Home";
import Store from "./pages/Store";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Success from "./pages/Success";
import NewPassword from "./pages/NewPassword";
import Profile from "./pages/Profile";
import Payment from "./pages/Payment";
import Wishlist from "./pages/Wishlist"; // TEMP: wishlist testing, remove before commit
import BlogPage from "./pages/Blog";
import SinglePost from "./pages/SinglePost";
import Contact from "./pages/Contact";
import LegalMentions from "./pages/LegalMentions";
import CGU from "./pages/CGU";
import CGV from "./pages/CGV";
import FAQ from "./pages/FAQ";
import PolitiqueCookies from "./pages/PolitiqueCookies";
import Confidentialite from "./pages/Confidentialite";
import About from "./pages/About";
import Error404 from "./pages/Error404";

import MainLayout from "./layouts/MainLayout/MainLayout";
import Seo from "./components/Seo";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import SkipLink from "./components/SkipLink";
// import AuthModal from "./components/AuthModal";

import "./index.css";
import "./styles/page-transition.css";
import "./styles/a11y.css";
import AuthDrawer from "./components/AuthDrawer";
import Checkout from "./pages/Checkout";

// Styles des blocs WordPress, pour les pages de contenu (mentions légales,
// FAQ...). Ajoutés par script plutôt que par une balise <link> dans
// index.html : unpkg.com est un service externe, sa lenteur ne doit pas
// retarder l'affichage de toute la page.
const blockLibraryStyles = document.createElement("link");
blockLibraryStyles.rel = "stylesheet";
blockLibraryStyles.href =
  "https://unpkg.com/@wordpress/block-library@8/build-style/style.css";
document.head.appendChild(blockLibraryStyles);

function initializeApp() {
  // Ancien emplacement du JWT, avant son passage en cookie HttpOnly : on ne
  // le laisse pas traîner jusqu'à son expiration.
  localStorage.removeItem("wc_user_token");

  // L'interface (fond, header) se monte tout de suite : elle n'attendait
  // jusqu'ici que la réponse de WordPress à deux requêtes (réglages du site et
  // session) pour afficher quoi que ce soit, soit une page vide pendant tout ce
  // temps. Les requêtes partent maintenant en parallèle de l'affichage.
  //
  // Ce qui dépend de leur réponse l'attend sans bouger : l'icône de compte et
  // la route /profile attendent user.sessionChecked, le logo et le contenu de
  // l'accueil attendent site.siteSettings (voir Header, CatalogSection,
  // ProtectedRoute). Sans cette précaution, l'interface s'afficherait un
  // instant comme pour un invité, ce que l'ancien ordre évitait.
  // Textes modifiés dans l'admin lors de la visite précédente : appliqués avant
  // le premier rendu, pour ne pas voir l'ancien texte se faire remplacer.
  applySiteTexts(readCachedSiteTexts(), { rerender: false });

  mountApp();

  store.dispatch(initializeCartThunk());
  store.dispatch(fetchSiteThunk());

  store
    .dispatch(fetchSiteSettingsThunk())
    .unwrap()
    .then((acfSettings) => {
      // Retenu pour la prochaine visite : voir utils/siteHints.js
      saveSiteHints({
        hasHero: Boolean(acfSettings.hero_video),
        hasLogo: Boolean(acfSettings.site_logo_custom),
      });

      // Textes du site (champs ACF « Textes — … ») : voir i18n/siteTexts.js
      updateSiteTexts(acfSettings.texts);
    })
    .catch(() => {
      store.dispatch(setSiteSettings({}));
    });

  store.dispatch(restoreSessionThunk()).then(() => {
    if (store.getState().user.isAuthenticated) {
      store.dispatch(fetchCurrentUserThunk());
      store.dispatch(fetchCurrentCustomerThunk());
      store.dispatch(fetchCurrentUserOrdersThunk());
    }
  });
}

function mountApp() {
  // ReactDOM.createRoot(document.getElementById("root")).render(
  //   // <React.StrictMode>
  //   <HelmetProvider>
  //     <Provider store={store}>
  //       <Router
  //         future={{
  //           v7_startTransition: true,
  //           v7_relativeSplatPath: true,
  //         }}
  //         // basename="/ecom"
  //       >
  //         <Header />
  //         <Seo />
  //         <Routes>
  //           {<Route path="/" element={<Home />} />}
  //           <Route path="/new-password" element={<NewPassword />} />
  //           <Route path="/catalogue" element={<Store />} />
  //           <Route path="/mentions-legales" element={<LegalMentions />} />
  //           <Route path="/cgu" element={<CGU />} />
  //           <Route path="/cgv" element={<CGV />} />
  //           <Route path="/panier" element={<Cart />} />
  //           <Route path="*" element={<Error404 />} />
  //           <Route path="/contact" element={<Contact />} />
  //           <Route path="/product/:id" element={<ProductDetails />} />
  //           <Route path="/blog" element={<BlogPage />} />
  //           <Route path="/blog/:slug" element={<SinglePost />} />
  //           <Route path="/success/:orderId" element={<Success />} />
  //           <Route path="/profile" element={<Profile />} />
  //           {/* TEMP: wishlist testing, remove before commit */}
  //           <Route path="/wishlist" element={<Wishlist />} />
  //         </Routes>
  //         <Footer />
  //         <Toast />
  //         <AuthModal />
  //       </Router>
  //     </Provider>
  //   </HelmetProvider>,
  //   /* </React.StrictMode>, */
  // );

  ReactDOM.createRoot(document.getElementById("root")).render(
    <HelmetProvider>
      <Provider store={store}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <SkipLink />
          <ScrollToTop />
          <Seo />
          <Routes>
            <Route path="/" element={<Home />} />

            <Route element={<MainLayout />}>
              <Route path="/catalogue" element={<Store />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/panier" element={<Cart />} />
              <Route path="/commande" element={<Payment />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<SinglePost />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/success/:orderId" element={<Success />} />
              <Route path="/new-password" element={<NewPassword />} />
              <Route path="/mentions-legales" element={<LegalMentions />} />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/cgv" element={<CGV />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/cookies" element={<PolitiqueCookies />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="/a-propos" element={<About />} />
              <Route path="*" element={<Error404 />} />
              <Route path="/checkout" element={<Checkout />} />
            </Route>
          </Routes>
          <Toast />
          {/* <AuthModal /> */}
          <AuthDrawer />
        </Router>
      </Provider>
    </HelmetProvider>,
  );
}

initializeApp();
