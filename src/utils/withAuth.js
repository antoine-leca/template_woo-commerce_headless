// Le JWT voyage dans un cookie HttpOnly posé par WordPress (mu-plugin
// auth-cookie.php) : le front ne le voit jamais. Il faut seulement que le
// navigateur joigne ce cookie à la requête (credentials) et y ajouter le jeton
// anti-CSRF, exigé par le serveur sur toute écriture.
export const withAuth = (csrfToken, init = {}) => ({
  ...init,
  credentials: "include",
  headers: {
    ...init.headers,
    ...(csrfToken && { "X-CSRF-Token": csrfToken }),
  },
});
