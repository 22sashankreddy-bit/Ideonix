// Hamburger menu functionality
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });
  }
});

// Initialize Vanta.js background with error handling
window.addEventListener("load", function () {
  try {
    if (typeof VANTA !== "undefined") {
      VANTA.WAVES({
        el: "#vanta-bg",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x1e3a8a,
        shininess: 23.0,
        waveHeight: 14.0,
        waveSpeed: 0.75,
        zoom: 1.05,
      });
    } else {
      console.error(
        "VANTA is not defined. The library may not have loaded properly."
      );
      // Fallback background color
      const vantaBg = document.getElementById("vanta-bg");
      if (vantaBg) {
        vantaBg.style.background =
          "linear-gradient(135deg, #0a192f 0%, #172a45 100%)";
      }
    }
  } catch (error) {
    console.error("Error initializing VANTA:", error);
    // Fallback background color
    const vantaBg = document.getElementById("vanta-bg");
    if (vantaBg) {
      vantaBg.style.background =
        "linear-gradient(135deg, #0a192f 0%, #172a45 100%)";
    }
  }
});

// --- SAFETY CHECK ---
// Ensure the Supabase library is loaded before trying to use it.
if (typeof supabase === "undefined") {
  console.error(
    "Supabase library is not loaded. Please include the Supabase JS script in your HTML."
  );
  // Optionally, display an error message to the user on the page.
  const statusDiv = document.getElementById("status");
  if (statusDiv) {
    statusDiv.innerHTML =
      '<p style="color: #ff6b6b;">❌ A critical library failed to load. Please refresh the page.</p>';
  }
  // Stop execution of the rest of the script
  throw new Error("Supabase library not found.");
}

// Supabase configuration - Auth project (uza)
const SUPABASE_AUTH_URL = "https://uzaxcjeiwwnunadopkhl.supabase.co";
const SUPABASE_AUTH_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YXhjamVpd3dudW5hZG9wa2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzk1MDMsImV4cCI6MjA3Mjc1NTUwM30.e1y42NHTsn7S5jeOiyLzEdHrHhjBSMLXamA1NdA3hck";

// Supabase configuration - Database project (xar)
const SUPABASE_DB_URL = "https://xarlawzvqwupgxlwadsj.supabase.co";
const SUPABASE_DB_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU";

// Create clients for auth and database
const authClient = supabase.createClient(
  SUPABASE_AUTH_URL,
  SUPABASE_AUTH_ANON_KEY
);
const dbClient = supabase.createClient(SUPABASE_DB_URL, SUPABASE_DB_ANON_KEY);

// Get DOM elements
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("number");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const signupBtn = document.getElementById("signup-btn");
const statusDiv = document.getElementById("status");

// Add input validation feedback
if (emailInput) {
  emailInput.addEventListener("blur", function () {
    const email = this.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailRegex.test(email)) {
      this.style.borderColor = "#ff6b6b";
    } else if (email) {
      this.style.borderColor = "#51cf66";
    }
  });
}

if (passwordInput) {
  passwordInput.addEventListener("input", function () {
    const password = this.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password.length < 6) {
      this.style.borderColor = "#ff6b6b";
    } else {
      this.style.borderColor = "#51cf66";
    }

    // Check confirm password match
    if (confirmPassword && password !== confirmPassword) {
      confirmPasswordInput.style.borderColor = "#ff6b6b";
    } else if (confirmPassword) {
      confirmPasswordInput.style.borderColor = "#51cf66";
    }
  });
}

if (confirmPasswordInput) {
  confirmPasswordInput.addEventListener("input", function () {
    const password = passwordInput.value;
    const confirmPassword = this.value;

    if (password !== confirmPassword) {
      this.style.borderColor = "#ff6b6b";
    } else {
      this.style.borderColor = "#51cf66";
    }
  });
}

if (phoneInput) {
  phoneInput.addEventListener("blur", function () {
    const number = this.value;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;

    if (number && (!phoneRegex.test(number) || number.length < 10)) {
      this.style.borderColor = "#ff6b6b";
    } else if (number) {
      this.style.borderColor = "#51cf66";
    }
  });
}

// Function to create user profile in the database
async function createUserProfile(userId, name, email, phone) {
  try {
    const { data, error } = await dbClient.from("profile").insert([
      {
        id: userId,
        name: name,
        email: email,
        phone: phone,
      },
    ]);

    if (error) {
      console.error("Error creating profile:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Unexpected error creating profile:", err);
    return { success: false, error: "Failed to create user profile" };
  }
}

// Signup button click handler
if (signupBtn) {
  signupBtn.onclick = async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Reset status
    statusDiv.innerHTML = "";

    // Validate all fields are filled
    if (!name || !email || !phone || !password || !confirmPassword) {
      statusDiv.innerHTML =
        '<p style="color: #ff6b6b;">❌ All fields are required.</p>';
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      statusDiv.innerHTML =
        '<p style="color: #ff6b6b;">❌ Passwords do not match.</p>';
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      statusDiv.innerHTML =
        '<p style="color: #ff6b6b;">❌ Please enter a valid email address.</p>';
      return;
    }

    // Validate phone number
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, "").length < 10) {
      statusDiv.innerHTML =
        '<p style="color: #ff6b6b;">❌ Please enter a valid phone number.</p>';
      return;
    }

    // Validate password length
    if (password.length < 6) {
      statusDiv.innerHTML =
        '<p style="color: #ff6b6b;">❌ Password must be at least 6 characters.</p>';
      return;
    }

    // Show loading state
    signupBtn.disabled = true;
    signupBtn.textContent = "Creating Account...";
    statusDiv.innerHTML =
      '<p style="color: #a78bfa;">Processing your request...</p>';

    try {
      // Sign up with Supabase Auth
      const { data, error } = await authClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          },
          emailRedirectTo:
            "https://22sashankreddy-bit.github.io/Ideonix/login.html",
        },
      });

      if (error) {
        statusDiv.innerHTML = `<p style="color: #ff6b6b;">❌ ${error.message}</p>`;
      } else if (data.user) {
        // Create user profile in the separate database
        const profileResult = await createUserProfile(
          data.user.id,
          name,
          email,
          phone
        );

        if (!profileResult.success) {
          statusDiv.innerHTML = `<p style="color: #ff6b6b;">❌ Account created but profile setup failed: ${profileResult.error}</p>`;
        } else {
          // Clear form
          nameInput.value = "";
          emailInput.value = "";
          phoneInput.value = "";
          passwordInput.value = "";
          confirmPasswordInput.value = "";

          // Show success message
          statusDiv.innerHTML = `
            <p style="color: #51cf66;">✅ Verification email sent!</p>
            <p style="color: rgba(255,255,255,0.8);">📩 After verifying, click below to log in.</p>
            <button style="margin-top: 15px; padding: 10px 20px; background: linear-gradient(135deg, #0b4fbd 0%, #1e3a8a 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;" onclick="window.location.href='login.html'">Log In</button>
          `;
        }
      }
    } catch (err) {
      statusDiv.innerHTML = `<p style="color: #ff6b6b;">❌ An unexpected error occurred. Please try again.</p>`;
      console.error("Signup error:", err);
    } finally {
      // Reset button state
      signupBtn.disabled = false;
      signupBtn.textContent = "Sign Up";
    }
  };
}
