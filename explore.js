import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.42.5/+esm";

const supabase = createClient(
  "https://xarlawzvqwupgxlwadsj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU"
);

let allIdeas = [];
let currentUserId = localStorage.getItem("userId") || generateUserId();
let pendingLikeOperations = new Map(); // Track pending operations
let currentUserProfile = null; // Cache user profile data

// Generate or get user ID
function generateUserId() {
  const userId = "user_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("userId", userId);
  return userId;
}

// Function to fetch user data from the profile table using email
async function fetchUserProfileByEmail(email) {
  if (!email) {
    console.log("No email provided to fetchUserProfileByEmail.");
    return null;
  }
  
  // Check if we already have the profile data cached
  if (currentUserProfile && currentUserProfile.email === email) {
    return currentUserProfile;
  }
  
  try {
    const { data, error } = await supabase
      .from("profile")
      .select("name, phone, email")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log(`No profile found in 'profile' table for email: ${email}.`);
        return null;
      }
      console.error("Error fetching user profile by email:", error);
      return null;
    }

    // Cache the profile data
    currentUserProfile = data;
    return data;
  } catch (error) {
    console.error("Error fetching user profile by email:", error);
    return null;
  }
}

// Function to get current user's name
async function getCurrentUserName() {
  const userEmail = localStorage.getItem("userEmail");
  if (!userEmail) return null;
  
  const profile = await fetchUserProfileByEmail(userEmail);
  return profile ? profile.name : null;
}

