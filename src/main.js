import { gsap } from "gsap";
import "./styles/index.css";

function byId(id) {
	return document.getElementById(id);
}

function prefersReducedMotion() {
	return (
		window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
	);
}

function setupMobileMenu() {
	const openBtn = byId("menu-btn");
	const nav = byId("nav");
	const closeBtn = byId("exit-btn");

	if (!openBtn || !nav || !closeBtn) return;

	const openMenu = () => {
		nav.classList.add("open-nav");
		openBtn.setAttribute("aria-expanded", "true");
		nav.setAttribute("aria-hidden", "false");

		// Focus the first real nav link (skip the close button).
		const firstLink = nav.querySelector("li:not(.exit) a");
		firstLink?.focus?.();
	};

	const closeMenu = () => {
		nav.classList.remove("open-nav");
		openBtn.setAttribute("aria-expanded", "false");
		nav.setAttribute("aria-hidden", "true");
		openBtn.focus?.();
	};

	// Set initial a11y state.
	openBtn.setAttribute("aria-expanded", "false");
	nav.setAttribute("aria-hidden", "true");

	openBtn.addEventListener("click", openMenu);
	closeBtn.addEventListener("click", closeMenu);

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && nav.classList.contains("open-nav")) {
			closeMenu();
		}
	});
}

function setupHeaderAutoHide() {
	const header = document.querySelector(".site-header");
	if (!header) return;

	let lastScrollY = window.scrollY;

	window.addEventListener(
		"scroll",
		() => {
			const currentScrollY = window.scrollY;

			// If scrolling DOWN and past a bit of content → hide
			if (currentScrollY > lastScrollY && currentScrollY > 100) {
				header.classList.add("site-header--hidden");
			} else {
				// Scrolling UP → show
				header.classList.remove("site-header--hidden");
			}

			lastScrollY = currentScrollY;
		},
		{ passive: true }
	);
}

