export const translateAttributeName = (name, t) => {
  if (!name) return "";
  const lowerName = name.trim().toLowerCase();

  switch (lowerName) {
    case "taille":
    case "size":
      return t("product.attributes.size");
    case "couleur":
    case "color":
      return t("product.attributes.color");
    case "coupe":
    case "fit":
      return t("product.attributes.fit");
    case "matière":
    case "matiere":
    case "matières":
    case "material":
    case "composition":
      return t("product.attributes.material");
    case "grammage":
    case "weight":
      return t("product.attributes.weight");
    case "fabrication":
    case "made in":
      return t("product.attributes.madeIn");
    default:
      // Si c'est un attribut personnalisé non répertorié, on l'affiche tel quel
      return name;
  }
};
