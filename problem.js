// problem.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/+esm";

const SUPABASE_URL = "https://xarlawzvqwupgxlwadsj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhcmxhd3p2cXd1cGd4bHdhZHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NTk3MDAsImV4cCI6MjA3MjIzNTcwMH0.rVXD1x25y9ej8EvnXSXXkiGBQOzK6w9z7VrBRW9p4iU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("problem-form");
const fileInput = document.getElementById("file-upload");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = form["problem-title"].value.trim();
  const description = form["detailed-description"].value.trim();
  const audience = form["affected-audience"].value.trim();
  const category = form["category"].value;
  const name = form["your-name"].value.trim();

  let problemData = {
    title,
    description,
    affected_audience: audience,
    category,
    name,
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
