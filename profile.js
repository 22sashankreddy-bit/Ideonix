
const supabaseUrl = "https://xarlawzvqwupgxlwadsj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU";

let supabaseClient;
try {
  if (typeof supabase !== "undefined") {
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized successfully");
  } else {
    throw new Error(
      "Supabase library not loaded. Please check your internet connection."
    );
  }
} catch (err) {
  console.error("Error initializing Supabase client:", err);
}


async function loadUserProfile() {

  if (!supabaseClient) {
    alert("Supabase client not initialized. Please refresh the page.");
    return;
  }

  const username = document.getElementById("usernameInput").value.trim();
  if (!username) {
    alert("Please enter a username.");
    return;
  }

  document.getElementById("userName").textContent = "Loading...";
  document.getElementById("ideaCount").textContent = "...";
  document.getElementById("problemCount").textContent = "...";
  document.getElementById("ideaList").innerHTML = "<li>Loading ideas...</li>";
  document.getElementById("problemList").innerHTML =
    "<li>Loading problems...</li>";

  try {
    // 1. Get ideas using case-insensitive exact match
    console.log(
      "Searching for ideas with exact name (case-insensitive):",
      username
    );
    const { data: ideas, error: ideasError } = await supabaseClient
      .from("public_ideas")
      .select("*")
      .ilike("name", username); // Case-insensitive exact match (without wildcards)

    if (ideasError) {
      console.error("Supabase ideas error:", ideasError);
      throw new Error("Error fetching ideas: " + ideasError.message);
    }

    // 2. Get problems using case-insensitive exact match with correct column names
    console.log(
      "Searching for problems with exact name (case-insensitive):",
      username
    );
    const { data: problems, error: problemsError } = await supabaseClient
      .from("problems")
      .select("*")
      .ilike("name", username); // Case-insensitive exact match (without wildcards)

    if (problemsError) {
      console.error("Supabase problems error:", problemsError);
      throw new Error("Error fetching problems: " + problemsError.message);
    }

    // 3. Try to get user profile from profiles table for additional info (optional)
    let userProfile = null;
    try {
      const { data: profiles, error: profileError } = await supabaseClient
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${username}%,full_name.ilike.%${username}%`)
        .limit(1);

      if (!profileError && profiles && profiles.length > 0) {
        userProfile = profiles[0];
        console.log("User profile found:", userProfile);
      }
    } catch (err) {
      console.log("Could not fetch user profile, continuing without it");
    }

    // If we found ideas or problems, extract the actual name used in the database
    let actualName = username;
    if (ideas && ideas.length > 0) {
      actualName = ideas[0].name;
    } else if (problems && problems.length > 0) {
      actualName = problems[0].name;
    }

    // ✅ Update UI
    document.getElementById("userName").textContent = userProfile
      ? userProfile.full_name || userProfile.username
      : actualName;

    document.getElementById("ideaCount").textContent = ideas ? ideas.length : 0;
    document.getElementById("problemCount").textContent = problems
      ? problems.length
      : 0;

    const ideaList = document.getElementById("ideaList");
    const problemList = document.getElementById("problemList");

    ideaList.innerHTML = "";
    if (ideas && ideas.length > 0) {
      for (let idea of ideas) {
        const li = document.createElement("li");
        li.textContent = `${idea.title || "Untitled"}: ${
          idea.description || "No description"
        }`;
        ideaList.appendChild(li);
      }
    } else {
      ideaList.innerHTML = "<li>No ideas submitted</li>";
    }

    problemList.innerHTML = "";
    if (problems && problems.length > 0) {
      for (let problem of problems) {
        const li = document.createElement("li");
        li.textContent = `${problem.title || "Untitled"}: ${
          problem.description || "No description"
        }`;
        problemList.appendChild(li);
      }
    } else {
      problemList.innerHTML = "<li>No problems submitted</li>";
    }

    // If we didn't find anything, show a more helpful message
    if (
      (!ideas || ideas.length === 0) &&
      (!problems || problems.length === 0)
    ) {
      console.log(`No ideas or problems found for "${username}"`);
      alert(
        `No ideas or problems found for "${username}". Try searching with a different spelling or check the name in the database.`
      );
    }
  } catch (err) {
    alert("Something went wrong: " + err.message);
    console.error(err);

    // Reset UI on error
    document.getElementById("userName").textContent = "";
    document.getElementById("ideaCount").textContent = "0";
    document.getElementById("problemCount").textContent = "0";
    document.getElementById("ideaList").innerHTML = "";
    document.getElementById("problemList").innerHTML = "";
  }
}

// ✅ Make it available globally
window.loadUserProfile = loadUserProfile;

// Add event listener for Enter key in the input field
document.addEventListener("DOMContentLoaded", function () {
  const usernameInput = document.getElementById("usernameInput");
  if (usernameInput) {
    usernameInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        loadUserProfile();
      }
    });
  }

  // Hamburger menu toggle
  const hamburger = document.querySelector(".hamburger");
  const navList = document.querySelector(".nav-list");

  if (hamburger && navList) {
    hamburger.addEventListener("click", function () {
      navList.classList.toggle("active");
    });

    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll(".nav-list a");
    navLinks.forEach((link) => {
      link.addEventListener("click", function () {
        navList.classList.remove("active");
      });
    });
  }
});
