document.addEventListener("DOMContentLoaded", async () => {
  const SUPABASE_URL = "https://vxrmycexspdjqhzrbvut.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_0OTOKGTi1ZjCII6gvRZaFg_-pQgzZZQ";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  const lessonTitle = document.getElementById("lessonTitle");
  const lessonDesc = document.getElementById("lessonDesc");
  const lessonStatus = document.getElementById("lessonStatus");
  const completeBtn = document.getElementById("completeBtn");
  const startBtn = document.getElementById("startBtn");
  const backBtn = document.getElementById("backBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");

  const courseIdText = document.getElementById("courseIdText");
  const lessonTypeText = document.getElementById("lessonTypeText");
  const lessonTimeText = document.getElementById("lessonTimeText");
  const lessonProgressText = document.getElementById("lessonProgressText");
  const lessonContentBox = document.getElementById("lessonContentBox");

  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get("lesson_id");
  const courseId = params.get("course_id");

  let currentUser = null;
  let currentLesson = null;

  function setStatus(message = "", type = "") {
    if (!lessonStatus) return;
    lessonStatus.textContent = message;
    lessonStatus.classList.remove("success", "error");
    if (type) lessonStatus.classList.add(type);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function getSessionUser() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      setStatus(error.message, "error");
      return null;
    }

    if (!session) {
      window.location.href = "login.html";
      return null;
    }

    return session.user;
  }

  async function loadLesson() {
    if (!lessonId || !courseId) {
      setStatus("Missing lesson_id or course_id in URL.", "error");
      if (completeBtn) completeBtn.disabled = true;
      if (startBtn) startBtn.disabled = true;
      return;
    }

    currentUser = await getSessionUser();
    if (!currentUser) return;

    setStatus("Loading lesson...", "");

    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (lessonError) {
      console.error("Lesson fetch error:", lessonError);
      setStatus("Could not load lesson.", "error");
      return;
    }

    if (!lesson) {
      setStatus("Lesson not found.", "error");
      return;
    }

    currentLesson = lesson;

    if (lessonTitle) {
      lessonTitle.textContent = lesson.title || "Untitled Lesson";
    }

    if (lessonDesc) {
      lessonDesc.textContent = lesson.description || "No description available.";
    }

    if (courseIdText) {
      courseIdText.textContent = courseId;
    }

    if (lessonTypeText) {
      lessonTypeText.textContent = lesson.lesson_type || "text";
    }

    if (lessonTimeText) {
      lessonTimeText.textContent = lesson.estimated_minutes
        ? `${lesson.estimated_minutes} mins`
        : "Not specified";
    }

    if (lessonContentBox) {
      lessonContentBox.innerHTML = `
        <p><strong>Title:</strong> ${escapeHtml(lesson.title || "Untitled Lesson")}</p>
        <p style="margin-top:10px;"><strong>Description:</strong> ${escapeHtml(lesson.description || "No description available.")}</p>
        <p style="margin-top:10px;"><strong>Lesson Type:</strong> ${escapeHtml(lesson.lesson_type || "text")}</p>
        <p style="margin-top:10px;"><strong>Status:</strong> ${escapeHtml(lesson.status || "published")}</p>
      `;
    }

    await loadLessonProgress();
    setStatus("Lesson loaded successfully.", "success");
  }

  async function loadLessonProgress() {
    if (!currentUser || !lessonId) return;

    const { data: progressRow, error } = await supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (error) {
      console.error("Lesson progress fetch error:", error);
      return;
    }

    const currentStatus = progressRow?.status || "not_started";

    if (lessonProgressText) {
      if (currentStatus === "completed") {
        lessonProgressText.textContent = "Completed";
      } else if (currentStatus === "in_progress") {
        lessonProgressText.textContent = "In Progress";
      } else {
        lessonProgressText.textContent = "Not Started";
      }
    }

    if (currentStatus === "completed" && completeBtn) {
      completeBtn.disabled = true;
      completeBtn.textContent = "Completed";
    }
  }

  async function updateCourseProgress() {
    if (!currentUser || !courseId) return;

    const { data: allLessons, error: allLessonsError } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", courseId);

    if (allLessonsError) {
      console.error("All lessons fetch error:", allLessonsError);
      return;
    }

    const { data: completedLessons, error: completedLessonsError } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", currentUser.id)
      .eq("course_id", courseId)
      .eq("status", "completed");

    if (completedLessonsError) {
      console.error("Completed lessons fetch error:", completedLessonsError);
      return;
    }

    const totalLessons = allLessons ? allLessons.length : 0;
    const doneLessons = completedLessons ? completedLessons.length : 0;
    const percent = totalLessons > 0 ? Number(((doneLessons / totalLessons) * 100).toFixed(2)) : 0;

    await supabase
      .from("course_progress")
      .upsert(
        [
          {
            user_id: currentUser.id,
            course_id: courseId,
            completed_modules: 0,
            total_modules: 0,
            progress_percent: percent,
            last_activity_at: new Date().toISOString(),
            completed_at: percent >= 100 ? new Date().toISOString() : null,
          },
        ],
        {
          onConflict: "user_id,course_id",
        }
      );
  }

  async function addXp(points) {
    if (!currentUser) return;

    const { error: txError } = await supabase
      .from("xp_transactions")
      .insert([
        {
          user_id: currentUser.id,
          course_id: courseId,
          source_type: "lesson_complete",
          source_id: lessonId,
          xp_points: points,
        },
      ]);

    if (txError) {
      console.error("XP transaction error:", txError);
    }

    const { data: xpRow, error: xpFetchError } = await supabase
      .from("user_xp_summary")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (xpFetchError) {
      console.error("XP fetch error:", xpFetchError);
    }

    const currentXp = Number(xpRow?.total_xp || 0);

    const { error: xpUpsertError } = await supabase
      .from("user_xp_summary")
      .upsert([
        {
          user_id: currentUser.id,
          total_xp: currentXp + points,
          updated_at: new Date().toISOString(),
        },
      ]);

    if (xpUpsertError) {
      console.error("XP upsert error:", xpUpsertError);
    }
  }

  async function markInProgress() {
    if (!currentUser || !currentLesson) return;

    setStatus("Updating lesson status...", "");

    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        [
          {
            user_id: currentUser.id,
            course_id: courseId,
            module_id: currentLesson.module_id,
            lesson_id: currentLesson.id,
            status: "in_progress",
            progress_percent: 50,
            started_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          },
        ],
        {
          onConflict: "user_id,lesson_id",
        }
      );

    if (error) {
      console.error("In progress error:", error);
      setStatus(error.message, "error");
      return;
    }

    if (lessonProgressText) {
      lessonProgressText.textContent = "In Progress";
    }

    setStatus("Lesson marked as in progress.", "success");
  }

  async function markComplete() {
    if (!currentUser || !currentLesson) return;

    setStatus("Saving completion...", "");

    const { error: progressError } = await supabase
      .from("lesson_progress")
      .upsert(
        [
          {
            user_id: currentUser.id,
            course_id: courseId,
            module_id: currentLesson.module_id,
            lesson_id: currentLesson.id,
            status: "completed",
            progress_percent: 100,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          },
        ],
        {
          onConflict: "user_id,lesson_id",
        }
      );

    if (progressError) {
      console.error("Complete progress error:", progressError);
      setStatus(progressError.message, "error");
      return;
    }

    await updateCourseProgress();
    await addXp(10);

    if (lessonProgressText) {
      lessonProgressText.textContent = "Completed";
    }

    if (completeBtn) {
      completeBtn.disabled = true;
      completeBtn.textContent = "Completed";
    }

    setStatus("Lesson completed successfully. +10 XP added.", "success");
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.history.back();
    });
  }

  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  if (startBtn) {
    startBtn.addEventListener("click", markInProgress);
  }

  if (completeBtn) {
    completeBtn.addEventListener("click", markComplete);
  }

  await loadLesson();
});