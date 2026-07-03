/**
 * Varol Nakliyat - Form Handler
 */
(function () {
  "use strict";

  const forms = document.querySelectorAll(".quote-form, .contact-form");

  forms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Gönderiliyor...";

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data.submittedAt = new Date().toISOString();

      // Store locally (production: replace with Formspree, Netlify Forms, or backend API)
      const requests = JSON.parse(localStorage.getItem("varol_requests") || "[]");
      requests.push(data);
      localStorage.setItem("varol_requests", JSON.stringify(requests));

      setTimeout(() => {
        form.style.display = "none";
        const success = form.parentElement.querySelector(".form-success");
        if (success) success.classList.add("show");

        btn.disabled = false;
        btn.textContent = originalText;

        // Optional: open WhatsApp with pre-filled message
        const wa = window.VAROL_SITE?.whatsapp;
        if (wa && form.classList.contains("quote-form")) {
          const msg = encodeURIComponent(
            `Merhaba, teklif talebim:\nAd: ${data.name}\nTel: ${data.phone}\nÇıkış: ${data.from || "-"}\nVarış: ${data.to || "-"}\nTarih: ${data.date || "-"}`
          );
          const waLink = document.createElement("a");
          waLink.href = `https://wa.me/${wa}?text=${msg}`;
          waLink.className = "btn btn-primary";
          waLink.style.marginTop = "1rem";
          waLink.textContent = "WhatsApp ile Devam Et";
          waLink.target = "_blank";
          success?.appendChild(waLink);
        }
      }, 800);
    });
  });
})();
