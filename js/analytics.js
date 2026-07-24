/**
 * Varol Nakliyat - GA4 olay izleme
 * gtag.js HTML <head> içinde yüklenir.
 */
(function () {
  "use strict";

  const GA4_ID = "G-7V2T1D94NN";

  window.VAROL_ANALYTICS = { GA4_ID };

  function trackEvent(name, params) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, params || {});
  }

  window.varolTrackEvent = trackEvent;

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest('a[href^="tel:"]');
      if (link) {
        trackEvent("phone_call_click", {
          event_category: "engagement",
          event_label: link.getAttribute("href") || "",
        });
        return;
      }

      const waLink = event.target.closest('a[href*="wa.me"]');
      if (waLink) {
        trackEvent("whatsapp_click", { event_category: "engagement" });
      }
    },
    true
  );
})();
