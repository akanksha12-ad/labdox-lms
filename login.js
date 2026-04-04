document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://vxrmycexspdjqhzrbvut.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_0OTOKGTi1ZjCII6gvRZaFg_-pQgzZZQ";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const loginStatus = document.getElementById("loginStatus");

  function setStatus(message, type) {
    loginStatus.textContent = message;
    loginStatus.classList.remove("success", "error");
    if (type) loginStatus.classList.add(type);
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      setStatus("Please enter email and password.", "error");
      return;
    }

    try {
      loginBtn.disabled = true;
      loginBtn.textContent = "Logging in...";
      setStatus("Checking credentials...", "");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log("FULL LOGIN DATA:", data);
      console.log("FULL LOGIN ERROR:", error);
      alert(error ? JSON.stringify(error, null, 2) : "Login success");

      if (error) {
        setStatus(error.message, "error");
        return;
      }

      setStatus("Login successful. Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (err) {
      console.error("CATCH ERROR:", err);
      alert("CATCH ERROR: " + JSON.stringify(err, null, 2));
      setStatus("Something went wrong. Please try again.", "error");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
});