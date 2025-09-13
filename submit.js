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

// Show/hide custom category field
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

// Function to generate a certificate
function generateCertificate(name, ideaTitle) {
  try {
    // Check if jsPDF is loaded
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

    // Certificate dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add a simple background color
    doc.setFillColor(240, 249, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "FD");

    // Add border
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Add header
    doc.setFontSize(32);
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICATE", pageWidth / 2, 40, { align: "center" });

    doc.setFontSize(20);
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "normal");
    doc.text("OF APPRECIATION", pageWidth / 2, 55, { align: "center" });

    // Add decorative line
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 40, 65, pageWidth / 2 + 40, 65);

    // Add presentation text
    doc.setFontSize(16);
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "italic");
    doc.text("This is to certify that", pageWidth / 2, 85, { align: "center" });

    // Add recipient name
    doc.setFontSize(28);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text(name, pageWidth / 2, 105, { align: "center" });

    // Add contribution text
    doc.setFontSize(16);
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "italic");
    doc.text("has submitted an innovative idea", pageWidth / 2, 125, {
      align: "center",
    });
    doc.text("to the BroCoders community", pageWidth / 2, 140, {
      align: "center",
    });

    // Add idea title
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text("Idea Title:", pageWidth / 2, 160, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "normal");

    // Split long titles into multiple lines
    const maxTitleWidth = pageWidth - 60;
    const titleLines = doc.splitTextToSize(ideaTitle, maxTitleWidth);
    doc.text(titleLines, pageWidth / 2, 175, { align: "center" });

    // Add appreciation text
    doc.setFontSize(14);
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "italic");
    doc.text(
      "This contribution is greatly valued and appreciated.",
      pageWidth / 2,
      195,
      { align: "center" }
    );

    // Add BroCoders branding at the bottom
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.text("BroCoders", pageWidth / 2, pageHeight - 30, { align: "center" });

    // Save the PDF
    const fileName = `${name.replace(/\s+/g, "_")}_BroCoders_Certificate.pdf`;
    doc.save(fileName);

    // Show success message
    console.log("Certificate downloaded successfully");
    alert("Certificate downloaded successfully!");
  } catch (error) {
    console.error("Error generating certificate:", error);
    alert("There was an error generating your certificate. Please try again.");
  }
}

// Function to show improved success modal
function showSuccessModal(name, ideaTitle) {
  // Remove any existing modal
  const existingModal = document.getElementById("successModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal
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

  // Add event listeners using the modal element directly
  const downloadBtn = modal.querySelector("#downloadCertificate");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      generateCertificate(name, ideaTitle);
    });
  }

  const shareBtn = modal.querySelector("#shareIdea");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      // Implement share functionality
      if (navigator.share) {
        navigator.share({
          title: `I just submitted an idea to BroCoders: ${ideaTitle}`,
          text: `Check out my idea "${ideaTitle}" on BroCoders!`,
          url: window.location.origin,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
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

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
      form.reset();
      customCategoryContainer.style.display = "none";
      window.location.href = "dashboard.html";
    }
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const problem = document.getElementById("problem").value.trim();
  const targetAudience = document.getElementById("targetAudience").value.trim();
  const category = categorySelect ? categorySelect.value : null;
  const customCategory = customCategoryInput.value.trim();
  const name = document.getElementById("name").value.trim();

  // Validation
  if (
    !title ||
    !description ||
    !problem ||
    !targetAudience ||
    !category ||
    !name
  ) {
    alert("Please fill in all required fields.");
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

  // Use custom category if selected
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
    },
  ]);

  if (error) {
    alert("❌ Failed to submit idea.");
    console.error(error);
  } else {
    // Show success modal with certificate option
    showSuccessModal(name, title);
  }
});

// Toggle mobile nav
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });
  }
});

// Logout confirmation and redirect
function handleLogout() {
  const confirmLogout = confirm("Are you sure you want to logout?");
  if (confirmLogout) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html"; // Adjust if your login page path is different
  }
}
