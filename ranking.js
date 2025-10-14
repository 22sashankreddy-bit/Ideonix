import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.42.5/+esm";

const supabase = createClient(
  "https://xarlawzvqwupgxlwadsj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU"
);

window.onload = function () {
  loadNames();
};

async function loadNames() {
  try {
    const { data, error } = await supabase.from("public_ideas").select("name");

    if (error) {
      console.error("Error fetching names:", error.message);
      displayError(error.message);
      return;
    }

    const nameCount = data.reduce((acc, user) => {
      acc[user.name] = (acc[user.name] || 0) + 1;
      return acc;
    }, {});

    const sortedNames = Object.entries(nameCount).sort((a, b) => {
      const freqDiff = b[1] - a[1];
      if (freqDiff !== 0) return freqDiff;
      return a[0].localeCompare(b[0]);
    });

    renderNames(sortedNames);
  } catch (err) {
    console.error("Unexpected error:", err);
    displayError("An unexpected error occurred while fetching data.");
  }
}

function renderNames(sortedNamesData) {
  const namesContainer = document.getElementById("names-container");
  namesContainer.innerHTML = "";

  if (sortedNamesData.length === 0) {
    namesContainer.innerHTML = "<p>No users found.</p>";
    return;
  }

  const headerRow = document.createElement("div");
  headerRow.className = "header-row";
  headerRow.innerHTML = `
        <div class="header-cell">Rank</div>
        <div class="header-cell">Name</div>
        <div class="header-cell">Ideas Submitted</div>
    `;
  namesContainer.appendChild(headerRow);

  sortedNamesData.forEach(([name, count], index) => {
    const userItem = document.createElement("div");
    userItem.className = "user-item";

    if (index === 0) {
      userItem.classList.add("top-ranked");
    } else if (index === 1) {
      userItem.classList.add("top-2");
    } else if (index === 2) {
      userItem.classList.add("top-3");
    } else if (index % 2 === 0) {
      userItem.classList.add("even-ranked");
    } else {
      userItem.classList.add("odd-ranked");
    }

    const rankBadge = document.createElement("div");
    rankBadge.className = "rank-badge";
    rankBadge.innerText = index + 1;

    userItem.innerHTML = `
            <div class="user-item-rank">${rankBadge.outerHTML}</div>
            <div class="user-item-name">${name}</div>
            <div class="user-item-ideas ${
              index === 0
                ? "top-1"
                : index === 1
                ? "top-2"
                : index === 2
                ? "top-3"
                : ""
            }">${count}</div>
        `;
    userItem.addEventListener("click", () => {
      loadUserIdeas(name);
    });

    namesContainer.appendChild(userItem);
  });
}

function displayError(message) {
  const namesContainer = document.getElementById("names-container");
  namesContainer.innerHTML = `<p class="error-message">Error: ${message}</p>`;
}
async function showUserIdeas(name) {
  const ideasSection = document.getElementById("ideasSection");
  const ideasHeading = document.getElementById("ideasHeading");
  const ideasGrid = document.getElementById("ideasGrid");

  ideasGrid.innerHTML = "";
  ideasHeading.textContent = `${name}'s Ideas`;

  const { data, error } = await supabase
    .from("public_ideas")
    .select("title, description, problem, file_url")
    .eq("name", name);

  if (error) {
    ideasGrid.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
    ideasSection.style.display = "block";
    return;
  }

  if (!data || data.length === 0) {
    ideasGrid.innerHTML = `<p>No ideas submitted.</p>`;
    ideasSection.style.display = "block";
    return;
  }

  data.forEach((idea) => {
    const card = document.createElement("div");
    card.className = "idea-card";
    card.innerHTML = `
        <h3>${idea.title}</h3>
        <p><strong>Description:</strong> ${idea.description}</p>
        <p><strong>Problem:</strong> ${idea.problem}</p>
        <p><strong>File:</strong> ${idea.file_url ? "Attached" : "No file"}</p>
      `;
    ideasGrid.appendChild(card);
  });

  ideasSection.style.display = "block";
}

async function loadUserIdeas(userName) {
  try {
    const { data, error } = await supabase
      .from("public_ideas")
      .select("title, description, problem, file_url")
      .eq("name", userName);

    if (error) throw error;

    renderUserIdeas(userName, data);
  } catch (err) {
    console.error("Error fetching user ideas:", err);
    renderUserIdeas(userName, []);
  }
}

function renderUserIdeas(userName, ideas) {
  const modal = document.getElementById("ideaModal");
  const closeBtn = modal.querySelector(".close");
  const modalUserName = document.getElementById("modalUserName");
  const modalIdeasContainer = document.getElementById("modalIdeasContainer");

  modalUserName.textContent = `${userName}'s Ideas`;
  modalIdeasContainer.innerHTML = "";

  if (!ideas || ideas.length === 0) {
    modalIdeasContainer.innerHTML = "<p>No ideas submitted.</p>";
  } else {
    ideas.forEach((idea) => {
      const card = document.createElement("div");
      card.className = "idea-card";
      card.innerHTML = `
          <h3>${idea.title}</h3>
          <p><strong>Description:</strong> ${idea.description}</p>
          <p><strong>Problem:</strong> ${idea.problem}</p>
          <p><strong>File:</strong> ${
            idea.file_url
              ? `<a href="${idea.file_url}" target="_blank">View File</a>`
              : "No file attached"
          }</p>
        `;
      modalIdeasContainer.appendChild(card);
    });
  }

  modal.style.display = "block";

  closeBtn.onclick = () => (modal.style.display = "none");
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
}