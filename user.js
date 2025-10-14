import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.42.5/+esm";

const SUPABASE_URL = "https://xarlawzvqwupgxlwadsj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const profileContent = document.getElementById("profileContent");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");
const ideaModal = document.getElementById("ideaModal");
const problemModal = document.getElementById("problemModal");

let currentUserId = localStorage.getItem("userId") || generateUserId();
let allIdeas = [];
let allProblems = [];
let sentCollaborations = [];
let receivedCollaborations = [];

function generateUserId() {
  const userId = "user_" + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("userId", userId);
  return userId;
}

async function fetchUserProfileByEmail(email) {
  if (!email) {
    console.log("No email provided to fetchUserProfileByEmail.");
    return null;
  }
  try {
    const { data, error } = await supabase
      .from("profile")
      .select("name, phone, email, description")
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

    return data;
  } catch (error) {
    console.error("Error fetching user profile by email:", error);
    return null;
  }
}

async function fetchUserIdeas(email) {
  if (!email) {
    console.log("No email provided to fetchUserIdeas.");
    return [];
  }

  console.log("Fetching ideas for email:", email);

  try {
    const { data, error } = await supabase
      .from("public_ideas")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user ideas:", error);
      return [];
    }

    console.log("Fetched ideas:", data);

    if (!data || data.length === 0) {
      console.log("No ideas found for this email");
      return [];
    }

    const ideasWithStats = await Promise.all(
      data.map(async (idea) => {
        const likeCount = await getActualLikeCount(idea.id);
        const commentCount = await getCommentCount(idea.id);
        return {
          ...idea,
          like_count: likeCount,
          comment_count: commentCount,
        };
      })
    );

    allIdeas = ideasWithStats;
    return ideasWithStats;
  } catch (error) {
    console.error("Error fetching user ideas:", error);
    return [];
  }
}

async function fetchUserProblems(email) {
  if (!email) {
    console.log("No email provided to fetchUserProblems.");
    return [];
  }

  console.log("Fetching problems for email:", email);

  try {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user problems:", error);
      return [];
    }

    console.log("Fetched problems:", data);

    if (!data || data.length === 0) {
      console.log("No problems found for this email");
      return [];
    }

    allProblems = data;
    return data;
  } catch (error) {
    console.error("Error fetching user problems:", error);
    return [];
  }
}

async function fetchSentCollaborations(email) {
  if (!email) {
    console.log("No email provided to fetchSentCollaborations.");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("collaboration")
      .select("*")
      .eq("sender_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sent collaborations:", error);
      return [];
    }

    // Get receiver profiles for each collaboration
    const collaborationsWithProfiles = await Promise.all(
      data.map(async (collab) => {
        const receiverProfile = await fetchUserProfileByEmail(collab.receiver_email);
        return {
          ...collab,
          receiver_profile: receiverProfile
        };
      })
    );

    sentCollaborations = collaborationsWithProfiles;
    return collaborationsWithProfiles;
  } catch (error) {
    console.error("Error fetching sent collaborations:", error);
    return [];
  }
}

async function fetchReceivedCollaborations(email) {
  if (!email) {
    console.log("No email provided to fetchReceivedCollaborations.");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("collaboration")
      .select("*")
      .eq("receiver_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching received collaborations:", error);
      return [];
    }

    // Get sender profiles for each collaboration
    const collaborationsWithProfiles = await Promise.all(
      data.map(async (collab) => {
        const senderProfile = await fetchUserProfileByEmail(collab.sender_email);
        return {
          ...collab,
          sender_profile: senderProfile
        };
      })
    );

    receivedCollaborations = collaborationsWithProfiles;
    return collaborationsWithProfiles;
  } catch (error) {
    console.error("Error fetching received collaborations:", error);
    return [];
  }
}

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

async function getCommentCount(ideaId) {
  try {
    const { data, error } = await supabase
      .from("comments")
      .select("id")
      .eq("idea_id", ideaId);

    if (error) throw error;

    return data.length;
  } catch (error) {
    console.error("Error getting comment count:", error);
    return 0;
  }
}