// Fetch comments for a specific idea
async function fetchComments(ideaId) {
  const commentsContainer = document.getElementById("comments-container");

  try {
    commentsContainer.innerHTML =
      '<div class="comments-loading"><i class="fas fa-spinner fa-spin"></i> Loading comments...</div>';

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (data.length === 0) {
      commentsContainer.innerHTML =
        '<div class="no-comments">No comments yet. Be the first to comment!</div>';
      return;
    }

    commentsContainer.innerHTML = data
      .map(
        (comment) => `
      <div class="comment">
        <div class="comment-header">
          <span class="comment-name">${escapeHtml(
            comment.name || "Anonymous"
          )}</span>
          <span class="comment-date">${formatDate(comment.created_at)}</span>
        </div>
        <div class="comment-text">${escapeHtml(comment.comment)}</div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching comments:", error);
    commentsContainer.innerHTML =
      '<div class="no-comments">Unable to load comments. Please try again later.</div>';
  }
}

// Submit a new comment
async function submitComment(ideaId) {
  const nameInput = document.getElementById("comment-name");
  const commentInput = document.getElementById("comment-text");

  let name = nameInput.value.trim();
  const commentText = commentInput.value.trim();

  // Get email from localStorage
  const userEmail = localStorage.getItem("userEmail");

  // FALLBACK: If the name field is empty, try to fetch it one last time using the email from localStorage
  if (!name && userEmail) {
    try {
      const profile = await fetchUserProfileByEmail(userEmail);
      if (profile && profile.name) {
        name = profile.name;
        // Update the input field so the user sees it filled
        nameInput.value = name;
        // Make the name field read-only since it's populated from profile
        nameInput.readOnly = true;
        nameInput.style.backgroundColor = "#f5f5f5"; // Visual indicator that it's read-only
      }
    } catch (error) {
      console.error(
        "Error fetching user profile by email during comment submission:",
        error
      );
    }
  }

  // Validation
  if (!name || !commentText || !userEmail) {
    showNotification(
      "Please fill in all required fields, including your name.",
      "error"
    );
    return;
  }

  try {
    const submitButton = document.querySelector(
      '#comment-form button[type="submit"]'
    );
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Posting...';

    const { data, error } = await supabase.from("comments").insert([
      {
        idea_id: ideaId,
        name: name,
        email: userEmail, // Email is stored but not displayed
        comment: commentText,
      },
    ]);

    if (error) throw error;

    nameInput.value = "";
    commentInput.value = "";

    await fetchComments(ideaId);
    showNotification("Comment posted successfully!", "success");
  } catch (error) {
    console.error("Error submitting comment:", error);
    showNotification(
      "Unable to post comment. Please try again later.",
      "error"
    );
  } finally {
    const submitButton = document.querySelector(
      '#comment-form button[type="submit"]'
    );
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
  }
}

// Like or unlike an idea
async function toggleLike(ideaId) {
  // Check if there's already a pending operation for this idea
  if (pendingLikeOperations.has(ideaId)) {
    return; // Skip if operation is already in progress
  }

  // Mark this idea as having a pending operation
  pendingLikeOperations.set(ideaId, true);

  const likeBtns = document.querySelectorAll(
    `.like-btn[data-idea-id="${ideaId}"]`
  );
  const likeCountElements = document.querySelectorAll(
    `.like-count[data-idea-id="${ideaId}"]`
  );

  // Disable buttons during operation
  likeBtns.forEach((btn) => (btn.disabled = true));

  // Get current like count
  const idea = allIdeas.find((i) => i.id === ideaId);
  const currentLikeCount = idea.like_count || 0;

  // Check current state
  const isCurrentlyLiked = likeBtns[0].classList.contains("liked");

  try {
    if (isCurrentlyLiked) {
      // Remove like from Supabase (dislike) - DELETE the row
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("idea_id", ideaId)
        .eq("user_id", currentUserId);

      if (error) throw error;

      // Wait a bit to ensure the delete is processed
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Immediately update UI to show disliked state
      updateLikeUI(ideaId, false, currentLikeCount - 1);

      showNotification("Disliked!", "success");
    } else {
      // Add like to Supabase
      const { error } = await supabase.from("likes").insert([
        {
          idea_id: ideaId,
          user_id: currentUserId,
        },
      ]);

      if (error) throw error;

      // Wait a bit to ensure the insert is processed
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Immediately update UI to show liked state
      updateLikeUI(ideaId, true, currentLikeCount + 1);

      showNotification("Liked!", "success");
    }
  } catch (error) {
    console.error("Error toggling like:", error);

    // Revert UI to the original state on error
    updateLikeUI(ideaId, isCurrentlyLiked, currentLikeCount);

    showNotification("Error updating like. Please try again.", "error");
  } finally {
    // Re-enable buttons
    likeBtns.forEach((btn) => (btn.disabled = false));

    // Remove the pending operation marker
    pendingLikeOperations.delete(ideaId);
  }
}

// Get actual like count from database
async function getActualLikeCount(ideaId) {
  try {
    const { data, error } = await supabase
      .from("likes")
      .select("id")
      .eq("idea_id", ideaId);

    if (error) throw error;

    return data.length;
  } catch (error) {
    console.error("Error getting actual like count:", error);
    return 0;
  }
}

// Update like count in UI
function updateLikeCount(ideaId, count) {
  const likeCountElements = document.querySelectorAll(
    `.like-count[data-idea-id="${ideaId}"]`
  );

  // Update counts
  likeCountElements.forEach((el) => {
    el.textContent = count;
  });

  // Update idea object
  const idea = allIdeas.find((i) => i.id === ideaId);
  if (idea) {
    idea.like_count = count;
  }
}

// Update like UI
function updateLikeUI(ideaId, isLiked, likeCount) {
  const likeBtns = document.querySelectorAll(
    `.like-btn[data-idea-id="${ideaId}"]`
  );
  const likeCountElements = document.querySelectorAll(
    `.like-count[data-idea-id="${ideaId}"]`
  );

  // Update buttons
  likeBtns.forEach((btn) => {
    if (isLiked) {
      btn.classList.add("liked");
      btn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
      btn.classList.remove("liked");
      btn.innerHTML = '<i class="far fa-heart"></i>';
    }
  });

  // Update counts
  likeCountElements.forEach((el) => {
    el.textContent = likeCount;
  });

  // Update idea object
  const idea = allIdeas.find((i) => i.id === ideaId);
  if (idea) {
    idea.like_count = likeCount;
  }
}

// Check if user liked an idea
async function checkUserLike(ideaId) {
  try {
    const { data, error } = await supabase
      .from("likes")
      .select("*")
      .eq("idea_id", ideaId)
      .eq("user_id", currentUserId);

    if (error) throw error;

    // Return true if we found at least one like
    return data && data.length > 0;
  } catch (error) {
    console.error("Error checking user like:", error);
    return false;
  }
}

// Send collaboration request
async function sendCollaborationRequest(ideaId, receiverEmail, ideaTitle) {
  const userEmail = localStorage.getItem("userEmail");
  
  // Get user name from profile
  const userName = await getCurrentUserName();
  
  // Get receiver profile to get their phone
  const receiverProfile = await fetchUserProfileByEmail(receiverEmail);
  const receiverPhone = receiverProfile ? receiverProfile.phone : null;
  
  if (!userEmail || !userName) {
    showNotification("You need to be logged in to send a collaboration request.", "error");
    return;
  }
  
  try {
    const { data, error } = await supabase.from("collaboration").insert([
      {
        sender_email: userEmail,
        sender_name: userName,
        receiver_email: receiverEmail,
        receiver_phone: receiverPhone,
        idea_id: ideaId,
        message: `I'm interested in collaborating on your idea: "${ideaTitle}"`
      }
    ]);
    
    if (error) throw error;
    
    showNotification("Collaboration request sent successfully!", "success");
  } catch (error) {
    console.error("Error sending collaboration request:", error);
    showNotification("Failed to send collaboration request. Please try again.", "error");
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${
        type === "success" ? "check-circle" : "exclamation-circle"
      }"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">&times;</button>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  notification
    .querySelector(".notification-close")
    .addEventListener("click", () => {
      notification.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    });

  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.classList.remove("show");
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);
}

