import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm";

const SUPABASE_URL = "https://xarlawzvqwupgxlwadsj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("problem-form");
const fileInput = document.getElementById("file-upload");

async function fetchUserProfileByEmail(email) {
  if (!email) {
    console.log("No email provided to fetchUserProfileByEmail.");
    return null;
  }
  try {
    const { data, error } = await supabase
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
  const userEmail = localStorage.getItem("userEmail");
  const nameInput = form["your-name"];

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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = form["problem-title"].value.trim();
  const description = form["detailed-description"].value.trim();
  const audience = form["affected-audience"].value.trim();
  const category = form["category"].value;
  let name = form["your-name"].value.trim();
  
  const userEmail = localStorage.getItem("userEmail");

  if (!name && userEmail) {
    try {
      const profile = await fetchUserProfileByEmail(userEmail);
      if (profile && profile.name) {
        name = profile.name;
        form["your-name"].value = name;
        const nameInput = form["your-name"];
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

  if (!title || !description || !audience || !category || !name || !userEmail) {
    alert("Please fill in all required fields, including your name.");
    return;
  }

  let problemData = {
    title,
    description,
    affected_audience: audience,
    category,
    name,
    email: userEmail,
    file_url: null,
    created_at: new Date().toISOString(),
  };

  try {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = `problem-files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("public-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("public-files").getPublicUrl(filePath);

      problemData.file_url = publicUrl;
    }

    const { data, error } = await supabase
      .from("problems")
      .insert([problemData]);

    if (error) throw error;

    alert(
      "✅ Problem submitted successfully! Thank you for your contribution."
    );
    form.reset();
  } catch (error) {
    alert(`❌ Error submitting problem: ${error.message}`);
    console.error(error);
  }
});