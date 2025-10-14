


const SUPABASE_URL = "https://uzaxcjeiwwnunadopkhl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YXhjamVpd3dudW5hZG9wa2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzk1MDMsImV4cCI6MjA3Mjc1NTUwM30.e1y42NHTsn7S5jeOiyLzEdHrHhjBSMLXamA1NdA3hck";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const statusDiv = document.getElementById("status");

window.onload = () => {
  const storedEmail = localStorage.getItem("userEmail");
  if (storedEmail) {
    emailInput.value = storedEmail;
  }
};

loginBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  statusDiv.innerHTML = "";

  if (!email || !password) {
    statusDiv.innerHTML = "❌ Both fields are required.";
    return;
  }

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    statusDiv.innerHTML = `❌ ${error.message}`;
  } else {
    statusDiv.innerHTML = "✅ Logged in! Redirecting...";

    localStorage.setItem("userEmail", email);

    emailInput.value = "";
    passwordInput.value = "";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  }
};