// Fetch ideas from Supabase with like counts
async function loadIdeas() {
  const ideasContainer = document.getElementById("ideas-container");

  try {
    ideasContainer.innerHTML =
      '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading ideas...</div>';

    const { data, error } = await supabase
      .from("public_ideas")
      .select("*") // Make sure this includes the email field
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get like counts for each idea
    const ideasWithLikes = await Promise.all(
      data.map(async (idea) => {
        const likeCount = await getActualLikeCount(idea.id);
        return {
          ...idea,
          like_count: likeCount,
        };
      })
    );

    allIdeas = ideasWithLikes;

    if (allIdeas.length === 0) {
      ideasContainer.innerHTML =
        '<div class="no-ideas">No ideas found. Be the first to submit an idea!</div>';
      return;
    }

    renderIdeas(allIdeas);
  } catch (error) {
    console.error("Error fetching ideas:", error);
    ideasContainer.innerHTML =
      '<div class="no-ideas">Error loading ideas. Please try again later.</div>';
  }
}

function getCategoryClass(category) {
  const colors = {
    electronics: "badge-Electronics",
    ai: "badge-Ai",
    health: "badge-Health",
    education: "badge-Education",
    finance: "badge-Finance",
    other: "badge-Other",
  };
  return colors[category?.toLowerCase()] || "badge-default";
}