function displayProfileContent(profile, ideas, problems) {
  if (!profile) {
    profileContent.innerHTML = `
            <div class="error">
                <h2>Profile Not Found</h2>
                <p>We couldn't find your profile information. Please contact support.</p>
                <button class="btn btn-secondary" onclick="window.location.href='dashboard.html'">Back to Dashboard</button>
            </div>
        `;
    return;
  }

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  profileContent.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${initials}</div>
            <div class="profile-info">
                <div class="profile-name">${
                  profile.name || "Unknown User"
                }</div>
                <div class="profile-email">${profile.email || ""}</div>
                <div class="profile-description">${
                  profile.description || "No description provided."
                }</div>
            </div>
        </div>
        
        <div class="tabs">
            <div class="tab active" onclick="switchTab('ideas')">My Ideas (${
              ideas.length
            })</div>
            <div class="tab" onclick="switchTab('problems')">My Problems (${
              problems.length
            })</div>
            <div class="tab" onclick="switchTab('collaborations')">Collaborations</div>
            <div class="tab" onclick="switchTab('edit')">Edit Profile</div>
        </div>
        
        <div id="ideas-tab" class="tab-content active">
            ${
              ideas.length > 0
                ? `
                <div class="ideas-container">
                    ${ideas
                      .map(
                        (idea) => `
                        <div class="idea-card" onclick="showIdeaModal('${
                          idea.id
                        }')">
                            <div class="idea-title">${
                              idea.title || "Untitled Idea"
                            }</div>
                            <div class="idea-description">${
                              idea.description || "No description provided."
                            }</div>
                            <div class="idea-meta">
                                <span><i class="far fa-calendar"></i> ${formatDate(
                                  idea.created_at
                                )}</span>
                                <span><i class="far fa-heart"></i> ${
                                  idea.like_count || 0
                                } likes</span>
                                <span><i class="far fa-comment"></i> ${
                                  idea.comment_count || 0
                                } comments</span>
                            </div>
                            <div class="idea-actions">
                                <button class="btn btn-secondary" onclick="event.stopPropagation(); editIdea('${
                                  idea.id
                                }')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteIdea('${
                                  idea.id
                                }')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `
                : `
                <div class="no-ideas">
                    <i class="fas fa-lightbulb"></i>
                    <h3>No Ideas Yet</h3>
                    <p>You haven't created any ideas yet. Start sharing your brilliant thoughts!</p>
                    <button class="btn" onclick="window.location.href='submit.html'">Create Your First Idea</button>
                </div>
            `
            }
        </div>
        
        <div id="problems-tab" class="tab-content">
            ${
              problems.length > 0
                ? `
                <div class="problems-container">
                    ${problems
                      .map(
                        (problem) => `
                        <div class="problem-card" onclick="showProblemModal('${
                          problem.id
                        }')">
                            <div class="problem-title">${
                              problem.title || "Untitled Problem"
                            }</div>
                            <div class="problem-description">${
                              problem.description || "No description provided."
                            }</div>
                            <div class="problem-meta">
                                <span><i class="far fa-calendar"></i> ${formatDate(
                                  problem.created_at
                                )}</span>
                                <span><i class="far fa-exclamation-triangle"></i> Problem</span>
                            </div>
                            <div class="problem-actions">
                                <button class="btn btn-secondary" onclick="event.stopPropagation(); editProblem('${
                                  problem.id
                                }')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteProblem('${
                                  problem.id
                                }')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `
                : `
                <div class="no-problems">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No Problems Yet</h3>
                    <p>You haven't submitted any problems yet. Help identify issues that need solutions!</p>
                    <button class="btn" onclick="window.location.href='problem.html'">Submit Your First Problem</button>
                </div>
            `
            }
        </div>
        
        <div id="collaborations-tab" class="tab-content">
            <div class="collaboration-subtabs">
                <div class="collab-subtab active" onclick="switchCollabTab('sent')">Sent Requests (${sentCollaborations.length})</div>
                <div class="collab-subtab" onclick="switchCollabTab('received')">Received Requests (${receivedCollaborations.length})</div>
            </div>
            
            <div id="sent-requests" class="collab-subtab-content active">
                ${sentCollaborations.length > 0 ? `
                    <div class="collaborations-container">
                        ${sentCollaborations.map(collab => `
                            <div class="collaboration-card ${collab.status}">
                                <div class="collab-header">
                                    <h3>Request to: ${collab.receiver_profile ? collab.receiver_profile.name : 'Unknown User'}</h3>
                                    <span class="collab-status ${collab.status}">${collab.status || 'pending'}</span>
                                </div>
                                <div class="collab-message">${collab.message}</div>
                                <div class="collab-details">
                                    ${collab.status === 'accepted' ? `
                                        <div class="collab-contact">
                                            <i class="fas fa-envelope"></i> ${collab.receiver_email}
                                        </div>
                                        ${collab.receiver_profile && collab.receiver_profile.phone ? `
                                            <div class="collab-contact">
                                                <i class="fas fa-phone"></i> ${collab.receiver_profile.phone}
                                            </div>
                                        ` : ''}
                                    ` : `
                                        <div class="collab-contact-privacy">
                                            <i class="fas fa-lock"></i> Contact information will be visible once the collaboration is accepted
                                        </div>
                                    `}
                                </div>
                                <div class="collab-date">
                                    <i class="far fa-calendar"></i> Sent on ${formatDate(collab.created_at)}
                                </div>
                                ${collab.status === 'pending' ? `
                                    <div class="collab-actions">
                                        <button class="btn btn-secondary" onclick="event.stopPropagation(); withdrawCollaboration('${collab.id}')">
                                            <i class="fas fa-times"></i> Withdraw
                                        </button>
                                    </div>
                                ` : ''}
                                ${collab.status === 'accepted' ? `
                                    <div class="collab-actions">
                                       
                                        ${collab.receiver_profile && collab.receiver_profile.phone ? `
                                            <button class="btn btn-success" onclick="event.stopPropagation(); makeCall('${collab.receiver_profile.phone}')">
                                                <i class="fas fa-phone"></i> Call
                                            </button>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-collaborations">
                        <i class="fas fa-handshake"></i>
                        <h3>No Sent Requests</h3>
                        <p>You haven't sent any collaboration requests yet.</p>
                    </div>
                `}
            </div>
            
            <div id="received-requests" class="collab-subtab-content">
                ${receivedCollaborations.length > 0 ? `
                    <div class="collaborations-container">
                        ${receivedCollaborations.map(collab => `
                            <div class="collaboration-card ${collab.status}">
                                <div class="collab-header">
                                    <h3>Request from: ${collab.sender_profile ? collab.sender_profile.name : 'Unknown User'}</h3>
                                    <span class="collab-status ${collab.status}">${collab.status || 'pending'}</span>
                                </div>
                                <div class="collab-message">${collab.message}</div>
                                <div class="collab-details">
                                    ${collab.status === 'accepted' ? `
                                        <div class="collab-contact">
                                            <i class="fas fa-envelope"></i> ${collab.sender_email}
                                        </div>
                                        ${collab.sender_profile && collab.sender_profile.phone ? `
                                            <div class="collab-contact">
                                                <i class="fas fa-phone"></i> ${collab.sender_profile.phone}
                                            </div>
                                        ` : ''}
                                    ` : `
                                        <div class="collab-contact-privacy">
                                            <i class="fas fa-lock"></i> Contact information will be visible once the collaboration is accepted
                                        </div>
                                    `}
                                </div>
                                <div class="collab-date">
                                    <i class="far fa-calendar"></i> Received on ${formatDate(collab.created_at)}
                                </div>
                                ${collab.status === 'pending' ? `
                                    <div class="collab-actions">
                                        <button class="btn btn-success" onclick="event.stopPropagation(); acceptCollaboration('${collab.id}')">
                                            <i class="fas fa-check"></i> Accept
                                        </button>
                                        <button class="btn btn-danger" onclick="event.stopPropagation(); declineCollaboration('${collab.id}')">
                                            <i class="fas fa-times"></i> Decline
                                        </button>
                                    </div>
                                ` : ''}
                                ${collab.status === 'accepted' ? `
                                    <div class="collab-actions">
                                        <button class="btn btn-primary" onclick="event.stopPropagation(); sendEmail('${collab.sender_email}')">
                                            <i class="fas fa-envelope"></i> Send Email
                                        </button>
                                        ${collab.sender_profile && collab.sender_profile.phone ? `
                                            <button class="btn btn-success" onclick="event.stopPropagation(); makeCall('${collab.sender_profile.phone}')">
                                                <i class="fas fa-phone"></i> Call
                                            </button>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-collaborations">
                        <i class="fas fa-handshake"></i>
                        <h3>No Received Requests</h3>
                        <p>You haven't received any collaboration requests yet.</p>
                    </div>
                `}
            </div>
        </div>
        
        <div id="edit-tab" class="tab-content">
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="name">Full Name <span class="required">*</span></label>
                    <input type="text" id="name" name="name" value="${
                      profile.name || ""
                    }" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email <span class="required">*</span></label>
                    <input type="email" id="email" name="email" value="${
                      profile.email || ""
                    }" required readonly>
                </div>
                
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="text" id="phone" name="phone" value="${
                      profile.phone || ""
                    }">
                </div>
                
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" name="description">${
                      profile.description || ""
                    }</textarea>
                </div>
                
                <div class="button-group">
                    <button type="button" class="btn btn-secondary" onclick="switchTab('ideas')">
                        <i class="fas fa-arrow-left"></i> Back to Ideas
                    </button>
                    <button type="submit" class="btn">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;

  const editForm = document.getElementById("editProfileForm");
  if (editForm) {
    editForm.addEventListener("submit", handleFormSubmit);
  }
}

