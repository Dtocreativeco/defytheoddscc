/* Defy The Odds Creative Co. site script
   1. Mobile nav toggle
   2. Lead forms (popup + checkup page) sent to HubSpot
   3. Free Marketing Checkup popup after 30 seconds
*/

/* ===== HubSpot settings ===== */
var HUBSPOT = {
  portalId: "246286021",
  // Paste the Form ID (GUID) of your "Free Marketing Checkup" form from HubSpot:
  // Marketing > Forms > open the form > Share > Embed code, copy the formId value.
  // Leave blank to rely on HubSpot's "Collect data from website forms" (non HubSpot forms) feature instead.
  formGuid: "fd985afa-9a4e-4cf3-85eb-8dac3e8f4a7d" // "Website Lead Form" in HubSpot
};
var POPUP_DELAY_MS = 1000;        // computers: opens 1 second after the page loads
var POPUP_DELAY_MOBILE_MS = 8000; // phones: waits 8 seconds so Google does not treat it as an intrusive popup

(function () {
  "use strict";

  /* ---------- storage helpers (never let storage break the page) ---------- */
  function get(store, key) { try { return window[store].getItem(key); } catch (e) { return null; } }
  function set(store, key, val) { try { window[store].setItem(key, val); } catch (e) {} }

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---------- HubSpot submission ---------- */
  function cookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : undefined;
  }

  function collect(form) {
    var fd = new FormData(form);
    var fields = [];
    var services = fd.getAll("services_interested_in");
    fd.forEach(function (value, name) {
      if (name === "services_interested_in" || name === "company_url_hp") return;
      if (String(value).trim() === "") return;
      fields.push({ objectTypeId: "0-1", name: name, value: String(value).trim() });
    });
    if (services.length) fields.push({ objectTypeId: "0-1", name: "services_interested_in", value: services.join(";") });
    return fields;
  }

  function sendToHubSpot(form) {
    if (!HUBSPOT.formGuid) {
      // No form GUID yet: HubSpot's tracking code captures this submit event on its own
      // when "Collect data from website forms" is turned on in HubSpot settings.
      return Promise.resolve();
    }
    var ctx = { pageUri: location.href, pageName: document.title };
    var hutk = cookie("hubspotutk");
    if (hutk) ctx.hutk = hutk;
    return fetch("https://api.hsforms.com/submissions/v3/integration/submit/" + HUBSPOT.portalId + "/" + HUBSPOT.formGuid, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: collect(form), context: ctx })
    }).then(function (res) {
      if (!res.ok) throw new Error("HubSpot returned " + res.status);
    });
  }

  function wireForm(form) {
    var status = form.querySelector(".form-status");
    var btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector("[name=company_url_hp]") && form.querySelector("[name=company_url_hp]").value) return; // spam trap
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (status) { status.textContent = ""; status.classList.remove("error"); }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "Sending..."; }
      sendToHubSpot(form).then(function () {
        set("localStorage", "dto_checkup_submitted", "1");
        var success = form.parentNode.querySelector(".form-success");
        form.hidden = true;
        if (success) success.hidden = false;
      }).catch(function () {
        if (status) {
          status.textContent = "That didn't go through. Check your connection and try again, or email jesse@defytheoddscc.com.";
          status.classList.add("error");
        }
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || "Send"; }
      });
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("form.lead-form"), wireForm);

  /* ---------- 30 second popup ---------- */
  var modal = document.getElementById("lead-modal");
  if (!modal) return;
  var lastFocus = null;

  function openModal() {
    if (get("localStorage", "dto_checkup_submitted") || get("sessionStorage", "dto_popup_seen")) return;
    set("sessionStorage", "dto_popup_seen", "1");
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var first = modal.querySelector("input[name=firstname]");
    if (first) setTimeout(function () { first.focus(); }, 50);
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  modal.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  // Skip the popup on the checkup page itself, since the form is already there.
  if (!document.body.hasAttribute("data-no-popup")) setTimeout(openModal, window.matchMedia("(max-width: 768px)").matches ? POPUP_DELAY_MOBILE_MS : POPUP_DELAY_MS);

  // Any link marked data-open-checkup opens the popup right away.
  document.querySelectorAll("[data-open-checkup]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      if (get("localStorage", "dto_checkup_submitted")) return;
      e.preventDefault(); lastFocus = el; modal.hidden = false; document.body.style.overflow = "hidden";
    });
  });
})();
