import { gsap } from "gsap";

function byId(id) {
	return document.getElementById(id);
}

function prefersReducedMotion() {
	return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
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
