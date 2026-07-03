/**
 * Varol Nakliyat - Main JavaScript
 */
(function () {
  "use strict";

  const SITE = {
    phone: "0551 709 88 75",
    phoneRaw: "+905517098875",
    whatsapp: "905517098875",
    email: "info@varolnakliyat.com",
    address: "Fenerbahçe Mah. İğrip Sok. No:13/1 Kadıköy, İstanbul",
    domain: "https://varolnakliyat.com"
  };

  window.VAROL_SITE = SITE;

  const header = document.querySelector(".site-header");
  const heroBrand = document.querySelector(".hero-brand");

  if (header) {
    if (heroBrand) {
      const syncHomeHeader = ([entry]) => {
        const pastHero = !entry.isIntersecting;
        header.classList.toggle("scrolled", pastHero);
        header.classList.toggle("logo-visible", pastHero);
      };

      new IntersectionObserver(syncHomeHeader, {
        threshold: 0,
        rootMargin: "-1px 0px 0px 0px",
      }).observe(heroBrand);
    } else {
      header.classList.add("scrolled", "header-dark");
      const onScroll = () => {
        header.classList.toggle("scrolled", window.scrollY > 50 || !heroBrand);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".mobile-nav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      mobileNav.classList.toggle("open");
      document.body.style.overflow = mobileNav.classList.contains("open") ? "hidden" : "";
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((el) => el.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));

  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".nav-desktop a, .mobile-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("tel:") || href.startsWith("mailto:")) return;
    const linkPath = new URL(href, window.location.origin).pathname.replace(/\/$/, "") || "/";
    if (linkPath === currentPath || (currentPath.includes(linkPath) && linkPath !== "/")) {
      link.classList.add("active");
    }
  });

  const waFloat = document.querySelector(".whatsapp-float");
  if (waFloat) {
    const msg = encodeURIComponent("Merhaba, Varol Nakliyat hizmetleri hakkında bilgi almak istiyorum.");
    waFloat.querySelector(".whatsapp-btn")?.setAttribute(
      "href",
      `https://wa.me/${SITE.whatsapp}?text=${msg}`
    );
    waFloat.querySelector(".phone-float")?.setAttribute("href", `tel:${SITE.phoneRaw}`);
  }

  document.querySelectorAll("[data-phone]").forEach((el) => {
    const suffix = el.dataset.phoneSuffix || "";
    if (el.tagName === "A" && el.querySelector("[data-phone]")) {
      el.href = `tel:${SITE.phoneRaw}`;
      return;
    }
    el.textContent = SITE.phone + suffix;
    if (el.tagName === "A") el.href = `tel:${SITE.phoneRaw}`;
  });

  document.querySelectorAll("[data-email]").forEach((el) => {
    el.textContent = SITE.email;
    if (el.tagName === "A") el.href = `mailto:${SITE.email}`;
  });

  document.querySelectorAll("[data-address]").forEach((el) => {
    el.textContent = SITE.address;
  });
})();
