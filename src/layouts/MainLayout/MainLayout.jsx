// import Footer from "../../components/Home/Footer/Footer";

// export default function MainLayout({ children, hideFooter = false }) {
//   return (
//     <>
//       {children}
//       {!hideFooter && <Footer />}
//     </>
//   );
// }

import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import "./MainLayout.css";

export default function MainLayout() {
  const { pathname } = useLocation();

  return (
    <>
      <Header />
      {/* La clé ne retient que le chemin : elle change d'une page à l'autre —
          l'élément est donc recréé et le fondu rejoué — mais pas quand on
          filtre le catalogue (qui n'écrit que dans la query) ni quand on saute
          à une ancre de la même page.

          La classe est posée sur ce <main> plutôt que sur une enveloppe :
          `.cart-state` reprend sa hauteur avec `min-height: inherit`, et un
          élément intercalé la ramènerait à zéro. */}
      <main
        key={pathname}
        id="main-content"
        tabIndex={-1}
        className="main-layout__content page-transition"
      >
        <Outlet />
      </main>
      <Footer />
    </>
  );
}