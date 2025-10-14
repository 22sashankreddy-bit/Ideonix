document.addEventListener("DOMContentLoaded", function () {
  const counters = document.querySelectorAll(".stat-item h3");
  const speed = 200;

  counters.forEach((counter) => {
    const animate = () => {
      const value = +counter.getAttribute("data-target");
      const data = +counter.innerText;
      const time = value / speed;

      if (data < value) {
        counter.innerText = Math.ceil(data + time);
        setTimeout(animate, 1);
      } else {
        counter.innerText = value;
      }
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(entry.target);
        }
      });
    });

    observer.observe(counter);
  });
});
