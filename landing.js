document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  const navAnchors = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section[id]");

  const mainProgress = document.getElementById("mainProgress");
  const progressText = document.getElementById("progressText");
  const xpCount = document.getElementById("xpCount");
  const userXpLeader = document.getElementById("userXpLeader");
  const levelCircle = document.getElementById("levelCircle");

  const applyForm = document.getElementById("applyForm");
  const formStatus = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");

  const courseList = document.getElementById("courseList");
  const courseCount = document.getElementById("courseCount");
  const courseViewer = document.getElementById("courseViewer");
  const courseViewerEmpty = document.getElementById("courseViewerEmpty");
  const selectedCourseTitle = document.getElementById("selectedCourseTitle");
  const selectedCourseMeta = document.getElementById("selectedCourseMeta");
  const selectedCourseStatus = document.getElementById("selectedCourseStatus");
  const selectedCourseDesc = document.getElementById("selectedCourseDesc");
  const moduleList = document.getElementById("moduleList");

  let progress = 68;
  let xp = 1280;
  let isAnimatingXP = false;
  let fetchedCourses = [];

  function handleNavbar() {
    if (!navbar) return;

    if (window.scrollY > 30) {
      navbar.style.background = "rgba(255, 255, 255, 0.95)";
      navbar.style.boxShadow = "0 10px 30px rgba(15, 23, 42, 0.08)";
      navbar.style.backdropFilter = "blur(16px)";
    } else {
      navbar.style.background = "rgba(255, 255, 255, 0.82)";
      navbar.style.boxShadow = "none";
      navbar.style.backdropFilter = "blur(14px)";
    }
  }

  window.addEventListener("scroll", handleNavbar);
  handleNavbar();

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navLinks.classList.toggle("open");
    });

    navAnchors.forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
      });
    });

    document.addEventListener("click", (e) => {
      if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
        navLinks.classList.remove("open");
      }
    });
  }

  window.scrollToSection = function (id) {
    const section = document.getElementById(id);
    if (!section) return;
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  function setProgress(value) {
    progress = Math.max(0, Math.min(value, 100));
    if (mainProgress) mainProgress.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${progress}%`;
  }

  function animateValue(element, start, end, duration, suffix = "") {
    if (!element) return;

    let startTimestamp = null;

    function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const progressRatio = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(start + (end - start) * progressRatio);
      element.textContent = `${current}${suffix}`;

      if (progressRatio < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function updateLevel(currentXP) {
    if (!levelCircle) return;

    let level = 1;
    if (currentXP >= 300) level = 2;
    if (currentXP >= 700) level = 3;
    if (currentXP >= 1200) level = 4;
    if (currentXP >= 1800) level = 5;
    if (currentXP >= 2500) level = 6;

    levelCircle.textContent = `Lv ${level}`;
    levelCircle.style.transform = "scale(1.08)";

    setTimeout(() => {
      levelCircle.style.transform = "scale(1)";
    }, 180);
  }

  window.addXP = function (points) {
    if (isAnimatingXP) return;
    isAnimatingXP = true;

    const oldXP = xp;
    const newXP = xp + points;
    const oldProgress = progress;
    const newProgress = Math.min(progress + 2, 100);

    animateValue(xpCount, oldXP, newXP, 600);
    animateValue(userXpLeader, oldXP, newXP, 600, " XP");

    let startTime = null;

    function animateProgress(timestamp) {
      if (!startTime) startTime = timestamp;

      const ratio = Math.min((timestamp - startTime) / 500, 1);
      const currentProgress = oldProgress + (newProgress - oldProgress) * ratio;

      if (mainProgress) mainProgress.style.width = `${currentProgress}%`;
      if (progressText) progressText.textContent = `${Math.floor(currentProgress)}%`;

      if (ratio < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        xp = newXP;
        progress = newProgress;
        updateLevel(xp);
        isAnimatingXP = false;
      }
    }

    requestAnimationFrame(animateProgress);
  };

  const revealElements = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealElements.forEach((el) => revealObserver.observe(el));

  function updateActiveNav() {
    let currentSection = "";

    sections.forEach((section) => {
      const top = section.offsetTop - 140;
      const height = section.offsetHeight;

      if (window.scrollY >= top && window.scrollY < top + height) {
        currentSection = section.getAttribute("id");
      }
    });

    navAnchors.forEach((link) => {
      link.classList.remove("active-link");
      if (link.getAttribute("href") === `#${currentSection}`) {
        link.classList.add("active-link");
      }
    });
  }

  window.addEventListener("scroll", updateActiveNav);
  updateActiveNav();

  const allButtons = document.querySelectorAll("button, .primary-btn, .secondary-btn");
  allButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      this.style.transform = "scale(0.98)";
      setTimeout(() => {
        this.style.transform = "";
      }, 120);
    });
  });

  function showStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.remove("success", "error");
    if (type) formStatus.classList.add(type);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  if (applyForm) {
    applyForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("name")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const role = document.getElementById("role")?.value.trim();
      const message = document.getElementById("message")?.value.trim();
      const agreeTerms = document.getElementById("agreeTerms");

      if (!name || !email || !role || !message) {
        showStatus("Please fill all required fields.", "error");
        return;
      }

      if (!isValidEmail(email)) {
        showStatus("Please enter a valid email address.", "error");
        return;
      }

      if (!agreeTerms || !agreeTerms.checked) {
        showStatus("Please agree to the terms before submitting.", "error");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }

      setTimeout(() => {
        showStatus("Demo landing page submitted successfully.", "success");
        applyForm.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Application";
      }, 1000);
    });
  }

  function formatLessonType(type) {
    if (!type) return "Lesson";

    const map = {
      video: "Video",
      quiz: "Quiz",
      assignment: "Assignment",
      live_class: "Live Class",
      interactive: "Interactive",
      resource: "Resource",
      text: "Text Lesson",
    };

    return map[type] || type;
  }

  function renderCourseList(courses) {
    if (!courseList) return;

    courseList.innerHTML = "";

    if (!courses.length) {
      courseList.innerHTML = `<p style="color:#64748b;">No published courses found.</p>`;
      return;
    }

    courses.forEach((course, index) => {
      const totalModules = course.course_modules?.length || 0;
      const totalLessons = (course.course_modules || []).reduce(
        (sum, mod) => sum + (mod.lessons?.length || 0),
        0
      );

      const div = document.createElement("div");
      div.className = `course-item ${index === 0 ? "active" : ""}`;
      div.dataset.courseId = course.id;

      div.innerHTML = `
        <h4>${course.title || "Untitled Course"}</h4>
        <p>${course.short_description || "No short description available."}</p>
        <div class="course-mini-meta">
          <span class="course-mini-chip">${totalModules} Modules</span>
          <span class="course-mini-chip">${totalLessons} Lessons</span>
        </div>
      `;

      div.addEventListener("click", () => {
        document.querySelectorAll(".course-item").forEach((item) => {
          item.classList.remove("active");
        });
        div.classList.add("active");
        renderCourseDetails(course.id);
      });

      courseList.appendChild(div);
    });
  }

  function renderCourseDetails(courseId) {
    const course = fetchedCourses.find((c) => c.id === courseId);
    if (!course || !courseViewer || !moduleList) return;

    if (courseViewerEmpty) courseViewerEmpty.style.display = "none";
    courseViewer.style.display = "grid";

    if (selectedCourseTitle) {
      selectedCourseTitle.textContent = course.title || "Untitled Course";
    }

    if (selectedCourseMeta) {
      selectedCourseMeta.textContent = [
        course.category || "General",
        course.difficulty_level || "Beginner",
        course.language || "English",
        course.visibility || "public",
      ].join(" • ");
    }

    if (selectedCourseStatus) {
      selectedCourseStatus.textContent = course.status || "published";
    }

    if (selectedCourseDesc) {
      selectedCourseDesc.textContent =
        course.description || course.short_description || "No description available.";
    }

    moduleList.innerHTML = "";

    if (!course.course_modules || course.course_modules.length === 0) {
      moduleList.innerHTML = `<p style="color:#64748b;">No modules available for this course.</p>`;
      return;
    }

    course.course_modules.forEach((module, moduleIndex) => {
      const box = document.createElement("div");
      box.className = `module-box ${moduleIndex === 0 ? "open" : ""}`;

      const totalLessons = module.lessons?.length || 0;

      box.innerHTML = `
        <button class="module-head" type="button">
          <span>${module.title || "Untitled Module"}</span>
          <span>${totalLessons} lessons • ${module.estimated_minutes || 0} mins</span>
        </button>
        <div class="module-content">
          <p style="color:#64748b; margin-bottom:12px;">
            ${module.description || "No module description available."}
          </p>
          <div class="lesson-list-db">
            ${
              totalLessons > 0
                ? module.lessons
                    .map(
                      (lesson) => `
                <div class="lesson-row">
                  <div class="lesson-left">
                    <span class="lesson-title">${lesson.title || "Untitled Lesson"}</span>
                    <span class="lesson-type">${formatLessonType(lesson.lesson_type)}</span>
                    <span class="lesson-meta">${lesson.estimated_minutes || 0} mins</span>
                  </div>
                  <div>
                    ${lesson.is_preview ? `<span class="lesson-preview">Preview</span>` : ``}
                  </div>
                </div>
              `
                    )
                    .join("")
                : `<p style="color:#64748b;">No lessons in this module yet.</p>`
            }
          </div>
        </div>
      `;

      const head = box.querySelector(".module-head");
      if (head) {
        head.addEventListener("click", () => {
          box.classList.toggle("open");
        });
      }

      moduleList.appendChild(box);
    });
  }

  async function loadCourses() {
    if (!courseList) return;

    courseList.innerHTML = `<p style="color:#64748b;">Loading courses...</p>`;

    try {
      const response = await fetch("./courses.json");

      if (!response.ok) {
        throw new Error("Failed to fetch courses.json");
      }

      const data = await response.json();

      fetchedCourses = (data || []).filter(
        (course) => course.status === "published"
      );

      if (courseCount) {
        courseCount.textContent = `${fetchedCourses.length} courses`;
      }

      renderCourseList(fetchedCourses);

      if (fetchedCourses.length > 0) {
        renderCourseDetails(fetchedCourses[0].id);
      } else {
        courseList.innerHTML = `<p style="color:#64748b;">No published courses found.</p>`;
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      courseList.innerHTML = `<p style="color:#ef4444;">Failed to load courses: ${err.message}</p>`;
      if (courseCount) courseCount.textContent = "Error";
    }
  }

  setProgress(progress);
  if (xpCount) xpCount.textContent = xp;
  if (userXpLeader) userXpLeader.textContent = `${xp} XP`;
  updateLevel(xp);
  loadCourses();
});