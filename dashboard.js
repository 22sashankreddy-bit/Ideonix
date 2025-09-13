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
  // Ideas Shared: 1 to 1000 then "1000+"
  animateCounter("ideasCounter", 1, 1000, 3000);
  setTimeout(() => {
    document.getElementById("ideasCounter").innerText = "1000+";
    setTimeout(() => {
      document.getElementById("ideasCounter").innerText = "1000+";
    }, 500);
  }, 3000);

  animateCounter("membersCounter", 1, 5000, 3000);
  setTimeout(() => {
    document.getElementById("membersCounter").innerText = "5000+";
    setTimeout(() => {
      document.getElementById("membersCounter").innerText = "5000+";
    }, 500);
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
    setTimeout(() => {
      document.getElementById("yearCounter").innerText = "20 Yrs";
    }, 500);
  }, 3000);
});

function handleLogout() {
  const confirmLogout = confirm("Are you sure you want to logout?");
  if (confirmLogout) localStorage.clear();
  sessionStorage.clear();
  // Redirect to login page
  window.location.href = "login.html";
}

// Hamburger menu functionality (if not already in dashboard.js)
document.getElementById("hamburger").addEventListener("click", function () {
  document.getElementById("nav-links").classList.toggle("active");
});
