const SUPABASE_URL = "https://vxrmycexspdjqhzrbvut.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_KEY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const statusEl = document.getElementById("status");

function setStatus(msg, ok = true) {
  statusEl.textContent = msg;
  statusEl.style.color = ok ? "green" : "red";
}

async function loadCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("id,title")
    .order("created_at", { ascending: false });

  if (error) return setStatus(error.message, false);

  const courseSelect = document.getElementById("moduleCourse");
  courseSelect.innerHTML = `<option value="">Select course</option>` +
    data.map(c => `<option value="${c.id}">${c.title}</option>`).join("");
}

async function loadModules() {
  const { data, error } = await supabase
    .from("modules")
    .select("id,title")
    .order("position", { ascending: true });

  if (error) return setStatus(error.message, false);

  const moduleSelect = document.getElementById("lessonModule");
  moduleSelect.innerHTML = `<option value="">Select module</option>` +
    data.map(m => `<option value="${m.id}">${m.title}</option>`).join("");
}

async function addCourse() {
  const title = document.getElementById("courseTitle").value.trim();
  const description = document.getElementById("courseDesc").value.trim();
  const status = document.getElementById("courseStatus").value;

  if (!title) return setStatus("Course title required", false);

  const { error } = await supabase.from("courses").insert([{ title, description, status }]);
  if (error) return setStatus(error.message, false);

  setStatus("Course added");
  document.getElementById("courseTitle").value = "";
  document.getElementById("courseDesc").value = "";
  loadCourses();
}

async function addModule() {
  const course_id = document.getElementById("moduleCourse").value;
  const title = document.getElementById("moduleTitle").value.trim();
  const description = document.getElementById("moduleDesc").value.trim();
  const position = Number(document.getElementById("modulePosition").value || 1);

  if (!course_id || !title) return setStatus("Course and module title required", false);

  const { error } = await supabase.from("modules").insert([{ course_id, title, description, position }]);
  if (error) return setStatus(error.message, false);

  setStatus("Module added");
  document.getElementById("moduleTitle").value = "";
  document.getElementById("moduleDesc").value = "";
  loadModules();
}

async function addLesson() {
  const module_id = document.getElementById("lessonModule").value;
  const title = document.getElementById("lessonTitle").value.trim();
  const lesson_type = document.getElementById("lessonType").value;
  const content = document.getElementById("lessonContent").value.trim();
  const position = Number(document.getElementById("lessonPosition").value || 1);

  if (!module_id || !title) return setStatus("Module and lesson title required", false);

  const { error } = await supabase.from("lessons").insert([{ module_id, title, lesson_type, content, position }]);
  if (error) return setStatus(error.message, false);

  setStatus("Lesson added");
  document.getElementById("lessonTitle").value = "";
  document.getElementById("lessonContent").value = "";
}

loadCourses();
loadModules();