window.switchTab = function (tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  event.target.classList.add("active");

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(`${tabName}-tab`).classList.add("active");
};

window.switchCollabTab = function (tabName) {
  document.querySelectorAll(".collab-subtab").forEach((tab) => {
    tab.classList.remove("active");
  });
  event.target.classList.add("active");

  document.querySelectorAll(".collab-subtab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(`${tabName}-requests`).classList.add("active");
};

window.acceptCollaboration = async function (collabId) {
  try {
    const { error } = await supabase
      .from("collaboration")
      .update({ status: "accepted" })
      .eq("id", collabId);

    if (error) throw error;

    showNotification("Collaboration request accepted! Contact information is now visible.", "success");
    
    // Refresh the collaboration data
    const userEmail = localStorage.getItem("userEmail");
    await fetchReceivedCollaborations(userEmail);
    
    // Update the UI
    updateCollaborationsUI();
  } catch (error) {
    console.error("Error accepting collaboration:", error);
    showNotification("Failed to accept collaboration request.", "error");
  }
};

window.declineCollaboration = async function (collabId) {
  try {
    const { error } = await supabase
      .from("collaboration")
      .update({ status: "declined" })
      .eq("id", collabId);

    if (error) throw error;

    showNotification("Collaboration request declined.", "success");
    
    // Refresh the collaboration data
    const userEmail = localStorage.getItem("userEmail");
    await fetchReceivedCollaborations(userEmail);
    
    // Update the UI
    updateCollaborationsUI();
  } catch (error) {
    console.error("Error declining collaboration:", error);
    showNotification("Failed to decline collaboration request.", "error");
  }
};

window.withdrawCollaboration = async function (collabId) {
  try {
    const { error } = await supabase
      .from("collaboration")
      .update({ status: "withdrawn" })
      .eq("id", collabId);

    if (error) throw error;

    showNotification("Collaboration request withdrawn.", "success");
    
    // Refresh the collaboration data
    const userEmail = localStorage.getItem("userEmail");
    await fetchSentCollaborations(userEmail);
    
    // Update the UI
    updateCollaborationsUI();
  } catch (error) {
    console.error("Error withdrawing collaboration:", error);
    showNotification("Failed to withdraw collaboration request.", "error");
  }
};

window.sendEmail = function(email) {
  window.location.href = `mailto:${email}`;
};

window.makeCall = function(phone) {
  window.location.href = `tel:${phone}`;
};

function updateCollaborationsUI() {
  const sentRequestsContainer = document.getElementById("sent-requests");
  const receivedRequestsContainer = document.getElementById("received-requests");
  
  // Update sent requests
  if (sentRequestsContainer) {
    sentRequestsContainer.innerHTML = sentCollaborations.length > 0 ? `
        <div class="collaborations-container">
            ${sentCollaborations.map(collab => `
                <div class="collaboration-card ${collab.status}">
                    <div class="collab-header">
                        <h3>Request to: ${collab.receiver_profile ? collab.receiver_profile.name : 'Unknown User'}</h3>
                        <span class="collab-status ${collab.status}">${collab.status || 'pending'}</span>
                    </div>
                    <div class="collab-message">${collab.message}</div>
                    <div class="collab-details">
                        ${collab.status === 'accepted' ? `
                            <div class="collab-contact">
                                <i class="fas fa-envelope"></i> ${collab.receiver_email}
                            </div>
                            ${collab.receiver_profile && collab.receiver_profile.phone ? `
                                <div class="collab-contact">
                                    <i class="fas fa-phone"></i> ${collab.receiver_profile.phone}
                                </div>
                            ` : ''}
                        ` : `
                            <div class="collab-contact-privacy">
                                <i class="fas fa-lock"></i> Contact information will be visible once the collaboration is accepted
                            </div>
                        `}
                    </div>
                    <div class="collab-date">
                        <i class="far fa-calendar"></i> Sent on ${formatDate(collab.created_at)}
                    </div>
                    ${collab.status === 'pending' ? `
                        <div class="collab-actions">
                            <button class="btn btn-secondary" onclick="event.stopPropagation(); withdrawCollaboration('${collab.id}')">
                                <i class="fas fa-times"></i> Withdraw
                            </button>
                        </div>
                    ` : ''}
                    ${collab.status === 'accepted' ? `
                        <div class="collab-actions">
                            <button class="btn btn-primary" onclick="event.stopPropagation(); sendEmail('${collab.receiver_email}')">
                                <i class="fas fa-envelope"></i> Send Email
                            </button>
                            ${collab.receiver_profile && collab.receiver_profile.phone ? `
                                <button class="btn btn-success" onclick="event.stopPropagation(); makeCall('${collab.receiver_profile.phone}')">
                                    <i class="fas fa-phone"></i> Call
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    ` : `
        <div class="no-collaborations">
            <i class="fas fa-handshake"></i>
            <h3>No Sent Requests</h3>
            <p>You haven't sent any collaboration requests yet.</p>
        </div>
    `;
  }
  
  // Update received requests
  if (receivedRequestsContainer) {
    receivedRequestsContainer.innerHTML = receivedCollaborations.length > 0 ? `
        <div class="collaborations-container">
            ${receivedCollaborations.map(collab => `
                <div class="collaboration-card ${collab.status}">
                    <div class="collab-header">
                        <h3>Request from: ${collab.sender_profile ? collab.sender_profile.name : 'Unknown User'}</h3>
                        <span class="collab-status ${collab.status}">${collab.status || 'pending'}</span>
                    </div>
                    <div class="collab-message">${collab.message}</div>
                    <div class="collab-details">
                        ${collab.status === 'accepted' ? `
                            <div class="collab-contact">
                                <i class="fas fa-envelope"></i> ${collab.sender_email}
                            </div>
                            ${collab.sender_profile && collab.sender_profile.phone ? `
                                <div class="collab-contact">
                                    <i class="fas fa-phone"></i> ${collab.sender_profile.phone}
                                </div>
                            ` : ''}
                        ` : `
                            <div class="collab-contact-privacy">
                                <i class="fas fa-lock"></i> Contact information will be visible once the collaboration is accepted
                            </div>
                        `}
                    </div>
                    <div class="collab-date">
                        <i class="far fa-calendar"></i> Received on ${formatDate(collab.created_at)}
                    </div>
                    ${collab.status === 'pending' ? `
                        <div class="collab-actions">
                            <button class="btn btn-success" onclick="event.stopPropagation(); acceptCollaboration('${collab.id}')">
                                <i class="fas fa-check"></i> Accept
                            </button>
                            <button class="btn btn-danger" onclick="event.stopPropagation(); declineCollaboration('${collab.id}')">
                                <i class="fas fa-times"></i> Decline
                            </button>
                        </div>
                    ` : ''}
                    ${collab.status === 'accepted' ? `
                        <div class="collab-actions">
                            <button class="btn btn-primary" onclick="event.stopPropagation(); sendEmail('${collab.sender_email}')">
                                <i class="fas fa-envelope"></i> Send Email
                            </button>
                            ${collab.sender_profile && collab.sender_profile.phone ? `
                                <button class="btn btn-success" onclick="event.stopPropagation(); makeCall('${collab.sender_profile.phone}')">
                                    <i class="fas fa-phone"></i> Call
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    ` : `
        <div class="no-collaborations">
            <i class="fas fa-handshake"></i>
            <h3>No Received Requests</h3>
            <p>You haven't received any collaboration requests yet.</p>
        </div>
    `;
  }
}

function formatDate(dateString) {
  if (!dateString) return "Unknown date";

  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString(undefined, options);
}

window.showIdeaModal = async function (ideaId) {
  const idea = allIdeas.find((i) => i.id === ideaId);
  if (!idea) return;

  const ideaModalBody = document.getElementById("ideaModalBody");

  const categoryClass = getCategoryClass(idea.category);

  ideaModalBody.innerHTML = `
        <h2>${escapeHtml(idea.title)}</h2>
        <div class="badge ${categoryClass}">${escapeHtml(
    idea.category || "Not specified"
  )}</div>
        <p><strong>Problem:</strong> ${escapeHtml(
          idea.problem || "Not specified"
        )}</p>
        <p><strong>Target Audience:</strong> ${escapeHtml(
          idea.target_audience || "Not specified"
        )}</p>
        <p><strong>Description:</strong> ${escapeHtml(idea.description)}</p>
        ${
          idea.file_url
            ? `<p><a href="${idea.file_url}" target="_blank">View File</a></p>`
            : ""
        }
        <p><em>By ${escapeHtml(idea.name || "Anonymous")}</em></p>
        
        <div class="idea-stats">
            <div class="stat-item">
                <i class="far fa-heart"></i>
                <span>${idea.like_count || 0} likes</span>
            </div>
            <div class="stat-item">
                <i class="far fa-comment"></i>
                <span>${idea.comment_count || 0} comments</span>
            </div>
        </div>
        
        <div class="comments-section">
            <h3><i class="fas fa-comments"></i> Comments</h3>
            <div id="idea-comments-container" class="comments-container">
                <!-- Comments will be loaded here -->
            </div>
            
            <div class="comment-form-container">
                <h4>Add a Comment</h4>
                <form id="idea-comment-form">
                    <div class="form-group">
                        <input type="text" id="idea-comment-name" placeholder="Your Name" required>
                    </div>
                    <div class="form-group">
                        <textarea id="idea-comment-text" placeholder="Your Comment" rows="3" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Post Comment
                    </button>
                </form>
            </div>
        </div>
    `;

  ideaModal.style.display = "flex";

  fetchIdeaComments(ideaId);

  const commentForm = document.getElementById("idea-comment-form");
  if (commentForm) {
    commentForm.onsubmit = function (e) {
      e.preventDefault();
      submitIdeaComment(ideaId);
    };
  }
};

window.showProblemModal = async function (problemId) {
  const problem = allProblems.find((p) => p.id === problemId);
  if (!problem) return;

  const problemModalBody = document.getElementById("problemModalBody");

  const categoryClass = getCategoryClass(problem.category);

  problemModalBody.innerHTML = `
        <h2>${escapeHtml(problem.title)}</h2>
        <div class="badge ${categoryClass}">${escapeHtml(
    problem.category || "Not specified"
  )}</div>
        <p><strong>Affected Audience:</strong> ${escapeHtml(
          problem.affected_audience || "Not specified"
        )}</p>
        <p><strong>Description:</strong> ${escapeHtml(problem.description)}</p>
        ${
          problem.file_url
            ? `<p><a href="${problem.file_url}" target="_blank">View File</a></p>`
            : ""
        }
        <p><em>By ${escapeHtml(problem.name || "Anonymous")}</em></p>
    `;

  problemModal.style.display = "flex";
};

window.closeModal = function (modalId) {
  document.getElementById(modalId).style.display = "none";
};

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

async function fetchIdeaComments(ideaId) {
  const commentsContainer = document.getElementById("idea-comments-container");

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
                    <span class="comment-date">${formatDate(
                      comment.created_at
                    )}</span>
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

async function submitIdeaComment(ideaId) {
  const nameInput = document.getElementById("idea-comment-name");
  const commentInput = document.getElementById("idea-comment-text");

  const name = nameInput.value.trim();
  const commentText = commentInput.value.trim();

  if (!name || !commentText) {
    showNotification("Please fill in all fields", "error");
    return;
  }

  try {
    const submitButton = document.querySelector(
      '#idea-comment-form button[type="submit"]'
    );
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Posting...';

    const { data, error } = await supabase.from("comments").insert([
      {
        idea_id: ideaId,
        name: name,
        comment: commentText,
      },
    ]);

    if (error) throw error;

    nameInput.value = "";
    commentInput.value = "";

    await fetchIdeaComments(ideaId);
    showNotification("Comment posted successfully!", "success");
  } catch (error) {
    console.error("Error submitting comment:", error);
    showNotification(
      "Unable to post comment. Please try again later.",
      "error"
    );
  } finally {
    const submitButton = document.querySelector(
      '#idea-comment-form button[type="submit"]'
    );
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Post Comment';
  }
}

window.editIdea = function (ideaId) {
  event.stopPropagation();
  const idea = allIdeas.find((i) => i.id === ideaId);
  if (!idea) return;

  const formContainer = document.getElementById("editIdeaFormContainer");

  formContainer.innerHTML = `
        <form id="edit-idea-form">
            <div class="edit-form-group">
                <label for="edit-title">Title <span class="required">*</span></label>
                <input type="text" id="edit-title" value="${escapeHtml(
                  idea.title || ""
                )}" required>
            </div>
            <div class="edit-form-group">
                <label for="edit-category">Category <span class="required">*</span></label>
                <select id="edit-category" required>
                    <option value="Electronics" ${
                      idea.category === "Electronics" ? "selected" : ""
                    }>Electronics</option>
                    <option value="Ai" ${
                      idea.category === "Ai" ? "selected" : ""
                    }>AI</option>
                    <option value="Health" ${
                      idea.category === "Health" ? "selected" : ""
                    }>Health</option>
                    <option value="Education" ${
                      idea.category === "Education" ? "selected" : ""
                    }>Education</option>
                    <option value="Finance" ${
                      idea.category === "Finance" ? "selected" : ""
                    }>Finance</option>
                    <option value="Other" ${
                      idea.category === "Other" ? "selected" : ""
                    }>Other</option>
                </select>
            </div>
            <div class="edit-form-group">
                <label for="edit-problem">Problem <span class="required">*</span></label>
                <textarea id="edit-problem" rows="3" required>${escapeHtml(
                  idea.problem || ""
                )}</textarea>
            </div>
            <div class="edit-form-group">
                <label for="edit-audience">Target Audience <span class="required">*</span></label>
                <input type="text" id="edit-audience" value="${escapeHtml(
                  idea.target_audience || ""
                )}" required>
            </div>
            <div class="edit-form-group">
                <label for="edit-description">Description <span class="required">*</span></label>
                <textarea id="edit-description" rows="4" required>${escapeHtml(
                  idea.description || ""
                )}</textarea>
            </div>
            <div class="edit-modal-actions">
                <button type="button" class="btn-cancel" onclick="closeEditIdeaModal()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="btn-save" id="saveIdeaBtn">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </form>
    `;

  document.getElementById("editIdeaModal").style.display = "flex";

  const editForm = document.getElementById("edit-idea-form");
  if (editForm) {
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveIdeaEdit(ideaId);
    });
  }
};

window.editProblem = function (problemId) {
  event.stopPropagation();
  const problem = allProblems.find((p) => p.id === problemId);
  if (!problem) return;

  const formContainer = document.getElementById("editProblemFormContainer");

  formContainer.innerHTML = `
        <form id="edit-problem-form">
            <div class="edit-form-group">
                <label for="edit-problem-title">Title <span class="required">*</span></label>
                <input type="text" id="edit-problem-title" value="${escapeHtml(
                  problem.title || ""
                )}" required>
            </div>
            <div class="edit-form-group">
                <label for="edit-problem-category">Category <span class="required">*</span></label>
                <select id="edit-problem-category" required>
                    <option value="Electronics" ${
                      problem.category === "Electronics" ? "selected" : ""
                    }>Electronics</option>
                    <option value="Ai" ${
                      problem.category === "Ai" ? "selected" : ""
                    }>AI</option>
                    <option value="Health" ${
                      problem.category === "Health" ? "selected" : ""
                    }>Health</option>
                    <option value="Education" ${
                      problem.category === "Education" ? "selected" : ""
                    }>Education</option>
                    <option value="Finance" ${
                      problem.category === "Finance" ? "selected" : ""
                    }>Finance</option>
                    <option value="Other" ${
                      problem.category === "Other" ? "selected" : ""
                    }>Other</option>
                </select>
            </div>
            <div class="edit-form-group">
                <label for="edit-affected-audience">Affected Audience <span class="required">*</span></label>
                <input type="text" id="edit-affected-audience" value="${escapeHtml(
                  problem.affected_audience || ""
                )}" required>
            </div>
            <div class="edit-form-group">
                <label for="edit-problem-description">Description <span class="required">*</span></label>
                <textarea id="edit-problem-description" rows="4" required>${escapeHtml(
                  problem.description || ""
                )}</textarea>
            </div>
            <div class="edit-modal-actions">
                <button type="button" class="btn-cancel" onclick="closeEditProblemModal()">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="btn-save" id="saveProblemBtn">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </form>
    `;

  document.getElementById("editProblemModal").style.display = "flex";

  const editForm = document.getElementById("edit-problem-form");
  if (editForm) {
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveProblemEdit(problemId);
    });
  }
};

window.closeEditIdeaModal = function () {
  document.getElementById("editIdeaModal").style.display = "none";
};

window.closeEditProblemModal = function () {
  document.getElementById("editProblemModal").style.display = "none";
};

async function saveIdeaEdit(ideaId) {
  try {
    const saveBtn = document.getElementById("saveIdeaBtn");
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const title = document.getElementById("edit-title").value.trim();
    const category = document.getElementById("edit-category").value;
    const problem = document.getElementById("edit-problem").value.trim();
    const targetAudience = document
      .getElementById("edit-audience")
      .value.trim();
    const description = document
      .getElementById("edit-description")
      .value.trim();

    if (!title || !category || !problem || !targetAudience || !description) {
      showNotification("Please fill in all required fields.", "error");
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
      return;
    }

    const { error } = await supabase
      .from("public_ideas")
      .update({
        title: title,
        category: category,
        problem: problem,
        target_audience: targetAudience,
        description: description,
      })
      .eq("id", ideaId);

    if (error) {
      throw error;
    }

    showNotification("Idea updated successfully!", "success");
    closeEditIdeaModal();

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error("Error updating idea:", error);
    showNotification(
      "There was an error updating your idea. Please try again.",
      "error"
    );
    const saveBtn = document.getElementById("saveIdeaBtn");
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  }
}

async function saveProblemEdit(problemId) {
  try {
    const saveBtn = document.getElementById("saveProblemBtn");
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const title = document.getElementById("edit-problem-title").value.trim();
    const category = document.getElementById("edit-problem-category").value;
    const affectedAudience = document
      .getElementById("edit-affected-audience")
      .value.trim();
    const description = document
      .getElementById("edit-problem-description")
      .value.trim();

    if (!title || !category || !affectedAudience || !description) {
      showNotification("Please fill in all required fields.", "error");
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
      return;
    }

    const { error } = await supabase
      .from("problems")
      .update({
        title: title,
        category: category,
        affected_audience: affectedAudience,
        description: description,
      })
      .eq("id", problemId);

    if (error) {
      throw error;
    }

    showNotification("Problem updated successfully!", "success");
    closeEditProblemModal();

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error("Error updating problem:", error);
    showNotification(
      "There was an error updating your problem. Please try again.",
      "error"
    );
    const saveBtn = document.getElementById("saveProblemBtn");
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  }
}

window.deleteIdea = async function (ideaId) {
  event.stopPropagation();
  const confirmDelete = confirm(
    "Are you sure you want to delete this idea? This action cannot be undone."
  );

  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from("public_ideas")
      .delete()
      .eq("id", ideaId);

    if (error) {
      throw error;
    }

    showNotification("Idea deleted successfully!", "success");

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error("Error deleting idea:", error);
    showNotification(
      "There was an error deleting your idea. Please try again.",
      "error"
    );
  }
};

window.deleteProblem = async function (problemId) {
  event.stopPropagation();
  const confirmDelete = confirm(
    "Are you sure you want to delete this problem? This action cannot be undone."
  );

  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from("problems")
      .delete()
      .eq("id", problemId);

    if (error) {
      throw error;
    }

    showNotification("Problem deleted successfully!", "success");

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error("Error deleting problem:", error);
    showNotification(
      "There was an error deleting your problem. Please try again.",
      "error"
    );
  }
};

