document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://vxrmycexspdjqhzrbvut.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_0OTOKGTi1ZjCII6gvRZaFg_-pQgzZZQ";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const signupForm = document.getElementById("signupForm");
  const signupBtn = document.getElementById("signupBtn");
  const signupStatus = document.getElementById("signupStatus");

  function setStatus(message, type) {
    signupStatus.textContent = message;
    signupStatus.classList.remove("success", "error");
    if (type) signupStatus.classList.add(type);
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const full_name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!full_name || !email || !password) {
      setStatus("Please fill all fields.", "error");
      return;
    }

    try {
      signupBtn.disabled = true;
      signupBtn.textContent = "Creating...";
      setStatus("Creating account...", "");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name }
        }
      });

      if (error) {
        setStatus(error.message, "error");
        return;
      }

      const user = data.user;
      if (!user) {
        setStatus("User not returned from signup.", "error");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").upsert([
        {
          id: user.id,
          full_name,
          email,
          status: "active"
        }
      ]);

      if (profileError) {
        setStatus("Auth user created, but profile insert failed: " + profileError.message, "error");
        return;
      }

      setStatus("Signup successful. Redirecting to login...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
    } catch (err) {
      setStatus("Something went wrong.", "error");
      console.error(err);
    } finally {
      signupBtn.disabled = false;
      signupBtn.textContent = "Create Account";
    }
  });
});