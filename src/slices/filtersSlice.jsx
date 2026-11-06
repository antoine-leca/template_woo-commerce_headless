import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  search: "",
  // Identifiants de produits à afficher, séparés par des virgules : posé par la
  // recherche tolérante de la barre (le texte tapé n'est pas envoyé tel quel).
  include: "",
  category: "",
  min_price: "",
  max_price: "",
  orderby: "date",
  order: "desc",
};

export const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    // Permet de mettre à jour un ou plusieurs filtres d'un coup
    setFilters: (state, action) => {
      // Rien ne change : on garde le même objet. Les pages qui rechargent le
      // catalogue à chaque changement de `filters` ne relancent alors pas
      // d'appel inutile — et leurs réponses ne se doublent pas (une réponse
      // non filtrée, arrivée en retard, écraserait le résultat filtré).
      const unchanged = Object.entries(action.payload).every(
        ([key, value]) => state[key] === value,
      );
      if (unchanged) return state;
      return { ...state, ...action.payload };
    },
    // Pour tout réinitialiser (pratique si tu as un bouton "Reset")
    //resetFilters: () => initialState,
  },
});

export const { setFilters /*, resetFilters*/ } = filtersSlice.actions;
