import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import styles from "./HeroVideo.module.scss";

// Le fondu est calé sur la course du catalogue, seul maître de ce qui reste
// visible : son bord haut entre par le bas de l'écran après 30 vh de
// défilement (hauteur de .heroSpacer) et achève de recouvrir la vidéo à
// 130 vh (+ 100 vh de margin-top dans CatalogSection.module.scss).
//
// La vidéo s'efface donc exactement au rythme où le catalogue la recouvre :
// elle n'atteint zéro qu'à l'instant où elle cesse d'être visible. Terminer
// plus tôt ferait traverser une zone de bleu vide — la vidéo aurait disparu
// alors que le catalogue n'est pas encore arrivé.
//
// Ces deux nombres reprennent les deux règles SCSS citées : changer l'une
// sans l'autre décale le fondu.
const FADE_START_RATIO = 0.3;
const FADE_DURATION_RATIO = 1;

export default function HeroVideo() {
  const heroRef = useRef(null);
  const siteSettings = useSelector((state) => state.site.siteSettings);
  const heroVideo = siteSettings?.heroVideo;
  const heroTitle = siteSettings?.heroTitle;

  useEffect(() => {
    let frame = null;

    const applyFade = () => {
      frame = null;
      if (!heroRef.current) return;

      const vh = window.innerHeight;
      const fadeStart = vh * FADE_START_RATIO;
      const fadeDistance = vh * FADE_DURATION_RATIO;

      const rawProgress = (window.scrollY - fadeStart) / fadeDistance;
      const progress = Math.min(1, Math.max(0, rawProgress));

      const eased = progress * progress;
      const newOpacity = 1 - eased;

      heroRef.current.style.opacity = newOpacity;
      heroRef.current.style.pointerEvents = newOpacity === 0 ? "none" : "auto";
    };

    // Le navigateur émet bien plus d'événements de défilement qu'il n'affiche
    // d'images : on ne repeint qu'une fois par trame.
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(applyFade);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    // La hauteur de fenêtre entre dans le calcul : une rotation d'écran doit
    // le refaire, sans quoi l'opacité reste figée jusqu'au prochain scroll.
    window.addEventListener("resize", schedule);
    applyFade();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.heroSpacer}>
      <div ref={heroRef} className={styles.hero}>
        <video
          className={styles.video}
          autoPlay
          playsInline
          loop
          muted
          src={heroVideo}
        />
        <h1 className={styles.title}>{heroTitle}</h1>
      </div>
    </div>
  );
}
