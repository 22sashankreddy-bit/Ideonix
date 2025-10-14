function animateCounter(id, start, end, duration, suffix = "") {
  let current = start;
  const range = end - start;
  const increment = range / (duration / 10);
  const counterElement = document.getElementById(id);

  const interval = setInterval(() => {
    current += increment;
    if (current >= end) {
      clearInterval(interval);
      counterElement.innerText = end.toLocaleString() + suffix;
    } else {
      counterElement.innerText = Math.floor(current).toLocaleString() + suffix;
    }
  }, 10);
}

document.addEventListener("DOMContentLoaded", () => {
  animateCounter("ideasCounter", 1, 1000, 3000);
  setTimeout(() => {
    document.getElementById("ideasCounter").innerText = "1000+";
  }, 3000);

  animateCounter("membersCounter", 1, 5000, 3000);
  setTimeout(() => {
    document.getElementById("membersCounter").innerText = "5000+";
  }, 3000);

  animateCounter("possibilitiesCounter", 1, 100000, 3000, "+");
  setTimeout(() => {
    document.getElementById("possibilitiesCounter").innerText = "1Lakh+";
    setTimeout(() => {
      document.getElementById("possibilitiesCounter").innerText = "∞";
    }, 500);
  }, 3000);

  animateCounter("yearCounter", 1, 20, 2000);
  setTimeout(() => {
    document.getElementById("yearCounter").innerText = "20 Yrs";
  }, 3000);
});

document.getElementById("hamburger").addEventListener("click", function () {
  document.getElementById("nav-links").classList.toggle("active");
});

if (window.innerWidth <= 768) {
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      this.parentElement.classList.toggle("active");
    });
  });
}

function handleLogout() {
  const confirmLogout = confirm("Are you sure you want to logout?");
  if (confirmLogout) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  }
}
