/**
 * Varol Nakliyat - Form Handler (Web3Forms → info@varolnakliyat.com)
 * WhatsApp: form doldurulduktan sonra "WhatsApp'tan Gönder" ile wa.me açılır
 */
(function () {
  "use strict";

  const SERVICE_LABELS = {
    "evden-eve": "Evden Eve Nakliyat",
    "sehirler-arasi": "Şehirler Arası Nakliyat",
    ofis: "Ofis Taşıma",
    asansorlu: "Asansörlü Nakliyat",
    parca: "Parça Eşya Taşıma",
    depolama: "Depolama Hizmeti",
    kurumsal: "Kurumsal Taşımacılık",
  };

  const SUBJECT_LABELS = {
    genel: "Genel Bilgi",
    teklif: "Fiyat Teklifi",
    sikayet: "Şikayet / Öneri",
    diger: "Diğer",
  };

  function getFormConfig() {
    return window.VAROL_FORM || {};
  }

  function getAccessKey(form) {
    const configKey = getFormConfig().accessKey || "";
    const hidden = form.querySelector('input[name="access_key"]');
    if (hidden && configKey) hidden.value = configKey;
    if (hidden?.value) return hidden.value;
    return configKey;
  }

  function getFormData(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    data.submittedAt = new Date().toISOString();
    return data;
  }

  function buildQuoteMessage(data) {
    const lines = [
      "Yeni teklif talebi - varolnakliyat.com",
      "",
      `Ad Soyad: ${data.name || "-"}`,
      `Telefon: ${data.phone || "-"}`,
      `E-posta: ${data.email || "-"}`,
      `Hizmet: ${SERVICE_LABELS[data.service] || data.service || "-"}`,
      `Çıkış: ${data.from || "-"}`,
      `Varış: ${data.to || "-"}`,
      `Taşınma Tarihi: ${data.date || "-"}`,
      `Oda Sayısı: ${data.rooms || "-"}`,
      `Ek Notlar: ${data.notes || "-"}`,
      "",
      `Gönderim: ${data.submittedAt || new Date().toISOString()}`,
    ];
    return lines.join("\n");
  }

  function buildContactMessage(data) {
    const lines = [
      "Yeni iletişim mesajı - varolnakliyat.com",
      "",
      `Ad Soyad: ${data.name || "-"}`,
      `Telefon: ${data.phone || "-"}`,
      `E-posta: ${data.email || "-"}`,
      `Konu: ${SUBJECT_LABELS[data.subject] || data.subject || "-"}`,
      "",
      data.message || "-",
      "",
      `Gönderim: ${data.submittedAt || new Date().toISOString()}`,
    ];
    return lines.join("\n");
  }

  function buildQuoteWhatsAppMessage(data) {
    const lines = [
      "Merhaba, varolnakliyat.com üzerinden teklif talep ediyorum.",
      "",
      `Ad Soyad: ${data.name || "-"}`,
      `Telefon: ${data.phone || "-"}`,
      `Hizmet: ${SERVICE_LABELS[data.service] || data.service || "-"}`,
      `Çıkış: ${data.from || "-"}`,
      `Varış: ${data.to || "-"}`,
      `Taşınma Tarihi: ${data.date || "-"}`,
      `Oda Sayısı: ${data.rooms || "-"}`,
    ];

    if (data.notes?.trim()) {
      lines.push(`Ek Notlar: ${data.notes.trim()}`);
    }

    return lines.join("\n");
  }

  function buildContactWhatsAppMessage(data) {
    const lines = [
      "Merhaba, varolnakliyat.com iletişim formundan yazıyorum.",
      "",
      `Ad Soyad: ${data.name || "-"}`,
      `Telefon: ${data.phone || "-"}`,
      `Konu: ${SUBJECT_LABELS[data.subject] || data.subject || "-"}`,
      "",
      data.message || "-",
    ];
    return lines.join("\n");
  }

  function showError(form, message) {
    let errorEl = form.parentElement.querySelector(".form-error");
    if (!errorEl) {
      errorEl = document.createElement("div");
      errorEl.className = "form-error";
      form.parentElement.insertBefore(errorEl, form.nextSibling);
    }
    errorEl.textContent = message;
    errorEl.classList.add("show");
  }

  function clearError(form) {
    const errorEl = form.parentElement.querySelector(".form-error");
    if (errorEl) {
      errorEl.classList.remove("show");
      errorEl.textContent = "";
    }
  }

  function showSuccess(form) {
    form.style.display = "none";
    const errorEl = form.parentElement.querySelector(".form-error");
    if (errorEl) errorEl.classList.remove("show");
    const success = form.parentElement.querySelector(".form-success");
    if (success) success.classList.add("show");
  }

  async function sendFormEmail(form, data) {
    const isQuote = form.classList.contains("quote-form");
    const message = isQuote ? buildQuoteMessage(data) : buildContactMessage(data);
    const subject = isQuote
      ? `Teklif Talebi: ${data.name || "Varol Nakliyat"}`
      : `İletişim: ${data.name || "Varol Nakliyat"}`;

    const accessKey = getAccessKey(form);

    if (!accessKey) {
      throw new Error("Form e-posta ayarı eksik. Access key tanımlı değil.");
    }

    const payload = {
      access_key: accessKey,
      subject,
      from_name: data.name || "Varol Nakliyat Ziyaretçi",
      name: data.name || "",
      phone: data.phone || "",
      message,
      botcheck: data.botcheck || "",
    };

    if (data.email) payload.email = data.email;
    if (data.service) payload.service = SERVICE_LABELS[data.service] || data.service;
    if (data.from) payload.from_address = data.from;
    if (data.to) payload.to_address = data.to;
    if (data.date) payload.move_date = data.date;
    if (data.rooms) payload.rooms = data.rooms;
    if (data.notes) payload.notes = data.notes;
    if (data.subject) payload.topic = SUBJECT_LABELS[data.subject] || data.subject;

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Form gönderilemedi. Lütfen tekrar deneyin.");
    }

    return result;
  }

  function openWhatsApp(form, data) {
    const wa = window.VAROL_SITE?.whatsapp;
    const phone = window.VAROL_SITE?.phone || "0552 200 20 18";
    if (!wa) {
      showError(form, `WhatsApp numarası tanımlı değil. Lütfen ${phone} numarasından bizi arayın.`);
      return;
    }

    const isQuote = form.classList.contains("quote-form");
    const message = isQuote
      ? buildQuoteWhatsAppMessage(data)
      : buildContactWhatsAppMessage(data);

    const url = `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function validateForm(form) {
    if (form.checkValidity()) return true;
    form.reportValidity();
    return false;
  }

  document.querySelectorAll(".quote-form, .contact-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError(form);

      if (!validateForm(form)) return;

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Gönderiliyor...";

      const data = getFormData(form);

      try {
        await sendFormEmail(form, data);
        showSuccess(form);
      } catch (error) {
        showError(
          form,
          error.message ||
            `Gönderim başarısız. Lütfen ${window.VAROL_SITE?.phone || "0552 200 20 18"} numarasından bizi arayın veya info@varolnakliyat.com adresine yazın.`
        );
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });

    const whatsappBtn = form.querySelector('[data-action="whatsapp-send"]');
    if (whatsappBtn) {
      whatsappBtn.addEventListener("click", () => {
        clearError(form);
        if (!validateForm(form)) return;
        openWhatsApp(form, getFormData(form));
      });
    }
  });
})();
