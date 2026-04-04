document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://vxrmycexspdjqhzrbvut.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_0OTOKGTi1ZjCII6gvRZaFg_-pQgzZZQ";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  const welcomeText = document.getElementById("welcomeText");
  const userEmail = document.getElementById("userEmail");
  const logoutBtn = document.getElementById("logoutBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const pageStatus = document.getElementById("pageStatus");

  const xpValue = document.getElementById("xpValue");
  const courseCount = document.getElementById("courseCount");
  const progressValue = document.getElementById("progressValue");

  const profileName = document.getElementById("profileName");
  const profileStatus = document.getElementById("profileStatus");
  const profileRole = document.getElementById("profileRole");

  const latestProgress = document.getElementById("latestProgress");
  const latestCourseCount = document.getElementById("latestCourseCount");
  const xpStatusText = document.getElementById("xpStatusText");

  const coursesContainer = document.getElementById("coursesContainer");
  const progressContainer = document.getElementById("progressContainer");

  function setPageStatus(message = "", type = "") {
    if (!pageStatus) return;
    pageStatus.textContent = message;
    pageStatus.classList.remove("success", "error");
    if (type) pageStatus.classList.add(type);
  }

  function getXpLabel(totalXp) {
    if (totalXp >= 2500) return "Advanced learner";
    if (totalXp >= 1800) return "High performer";
    if (totalXp >= 1200) return "Consistent learner";
    if (totalXp >= 700) return "Growing fast";
    if (totalXp >= 300) return "Active learner";
    return "Getting started";
  }

  function getProgressLabel(percent) {
    if (percent >= 100) return "Completed";
    if (percent >= 75) return "Almost there";
    if (percent >= 40) return "In progress";
    if (percent > 0) return "Started";
    return "Not started";
  }

  async function getSessionUser() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setPageStatus(sessionError.message, "error");
      return null;
    }

    if (!session) {
      window.location.href = "login.html";
      return null;
    }

    return session.user;
  }

  async function fetchFirstLessonId(courseId) {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, position")
        .eq("course_id", courseId)
        .order("position", { ascending: true })
        .limit(1);

      if (error) {
        console.error("First lesson fetch error:", error);
        return null;
      }

      return data && data.length > 0 ? data[0].id : null;
    } catch (err) {
      console.error("First lesson catch error:", err);
      return null;
    }
  }

  async function fetchCompletedLessonIds(userId, courseId) {
    try {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .eq("status", "completed");

      if (error) {
        console.error("Lesson progress fetch error:", error);
        return [];
      }

      return (data || []).map((row) => row.lesson_id);
    } catch (err) {
      console.error("Lesson progress catch error:", err);
      return [];
    }
  }

  async function renderCourses(enrolledList, progressMap, userId) {
    if (!coursesContainer) return;

    coursesContainer.innerHTML = "";

    if (!enrolledList || enrolledList.length === 0) {
      coursesContainer.innerHTML = `<div class="empty-card">No enrolled courses found.</div>`;
      return;
    }

    for (const item of enrolledList) {
      const course = item.courses;
      if (!course) continue;

      const progressRow = progressMap.get(course.id);
      const percent = Math.floor(Number(progressRow?.progress_percent || 0));
      const progressLabel = getProgressLabel(percent);

      const firstLessonId = await fetchFirstLessonId(course.id);
      const completedLessonIds = await fetchCompletedLessonIds(userId, course.id);
      const alreadyStarted = completedLessonIds.length > 0;

      const card = document.createElement("div");
      card.className = "course-card";

      let actionButton = `
        <button class="secondary-btn course-btn" disabled>No Lesson Found</button>
      `;

      if (firstLessonId) {
        actionButton = `
          <a href="lesson.html?lesson_id=${firstLessonId}&course_id=${course.id}" class="primary-btn course-link-btn">
            ${percent >= 100 ? "Completed" : alreadyStarted ? "Continue Learning" : "Start Learning"}
          </a>
        `;
      }

      card.innerHTML = `
        <h4>${course.title || "Untitled Course"}</h4>
        <p>${course.short_description || "No course description available."}</p>

        <div class="course-meta">
          <span class="meta-pill">${course.category || "General"}</span>
          <span class="meta-pill">${course.difficulty_level || "Beginner"}</span>
          <span class="meta-pill">${course.status || "active"}</span>
        </div>

        <div style="margin-top: 14px;">
          <div class="progress-card-top" style="margin-bottom: 8px;">
            <span>${progressLabel}</span>
            <span class="progress-percent">${percent}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percent}%"></div>
          </div>
        </div>

        <div style="margin-top: 16px;">
          ${actionButton}
        </div>
      `;

      coursesContainer.appendChild(card);
    }
  }

  function renderProgress(enrolledList, progressList) {
    if (!progressContainer) return;

    progressContainer.innerHTML = "";

    if (!progressList || progressList.length === 0) {
      if (progressValue) progressValue.textContent = "0%";
      if (latestProgress) latestProgress.textContent = "0%";
      progressContainer.innerHTML = `<div class="empty-card">No progress records found yet.</div>`;
      return;
    }

    const progressMap = new Map();
    progressList.forEach((row) => {
      progressMap.set(row.course_id, row);
    });

    let totalProgress = 0;
    progressList.forEach((row) => {
      totalProgress += Number(row.progress_percent || 0);
    });

    const averageProgress = Math.floor(totalProgress / progressList.length);

    if (progressValue) progressValue.textContent = `${averageProgress}%`;
    if (latestProgress) latestProgress.textContent = `${averageProgress}%`;

    enrolledList.forEach((item) => {
      const course = item.courses;
      if (!course) return;

      const progressRow = progressMap.get(course.id);
      const percent = Math.floor(Number(progressRow?.progress_percent || 0));

      const progressCard = document.createElement("div");
      progressCard.className = "progress-card";

      progressCard.innerHTML = `
        <div class="progress-card-top">
          <h4>${course.title || "Untitled Course"}</h4>
          <span class="progress-percent">${percent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percent}%"></div>
        </div>
      `;

      progressContainer.appendChild(progressCard);
    });
  }

  async function loadDashboard() {
    try {
      setPageStatus("Loading dashboard...", "");

      const user = await getSessionUser();
      if (!user) return;

      if (userEmail) userEmail.textContent = user.email || "-";

      // PROFILE
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      if (profile) {
        if (welcomeText) {
          welcomeText.textContent = `Welcome, ${profile.full_name || "User"}`;
        }
        if (profileName) profileName.textContent = profile.full_name || "-";
        if (profileStatus) profileStatus.textContent = profile.status || "active";
      } else {
        if (welcomeText) welcomeText.textContent = "Welcome";
        if (profileName) profileName.textContent = user.email || "-";
        if (profileStatus) profileStatus.textContent = "active";
      }

      // ROLES
      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select(`
          role_id,
          roles (
            name,
            slug
          )
        `)
        .eq("user_id", user.id);

      if (!roleError && roleRows && roleRows.length > 0) {
        const firstRole = roleRows[0]?.roles;
        if (profileRole) {
          profileRole.textContent = firstRole?.name || firstRole?.slug || "Student";
        }
      } else {
        if (profileRole) profileRole.textContent = "Student";
      }

      // XP
      const { data: xpData, error: xpError } = await supabase
        .from("user_xp_summary")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      let totalXp = 0;
      if (!xpError && xpData) {
        totalXp = Number(xpData.total_xp || 0);
      }

      if (xpValue) xpValue.textContent = totalXp;
      if (xpStatusText) xpStatusText.textContent = getXpLabel(totalXp);

      // ENROLLMENTS + COURSES
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses (
            id,
            title,
            short_description,
            category,
            difficulty_level,
            status
          )
        `)
        .eq("user_id", user.id);

      if (enrollmentError) {
        console.error("Enrollment error:", enrollmentError);
      }

      const enrolledList = enrollments || [];
      if (courseCount) courseCount.textContent = enrolledList.length;
      if (latestCourseCount) latestCourseCount.textContent = enrolledList.length;

      // COURSE PROGRESS
      const { data: progressRows, error: progressError } = await supabase
        .from("course_progress")
        .select("*")
        .eq("user_id", user.id);

      if (progressError) {
        console.error("Course progress error:", progressError);
      }

      const progressList = progressRows || [];
      const progressMap = new Map();
      progressList.forEach((row) => {
        progressMap.set(row.course_id, row);
      });

      await renderCourses(enrolledList, progressMap, user.id);
      renderProgress(enrolledList, progressList);

      setPageStatus("Dashboard loaded successfully.", "success");
    } catch (error) {
      console.error(error);
      setPageStatus("Something went wrong while loading dashboard.", "error");
    }
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadDashboard);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    });
  }

  loadDashboard();
});