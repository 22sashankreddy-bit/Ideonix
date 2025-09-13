const SUPABASE_URL = "https://uzaxcjeiwwnunadopkhl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YXhjamVpd3dudW5hZG9wa2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzk1MDMsImV4cCI6MjA3Mjc1NTUwM30.e1y42NHTsn7S5jeOiyLzEdHrHhjBSMLXamA1NdA3hck"; // use full key

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const signupBtn = document.getElementById("signup-btn");
const statusDiv = document.getElementById("status");

signupBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  statusDiv.innerHTML = "";

  if (!email || !password || !confirmPassword) {
    statusDiv.textContent = "❌ All fields are required.";
    return;
  }

  if (password !== confirmPassword) {
    statusDiv.textContent = "❌ Passwords do not match.";
    return;
  }

  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login.html`,
    },
  });

  if (error) {
    statusDiv.textContent = `❌ ${error.message}`;
  } else {
    emailInput.value = "";
    passwordInput.value = "";
    confirmPasswordInput.value = "";

    statusDiv.innerHTML = `
      <p>✅ Verification email sent!</p>
      <p>📩 After verifying, click below to log in.</p>
      <button onclick="location.href='login.html'">Log In</button>
    `;
  }
};