async function renderIdeas(ideas, query = "") {
  const container = document.getElementById("ideas-container");
  container.innerHTML = "";

  if (ideas.length === 0) {
    container.innerHTML =
      "<p style='text-align:center;'>No matching ideas found.</p>";
    return;
  }

  for (const idea of ideas) {
    const wrapper = document.createElement("div");
    wrapper.className = "idea-card-wrapper";

    const card = document.createElement("div");
    card.className = "idea-card";

    const categoryClass = getCategoryClass(idea.category);
    const isLiked = await checkUserLike(idea.id);

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
      <div class="idea-actions">
        <button class="like-btn ${isLiked ? "liked" : ""}" data-idea-id="${
      idea.id
    }">
          <i class="${isLiked ? "fas" : "far"} fa-heart"></i>
        </button>
        <span class="like-count" data-idea-id="${idea.id}">${
      idea.like_count
    }</span>
      </div>
    `;

    // Add event listener to like button
    const likeBtn = card.querySelector(".like-btn");
    likeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLike(idea.id);
    });

    card.addEventListener("click", () => showModal(idea));
    wrapper.appendChild(card);
    container.appendChild(wrapper);
  }
}

async function showModal(idea) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  const isLiked = await checkUserLike(idea.id);

  modalBody.innerHTML = `
    <h2>${escapeHtml(idea.title)}</h2>
    <p><strong>Category:</strong> ${escapeHtml(idea.category)}</p>
    <p><strong>Problem:</strong> ${escapeHtml(idea.problem)}</p>
    <p><strong>Target Audience:</strong> ${escapeHtml(idea.target_audience)}</p>
    <p><strong>Description:</strong> ${escapeHtml(idea.description)}</p>
    ${
      idea.file_url
        ? `<p><a href="${idea.file_url}" target="_blank">View File</a></p>`
        : ""
    }
    <p><em>By ${escapeHtml(idea.name || "Anonymous")}</em></p>
    <div class="idea-actions">
      <button class="like-btn ${isLiked ? "liked" : ""}" data-idea-id="${
    idea.id
  }">
        <i class="${isLiked ? "fas" : "far"} fa-heart"></i>
      </button>
      <span class="like-count" data-idea-id="${idea.id}">${
    idea.like_count
  }</span>
    </div>
    
    <div class="comments-section">
      <h3><i class="fas fa-comments"></i> Comments</h3>
      <div id="comments-container" class="comments-container">
        <!-- Comments will be loaded here -->
      </div>
      
      <div class="comment-form-container">
        <h4>Add a Comment</h4>
        <form id="comment-form">
          <div class="form-group">
            <input type="text" id="comment-name" placeholder="Your Name" required>
          </div>
          <div class="form-group">
            <textarea id="comment-text" placeholder="Your Comment" rows="3" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-paper-plane"></i> Post Comment
          </button>
        </form>
      </div>
    </div>
    
    <div class="collaboration-section">
      <button class="collaboration-btn" data-idea-id="${idea.id}" data-receiver-email="${idea.email || ''}">
        <i class="fas fa-handshake"></i> Request Collaboration
      </button>
    </div>
  `;

  modal.style.display = "flex";

  // Add event listener to modal like button
  const modalLikeBtn = modal.querySelector(".like-btn");
  modalLikeBtn.addEventListener("click", () => toggleLike(idea.id));
  
  // Add event listener to collaboration button
  const collaborationBtn = modal.querySelector(".collaboration-btn");
  collaborationBtn.addEventListener("click", () => {
    const receiverEmail = collaborationBtn.getAttribute("data-receiver-email");
    if (!receiverEmail) {
      showNotification("Unable to send collaboration request. No email found for the idea author.", "error");
      return;
    }
    
    if (confirm(`Send a collaboration request to the author of "${idea.title}"?`)) {
      sendCollaborationRequest(idea.id, receiverEmail, idea.title);
    }
  });

  fetchComments(idea.id);

  // Get email from localStorage and auto-fill name field
  const userEmail = localStorage.getItem("userEmail");
  const nameInput = document.getElementById("comment-name");

  if (userEmail && nameInput) {
    // Try to get their profile by email
    fetchUserProfileByEmail(userEmail)
      .then((profile) => {
        if (profile && profile.name) {
          nameInput.value = profile.name;
          // Make the name field read-only since it's populated from profile
          nameInput.readOnly = true;
          nameInput.style.backgroundColor = "#f5f5f5"; // Visual indicator that it's read-only
        } else {
          console.log(
            "Profile not found for email. The name field will be left editable for them to fill in."
          );
        }
      })
      .catch((error) => {
        console.error("Error loading user profile by email:", error);
      });
  } else {
    console.log(
      "No email found in localStorage or name input not found. The name field will be left blank."
    );
  }

  const commentForm = document.getElementById("comment-form");
  if (commentForm) {
    commentForm.onsubmit = function (e) {
      e.preventDefault();
      submitComment(idea.id);
    };
  }
}

// Highlight search terms
function highlight(text, query) {
  if (!query) return text;
  return text.replace(new RegExp(`(${query})`, "gi"), "<mark>$1</mark>");
}

// Modal close
document.getElementById("modal-close").onclick = () => {
  document.getElementById("modal").style.display = "none";
};

window.onclick = (e) => {
  const modal = document.getElementById("modal");
  if (e.target === modal) modal.style.display = "none";
};

// Debounced Search with Criteria
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

// Navbar toggle
document.getElementById("hamburger").addEventListener("click", function () {
  document.getElementById("nav-links").classList.toggle("active");
});

// Logout
window.handleLogout = function () {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear();
    sessionStorage.clear();
    currentUserProfile = null; // Clear cached profile
    window.location.href = "login.html";
  }
};

// Add collaboration button styles
const collaborationStyles = `
  .collaboration-section {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    text-align: center;
  }
  
  .collaboration-btn {
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 50px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    font-size: 18px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .collaboration-btn:hover {
    background: linear-gradient(135deg, #45a049, #3d8b40);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  }
  
  .collaboration-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
  }
  
  .collaboration-btn:disabled {
    background: linear-gradient(135deg, #cccccc, #bbbbbb);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .collaboration-btn i {
    font-size: 20px;
  }
  
  .idea-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 15px;
  }
  
  .comments-section {
    margin-top: 30px;
  }
  
  .comment-form-container {
    margin-top: 20px;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
  }
`;

// Inject the styles into the document
const styleSheet = document.createElement("style");
styleSheet.textContent = collaborationStyles;
document.head.appendChild(styleSheet);

// Initial load
document.addEventListener("DOMContentLoaded", loadIdeas);