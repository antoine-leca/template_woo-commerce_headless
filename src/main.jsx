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
import AppLoader from "./components/AppLoader/AppLoader";
// import AuthModal from "./components/AuthModal";

import "./index.css";
import "./styles/page-transition.css";
import AuthDrawer from "./components/AuthDrawer";
import Checkout from "./pages/Checkout";

async function initializeApp() {
  // Ancien emplacement du JWT, avant son passage en cookie HttpOnly : on ne
  // le laisse pas traîner jusqu'à son expiration.
  localStorage.removeItem("wc_user_token");

  store.dispatch(initializeCartThunk());
  store.dispatch(fetchSiteThunk());

  // Session restaurée avant le premier rendu : sans cela l'interface
  // s'afficherait un instant comme pour un invité.
  await Promise.all([
    store.dispatch(fetchSiteSettingsThunk()).unwrap().catch(() => {
      store.dispatch(setSiteSettings({}));
    }),
    store.dispatch(restoreSessionThunk()),
  ]);

  if (store.getState().user.isAuthenticated) {
    store.dispatch(fetchCurrentUserThunk());
    store.dispatch(fetchCurrentCustomerThunk());
    store.dispatch(fetchCurrentUserOrdersThunk());
  }

  mountApp();
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
        <AppLoader />
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ScrollToTop />
          <Seo />
          <Routes>
            <Route path="/" element={<Home />} />

            <Route element={<MainLayout />}>
              <Route path="/catalogue" element={<Store />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/panier" element={<Cart />} />
              <Route path="/commande" element={<Payment />} />
              <Route path="/profile" element={<Profile />} />
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
