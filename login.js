const SUPABASE_URL = "https://xarlawzvqwupgxlwadsj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const statusDiv = document.getElementById("status");

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
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  }
};