// Booking form dynamic totals
(function initBookingCalculator() {
	const form = document.getElementById("bookingForm");
	if (!form) return;

	const checkinEl = form.querySelector("#checkin");
	const checkoutEl = form.querySelector("#checkout");
	const adultsEl = form.querySelector("#adults");
	const childrenEl = form.querySelector("#children");
	const cabinEl = form.querySelector("#cabin");

	const nightsOut = document.getElementById("nights");
	const totalOut = document.getElementById("total");

	const guestsError = document.getElementById("guestsError");
	const submitBtn = form.querySelector('button[type="submit"]');

	const MAX_GUESTS = 6;

	const parseDate = (value) => {
		if (!value) return null;
		const [y, m, d] = value.split("-").map(Number);
		if (!y || !m || !d) return null;
		return new Date(Date.UTC(y, m - 1, d));
	};

	const clampInt = (val, min, max) => {
		const n = Number.parseInt(val, 10);
		if (Number.isNaN(n)) return min;
		return Math.min(max, Math.max(min, n));
	};

	const formatGBP = (amount) =>
		new Intl.NumberFormat("en-GB", {
			style: "currency",
			currency: "GBP",
			maximumFractionDigits: 0,
		}).format(amount);

	const getNightlyRate = () => {
		const opt = cabinEl?.selectedOptions?.[0];
		if (!opt) return 0;
		const nightly = Number(opt.dataset.nightly);
		return Number.isFinite(nightly) ? nightly : 0;
	};

	const setSubmitEnabled = (enabled) => {
		if (submitBtn) submitBtn.disabled = !enabled;
	};

	const showGuestsError = (msg) => {
		if (!guestsError) return;
		if (!msg) {
			guestsError.hidden = true;
			guestsError.textContent = "";
			guestsError.classList.remove("booking-form__error");
			return;
		}
		guestsError.hidden = false;
		guestsError.textContent = msg;
		guestsError.classList.add("booking-form__error");
	};

	// Optional UX improvement: never allow totals to exceed MAX_GUESTS by clamping
	// based on which field changed most recently.
	let lastChanged = null;
	adultsEl?.addEventListener("input", () => (lastChanged = "adults"));
	childrenEl?.addEventListener("input", () => (lastChanged = "children"));

	const enforceGuestLimit = () => {
		if (!adultsEl || !childrenEl) return { ok: true, totalGuests: 0 };

		const adults = clampInt(adultsEl.value, 1, 12);
		const children = clampInt(childrenEl.value, 0, 12);

		let totalGuests = adults + children;

		if (totalGuests <= MAX_GUESTS) {
			adultsEl.value = adults;
			childrenEl.value = children;
			showGuestsError("");
			return { ok: true, totalGuests };
		}

		// If over limit, clamp the last changed field to fit.
		// This prevents “8 guests” scenarios while keeping UX forgiving.
		const overflow = totalGuests - MAX_GUESTS;

		if (lastChanged === "children") {
			const newChildren = Math.max(0, children - overflow);
			childrenEl.value = newChildren;
			adultsEl.value = adults;
			totalGuests = adults + newChildren;
		} else {
			// default: clamp adults (but never below 1)
			const newAdults = Math.max(1, adults - overflow);
			adultsEl.value = newAdults;
			childrenEl.value = children;
			totalGuests = newAdults + children;
		}

		// If still over (edge case), hard-set children to fit.
		if (totalGuests > MAX_GUESTS) {
			const maxChildren = Math.max(0, MAX_GUESTS - Number(adultsEl.value));
			childrenEl.value = maxChildren;
			totalGuests = Number(adultsEl.value) + maxChildren;
		}

		showGuestsError(`*Maximum ${MAX_GUESTS} guests per cabin.`);
		return { ok: totalGuests <= MAX_GUESTS, totalGuests };
	};

	const update = () => {
		// Always enforce guest constraints first
		const guests = enforceGuestLimit();

		const checkin = parseDate(checkinEl?.value);
		const checkout = parseDate(checkoutEl?.value);
		const nightly = getNightlyRate();

		// defaults
		if (nightsOut) nightsOut.value = "0";
		if (totalOut) totalOut.value = formatGBP(0);

		// Basic validity
		if (!checkin || !checkout) {
			setSubmitEnabled(false);
			return;
		}

		const msPerDay = 24 * 60 * 60 * 1000;
		const nights = Math.round((checkout - checkin) / msPerDay);

		if (nights <= 0) {
			setSubmitEnabled(false);
			return;
		}

		if (!nightly) {
			if (nightsOut) nightsOut.value = String(nights);
			setSubmitEnabled(false);
			return;
		}

		if (!guests.ok) {
			if (nightsOut) nightsOut.value = String(nights);
			setSubmitEnabled(false);
			return;
		}

		// All good — compute
		if (nightsOut) nightsOut.value = String(nights);
		if (totalOut) totalOut.value = formatGBP(nights * nightly);

		setSubmitEnabled(true);
	};

	const syncMinCheckout = () => {
		if (!checkinEl || !checkoutEl) return;
		if (checkinEl.value) {
			checkoutEl.min = checkinEl.value;
			if (checkoutEl.value && checkoutEl.value <= checkinEl.value) {
				checkoutEl.value = "";
			}
		} else {
			checkoutEl.min = "";
		}
	};

	form.addEventListener("input", (e) => {
		if (e.target === checkinEl) syncMinCheckout();
		update();
	});

	form.addEventListener("change", (e) => {
		if (e.target === checkinEl) syncMinCheckout();
		update();
	});

	form.addEventListener("reset", () => {
		setTimeout(() => {
			showGuestsError("");
			if (nightsOut) nightsOut.value = "0";
			if (totalOut) totalOut.value = formatGBP(0);
			setSubmitEnabled(false);
			if (checkoutEl) checkoutEl.min = "";
		}, 0);
	});

	form.addEventListener("submit", (e) => {
		update();
		if (submitBtn?.disabled) e.preventDefault();
	});

	syncMinCheckout();
	update();
})();

function setupAnimations() {
	if (prefersReducedMotion()) return;
	if (!gsap?.timeline) return;

	const tl = gsap.timeline({ defaults: { duration: 1 } });

	tl.from(".main-copy > *", {
		y: 50,
		opacity: 0,
		stagger: 0.15,
		duration: 1,
		ease: "power3.out",
	})
		.to(
			".main-copy h1 span",
			{
				clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
				duration: 1.2,
				ease: "power2.out",
			},
			"-=0.7"
		)
		.from("ul.featured-cabins li", { y: 50, opacity: 0, stagger: 0.3 }, "-=.7");
}

document.addEventListener("DOMContentLoaded", () => {
	setupMobileMenu();
	setupHeaderAutoHide();
	setupAnimations();
});