async function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!name || !email) {
    showNotification("Please fill in all required fields.", "error");
    return;
  }

  profileContent.innerHTML = '<div class="loading">Saving changes...</div>';

  try {
    const { error } = await supabase
      .from("profile")
      .update({
        name: name,
        phone: phone,
        description: description,
      })
      .eq("email", email);

    if (error) {
      throw error;
    }

    showNotification("Profile updated successfully!", "success");

    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error("Error updating profile:", error);
    profileContent.innerHTML = `
            <div class="error">
                <h2>Error Updating Profile</h2>
                <p>There was an error updating your profile. Please try again.</p>
                <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
            </div>
        `;
  }
}

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

window.onclick = (e) => {
  if (e.target === ideaModal) {
    ideaModal.style.display = "none";
  }
  if (e.target === problemModal) {
    problemModal.style.display = "none";
  }

  const editIdeaModal = document.getElementById("editIdeaModal");
  const editProblemModal = document.getElementById("editProblemModal");

  if (e.target === editIdeaModal) {
    closeEditIdeaModal();
  }
  if (e.target === editProblemModal) {
    closeEditProblemModal();
  }
};

document.addEventListener("DOMContentLoaded", async function () {
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });
  }

  const userEmail = localStorage.getItem("userEmail");

  console.log("User email from localStorage:", userEmail);

  if (!userEmail) {
    profileContent.innerHTML = `
            <div class="error">
                <h2>Authentication Required</h2>
                <p>You need to be logged in to view your profile.</p>
                <button class="btn" onclick="window.location.href='login.html'">Login</button>
            </div>
        `;
    return;
  }

  try {
    const [profile, ideas, problems, sentCollabs, receivedCollabs] = await Promise.all([
      fetchUserProfileByEmail(userEmail),
      fetchUserIdeas(userEmail),
      fetchUserProblems(userEmail),
      fetchSentCollaborations(userEmail),
      fetchReceivedCollaborations(userEmail),
    ]);

    console.log("Profile:", profile);
    console.log("Ideas:", ideas);
    console.log("Problems:", problems);
    console.log("Sent Collaborations:", sentCollabs);
    console.log("Received Collaborations:", receivedCollabs);

    displayProfileContent(profile, ideas, problems);
  } catch (error) {
    console.error("Error loading user profile, ideas, and problems:", error);
    profileContent.innerHTML = `
            <div class="error">
                <h2>Error Loading Profile</h2>
                <p>There was an error loading your profile. Please try again later.</p>
                <button class="btn btn-secondary" onclick="location.reload()">Retry</button>
            </div>
        `;
  }
});

window.handleLogout = function () {
  const confirmLogout = confirm("Are you sure you want to logout?");
  if (confirmLogout) {
    localStorage.clear()
    sessionStorage.clear();
    window.location.href = "login.html";
  }
};