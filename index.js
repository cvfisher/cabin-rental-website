const get = (element) => document.getElementById(element);

let open = get("menu-btn");
let nav = get("nav");
let exit = get("exit-btn");

open.addEventListener("click", () => {
	nav.classList.add("open-nav");
});

exit.addEventListener("click", () => {
	nav.classList.remove("open-nav");
});

const header = document.querySelector(".site-header");
let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
	const currentScrollY = window.scrollY;

	// If scrolling DOWN and past a bit of content → hide
	if (currentScrollY > lastScrollY && currentScrollY > 100) {
		header.classList.add("site-header--hidden");
	} else {
		// Scrolling UP → show
		header.classList.remove("site-header--hidden");
	}

	lastScrollY = currentScrollY;
});

var tl = gsap.timeline({ defaults: { duration: 1 } });
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
