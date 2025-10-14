import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.42.5/+esm";

const supabase = createClient(
  "https://xarlawzvqwupgxlwadsj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU"
);

let allIdeas = [];

async function loadIdeas() {
  const { data, error } = await supabase
    .from("public_ideas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading ideas:", error.message);
    return;
  }

  allIdeas = data;
  renderIdeas(data);
}

function highlight(text, query) {
  if (!query) return text;
  return text.replace(new RegExp(`(${query})`, "gi"), "<mark>$1</mark>");
}

function getCategoryClass(category) {
  const colors = {
    electronics: "badge-electronics",
    ai: "badge-ai",
    health: "badge-health",
    education: "badge-education",
    finance: "badge-finance",
    other: "badge-other",
  };
  return colors[category?.toLowerCase()] || "badge-default";
}

function renderIdeas(ideas, query = "") {
  const container = document.getElementById("ideas-container");
  container.innerHTML = "";

  if (ideas.length === 0) {
    container.innerHTML =
      "<p style='text-align:center;'>No matching ideas found.</p>";
    return;
  }

  ideas.forEach((idea) => {
    const wrapper = document.createElement("div");
    wrapper.className = "idea-card-wrapper";

    const card = document.createElement("div");
    card.className = "idea-card";

    const categoryClass = getCategoryClass(idea.category);

    card.innerHTML = `
      <div class="category-badge ${categoryClass}">
        ${highlight(idea.category, query)}
      </div>
      <h3>${highlight(idea.title, query)}</h3>
      <p class="problem"><strong>Problem:</strong> ${highlight(
        idea.problem,
        query
      )}</p>
      <p class="audience"><strong>Audience:</strong> ${highlight(
        idea.target_audience,
        query
      )}</p>
      <p class="description"><strong>Description:</strong> ${highlight(
        idea.description,
        query
      )}</p>
      <p class="submitted-by"><em>By ${idea.name || "Anonymous"}</em></p>
      <p>${
        idea.file_url
          ? `<a href="${idea.file_url}" target="_blank" rel="noopener noreferrer">View File</a>`
          : "No file attached"
      }</p>
    `;

    card.addEventListener("click", () => showModal(idea));
    wrapper.appendChild(card);
    container.appendChild(wrapper);
  });
}

function showModal(idea) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  modalBody.innerHTML = `
    <h2>${idea.title}</h2>
    <p><strong>Category:</strong> ${idea.category}</p>
    <p><strong>Problem:</strong> ${idea.problem}</p>
    <p><strong>Target Audience:</strong> ${idea.target_audience}</p>
    <p><strong>Description:</strong> ${idea.description}</p>
    ${
      idea.file_url
        ? `<p><a href="${idea.file_url}" target="_blank">View File</a></p>`
        : ""
    }
    <p><em>By ${idea.name || "Anonymous"}</em></p>
  `;

  modal.style.display = "flex";
}


document.getElementById("modal-close").onclick = () => {
  document.getElementById("modal").style.display = "none";
};

window.onclick = (e) => {
  const modal = document.getElementById("modal");
  if (e.target === modal) modal.style.display = "none";
};

let debounceTimer;

document.getElementById("search-input").addEventListener("input", function () {
  clearTimeout(debounceTimer);
  const query = this.value.toLowerCase().trim();
  const criteria = document.getElementById("search-criteria").value;

  debounceTimer = setTimeout(() => {
    if (!query) {
      renderIdeas(allIdeas);
      return;
    }

    const filtered = allIdeas.filter((idea) => {
      if (criteria === "all") {
        return [
          idea.title,
          idea.problem,
          idea.description,
          idea.target_audience,
          idea.category,
        ].some((field) => field && field.toLowerCase().includes(query));
      } else {
        const field = idea[criteria];
        return field && field.toLowerCase().includes(query);
      }
    });

    renderIdeas(filtered, query);
  }, 250);
});

window.handleLogout = function () {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  }
};


loadIdeas();
