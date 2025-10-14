const SUPABASE_URL = "https://xarlawzvqwupgxlwadsj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("publicIdeaForm");
const fileInput = document.getElementById("fileInput");
const categorySelect = document.getElementById("category");
const customCategoryInput = document.getElementById("customCategory");
const customCategoryContainer = document.getElementById(
  "customCategoryContainer"
);

if (categorySelect) {
  categorySelect.addEventListener("change", () => {
    if (categorySelect.value === "other") {
      customCategoryContainer.style.display = "block";
    } else {
      customCategoryContainer.style.display = "none";
      customCategoryInput.value = "";
    }
  });
}

function generateCertificate(name, ideaTitle) {
  try {
    if (
      typeof window.jspdf === "undefined" ||
      typeof window.jspdf.jsPDF === "undefined"
    ) {
      console.error("jsPDF library not loaded");
      alert(
        "Error: Certificate generator not available. Please try again later."
      );
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, pageHeight, "FD");

    const gradientSteps = 15;
    for (let i = 0; i < gradientSteps; i++) {
      const alpha = 0.03 - (i / gradientSteps) * 0.03;
      doc.setFillColor(255, 215, 0, alpha);
      doc.rect(0, 0, pageWidth, pageHeight, "FD");
    }

    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(4);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(1);
    doc.rect(18, 18, pageWidth - 36, pageHeight - 36);

    const cornerSize = 20;
    const corners = [
      { x: 12, y: 12 },
      { x: pageWidth - 12, y: 12 },
      { x: 12, y: pageHeight - 12 },
      { x: pageWidth - 12, y: pageHeight - 12 },
    ];

    corners.forEach((corner) => {
      doc.setDrawColor(255, 215, 0);
      doc.setLineWidth(2);
      doc.line(
        corner.x + (corner.x === 12 ? 0 : -cornerSize),
        corner.y,
        corner.x + (corner.x === 12 ? cornerSize : 0),
        corner.y
      );
      doc.line(
        corner.x,
        corner.y + (corner.y === 12 ? 0 : -cornerSize),
        corner.x,
        corner.y + (corner.y === 12 ? cornerSize : 0)
      );
    });

    doc.setFontSize(48);
    doc.setTextColor(255, 215, 0);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICATE", pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text("OF APPRECIATION", pageWidth / 2, 65, { align: "center" });

    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(1.5);
    doc.line(pageWidth / 2 - 60, 75, pageWidth / 2 + 60, 75);

    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(2);
    doc.circle(pageWidth / 2, 90, 12);

    doc.setFillColor(255, 215, 0);
    doc.circle(pageWidth / 2, 90, 8, "FD");

    doc.setFillColor(30, 58, 138);
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.setFont("helvetica", "bold");
    doc.text("I", pageWidth / 2, 95, { align: "center" });

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "italic");
    doc.text("This is to certify that", pageWidth / 2, 115, {
      align: "center",
    });

    doc.setFontSize(36);
    doc.setTextColor(255, 215, 0);
    doc.setFont("helvetica", "bold");
    doc.text(name, pageWidth / 2, 140, { align: "center" });

    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(1);
    const nameWidth = doc.getTextWidth(name);
    doc.line(
      pageWidth / 2 - nameWidth / 2,
      145,
      pageWidth / 2 + nameWidth / 2,
      145
    );

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "italic");
    doc.text("has submitted an innovative idea", pageWidth / 2, 165, {
      align: "center",
    });
    doc.text("to the Ideonix community", pageWidth / 2, 185, {
      align: "center",
    });

    const maxTitleWidth = pageWidth - 80;
    const titleLines = doc.splitTextToSize(ideaTitle, maxTitleWidth);
    const lineHeight = 8;
    const startY = 230;

    titleLines.forEach((line, index) => {
      doc.text(line, pageWidth / 2, startY + index * lineHeight, {
        align: "center",
      });
    });

    const nextYPosition = startY + titleLines.length * lineHeight + 15;

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "italic");
    doc.text(
      "This contribution is greatly valued and appreciated.",
      pageWidth / 2,
      nextYPosition,
      { align: "center" }
    );

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${dateStr}`, pageWidth - 60, pageHeight - 35, {
      align: "right",
    });

    doc.setFontSize(24);
    doc.setTextColor(255, 215, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Ideonix", pageWidth / 2, pageHeight - 35, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "italic");
    doc.text("Innovation Community", pageWidth / 2, pageHeight - 20, {
      align: "center",
    });

    doc.setDrawColor(255, 215, 0);
    doc.setLineWidth(2);
    doc.circle(60, pageHeight - 30, 15);

    doc.setFillColor(255, 215, 0);
    doc.circle(60, pageHeight - 30, 10, "FD");

    doc.setFillColor(30, 58, 138);
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.setFont("helvetica", "bold");
    doc.text("✓", 60, pageHeight - 25, { align: "center" });

    const fileName = `${name.replace(/\s+/g, "_")}_Ideonix_Certificate.pdf`;
    doc.save(fileName);

    console.log("Certificate downloaded successfully");
    alert("Certificate downloaded successfully!");
  } catch (error) {
    console.error("Error generating certificate:", error);
    alert("There was an error generating your certificate. Please try again.");
  }
}

function showSuccessModal(name, ideaTitle) {
  const existingModal = document.getElementById("successModal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.id = "successModal";
  modal.className = "success-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>Idea Submitted Successfully!</h2>
        <p>Your contribution has been received and is being reviewed by our community.</p>
      </div>
      <div class="modal-body">
        <div class="submission-details">
          <div class="detail-item">
            <i class="fas fa-user"></i>
            <div>
              <h4>Submitted By</h4>
              <p>${name}</p>
            </div>
          </div>
          <div class="detail-item">
            <i class="fas fa-lightbulb"></i>
            <div>
              <h4>Idea Title</h4>
              <p>${ideaTitle}</p>
            </div>
          </div>
          <div class="detail-item">
            <i class="fas fa-calendar"></i>
            <div>
              <h4>Submission Date</h4>
              <p>${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</p>
            </div>
          </div>
        </div>
        
        <div class="certificate-section">
          <div class="certificate-preview">
            <div class="certificate-icon">
              <i class="fas fa-certificate"></i>
            </div>
            <h3>Certificate of Appreciation</h3>
            <p>Download a personalized certificate to commemorate your valuable contribution to our community.</p>
            <div class="certificate-features">
              <div class="feature">
                <i class="fas fa-star"></i>
                <span>Professional Design</span>
              </div>
              <div class="feature">
                <i class="fas fa-user-check"></i>
                <span>Personalized with Your Name</span>
              </div>
              <div class="feature">
                <i class="fas fa-download"></i>
                <span>Instant Download</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button id="downloadCertificate" class="btn btn-primary">
          <i class="fas fa-download"></i> Download Certificate
        </button>
        <button id="shareIdea" class="btn btn-secondary">
          <i class="fas fa-share-alt"></i> Share Your Idea
        </button>
        <button id="closeModal" class="btn btn-text">
          <i class="fas fa-times"></i> Close
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const downloadBtn = modal.querySelector("#downloadCertificate");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      generateCertificate(name, ideaTitle);
    });
  }

  const shareBtn = modal.querySelector("#shareIdea");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      if (navigator.share) {
        navigator.share({
          title: `I just submitted an idea to Ideonix: ${ideaTitle}`,
          text: `Check out my idea "${ideaTitle}" on Ideonix!`,
          url: window.location.origin,
        });
      } else {
        alert("Share functionality is not supported in your browser.");
      }
    });
  }

  const closeBtn = modal.querySelector("#closeModal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.remove();
      form.reset();
      customCategoryContainer.style.display = "none";
      window.location.href = "dashboard.html";
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
      form.reset();
      customCategoryContainer.style.display = "none";
      window.location.href = "dashboard.html";
    }
  });
}

async function fetchUserProfileByEmail(email) {
  if (!email) {
    console.log("No email provided to fetchUserProfileByEmail.");
    return null;
  }
  try {
    const { data, error } = await supabaseClient
      .from("profile")
      .select("name")
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

document.addEventListener("DOMContentLoaded", async function () {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });
  }

  const userEmail = localStorage.getItem("userEmail");
  const nameInput = document.getElementById("name");

  if (userEmail && nameInput) {
    fetchUserProfileByEmail(userEmail)
      .then((profile) => {
        if (profile && profile.name) {
          nameInput.value = profile.name;
          nameInput.readOnly = true;
          nameInput.style.backgroundColor = "#f5f5f5";
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
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const problem = document.getElementById("problem").value.trim();
  const targetAudience = document.getElementById("targetAudience").value.trim();
  const category = categorySelect ? categorySelect.value : null;
  const customCategory = customCategoryInput.value.trim();
  let name = document.getElementById("name").value.trim();

  const userEmail = localStorage.getItem("userEmail");

  if (!name && userEmail) {
    try {
      const profile = await fetchUserProfileByEmail(userEmail);
      if (profile && profile.name) {
        name = profile.name;
        document.getElementById("name").value = name;
        const nameInput = document.getElementById("name");
        nameInput.readOnly = true;
        nameInput.style.backgroundColor = "#f5f5f5";
      }
    } catch (error) {
      console.error(
        "Error fetching user profile by email during form submission:",
        error
      );
    }
  }

  if (
    !title ||
    !description ||
    !problem ||
    !targetAudience ||
    !category ||
    !name ||
    !userEmail
  ) {
    alert("Please fill in all required fields, including your name.");
    return;
  }

  if (category === "other") {
    if (!customCategory) {
      alert("Please enter a custom category name.");
      return;
    }
    if (customCategory.length > 20) {
      alert("Custom category must be under 20 characters.");
      return;
    }
  }

  let fileUrl = null;
  const file = fileInput.files[0];
  if (file) {
    const filePath = `public-files/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } =
      await supabaseClient.storage.from("public-files").upload(filePath, file, {
        contentType: file.type,
      });

    if (uploadError) {
      alert("❌ File upload failed.");
      console.error(uploadError);
      return;
    }

    const { data: publicURLData } = supabaseClient.storage
      .from("public-files")
      .getPublicUrl(filePath);
    fileUrl = publicURLData.publicUrl;
  }

  const finalCategory = category === "other" ? customCategory : category;

  const { error } = await supabaseClient.from("public_ideas").insert([
    {
      title,
      description,
      problem,
      target_audience: targetAudience,
      category: finalCategory,
      file_url: fileUrl,
      name: name || null,
      email: userEmail,
    },
  ]);

  if (error) {
    alert("❌ Failed to submit idea.");
    console.error(error);
  } else {
    showSuccessModal(name, title);
  }
});

function handleLogout() {
  const confirmLogout = confirm("Are you sure you want to logout?");
  if (confirmLogout) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  }
}