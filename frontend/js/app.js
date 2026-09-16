// Learning note: connects the UI to the REST API with fallback for live GitHub Pages preview.

const API_URL = window.API_URL || "http://localhost:5000/api/students";

const $ = (id) => document.getElementById(id);
const form = $("studentForm");
let allStudents = [];
let isBackendOnline = false;

// Default initial demo data if localStorage is empty
const INITIAL_DEMO_DATA = [
  { _id: "demo-1", studentId: "STU001", name: "Arjun Kumar", email: "arjun@example.com", department: "CSE", year: 3, status: "Active" },
  { _id: "demo-2", studentId: "STU002", name: "Priya Sharma", email: "priya@example.com", department: "ECE", year: 2, status: "Active" },
  { _id: "demo-3", studentId: "STU003", name: "Rahul Verma", email: "rahul@example.com", department: "EEE", year: 4, status: "Inactive" }
];

function getLocalStudents() {
  const data = localStorage.getItem("demo_students");
  if (!data) {
    localStorage.setItem("demo_students", JSON.stringify(INITIAL_DEMO_DATA));
    return INITIAL_DEMO_DATA;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_DEMO_DATA;
  }
}

function saveLocalStudents(students) {
  localStorage.setItem("demo_students", JSON.stringify(students));
}

async function loadStudents() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 sec timeout for quick response

    const response = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Could not load students from backend");
    allStudents = await response.json();
    isBackendOnline = true;
    updateStatusIndicator(true);
  } catch (error) {
    isBackendOnline = false;
    allStudents = getLocalStudents();
    updateStatusIndicator(false);
    console.warn("Backend offline or blocked by browser mixed content rules. Using demo mode.");
  }
  renderStudents();
  updateStats();
}

function updateStatusIndicator(online) {
  let badge = $("apiStatusBadge");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "apiStatusBadge";
    badge.className = "api-status";
    const topbarRight = document.querySelector(".topbar-right");
    if (topbarRight) topbarRight.prepend(badge);
  }
  if (online) {
    badge.style.background = "var(--badge-active-bg)";
    badge.style.color = "var(--badge-active-text)";
    badge.style.padding = "6px 12px";
    badge.style.borderRadius = "20px";
    badge.style.fontSize = "0.75rem";
    badge.style.fontWeight = "600";
    badge.textContent = "🟢 API Connected";
  } else {
    badge.style.background = "#fef3c7";
    badge.style.color = "#92400e";
    badge.style.padding = "6px 12px";
    badge.style.borderRadius = "20px";
    badge.style.fontSize = "0.75rem";
    badge.style.fontWeight = "600";
    badge.textContent = "🟡 Demo Mode";
    badge.title = "Local Backend Unreachable. Add/Edit works in Demo Mode.";
  }
}

// READ
function renderStudents() {
  const search = $("searchInput").value.toLowerCase();
  const department = $("departmentFilter").value;

  const students = allStudents.filter(s => {
    const matchesSearch =
      (s.name || "").toLowerCase().includes(search) ||
      (s.studentId || "").toLowerCase().includes(search) ||
      (s.email || "").toLowerCase().includes(search);
    return matchesSearch && (!department || s.department === department);
  });

  $("studentTable").innerHTML = students.map(s => `
    <tr>
      <td><div class="student-name">${escapeHtml(s.name)}</div><div class="student-email">${escapeHtml(s.email)}</div></td>
      <td>${escapeHtml(s.studentId)}</td>
      <td>${escapeHtml(s.department)}</td>
      <td>${s.year}</td>
      <td><span class="badge ${s.status === "Inactive" ? "inactive" : ""}">${s.status}</span></td>
      <td><div class="actions">
        <button class="action" onclick="editStudent('${s._id}')">Edit</button>
        <button class="action delete" onclick="deleteStudent('${s._id}')">Delete</button>
      </div></td>
    </tr>`).join("");

  $("emptyState").classList.toggle("hidden", students.length !== 0);
}

function updateStats() {
  $("totalCount").textContent = allStudents.length;
  $("activeCount").textContent = allStudents.filter(s => s.status === "Active").length;
  $("departmentCount").textContent = new Set(allStudents.map(s => s.department)).size;
}

// CREATE + UPDATE
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const editingId = $("editingId").value;
  const data = {
    studentId: $("studentId").value.trim(),
    name: $("name").value.trim(),
    email: $("email").value.trim(),
    department: $("department").value,
    year: Number($("year").value),
    status: $("status").value
  };

  $("saveBtn").disabled = true;
  $("saveBtn").textContent = "Saving...";

  if (isBackendOnline) {
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Request failed");

      closeModal();
      showToast(editingId ? "Student updated successfully" : "Student added successfully");
      await loadStudents();
    } catch (error) {
      showToast(error.message);
    } finally {
      $("saveBtn").disabled = false;
      $("saveBtn").textContent = "Save Student";
    }
  } else {
    // Offline / Demo LocalStorage Mode
    let local = getLocalStudents();
    if (editingId) {
      local = local.map(s => s._id === editingId ? { ...s, ...data } : s);
      showToast("Student updated (Demo Mode)");
    } else {
      const newStudent = { _id: "demo-" + Date.now(), ...data };
      local.push(newStudent);
      showToast("Student added (Demo Mode)");
    }
    saveLocalStudents(local);
    allStudents = local;
    closeModal();
    renderStudents();
    updateStats();
    $("saveBtn").disabled = false;
    $("saveBtn").textContent = "Save Student";
  }
});

window.editStudent = function(id) {
  const s = allStudents.find(student => student._id === id);
  if (!s) return;

  $("modalTitle").textContent = "Edit Student";
  $("editingId").value = s._id;
  $("studentId").value = s.studentId;
  $("name").value = s.name;
  $("email").value = s.email;
  $("department").value = s.department;
  $("year").value = s.year;
  $("status").value = s.status;
  openModal();
};

// DELETE
window.deleteStudent = async function(id) {
  const student = allStudents.find(s => s._id === id);
  if (!student) return;

  if (!confirm(`Delete ${student.name}? This cannot be undone.`)) return;

  if (isBackendOnline) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {method: "DELETE"});
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Delete failed");

      showToast("Student deleted successfully");
      await loadStudents();
    } catch (error) {
      showToast(error.message);
    }
  } else {
    let local = getLocalStudents().filter(s => s._id !== id);
    saveLocalStudents(local);
    allStudents = local;
    showToast("Student deleted (Demo Mode)");
    renderStudents();
    updateStats();
  }
};

function openModal() { $("studentModal").classList.remove("hidden"); }
function closeModal() {
  $("studentModal").classList.add("hidden");
  form.reset();
  $("editingId").value = "";
  $("modalTitle").textContent = "Add Student";
}

// Mobile Sidebar Drawer Functions
function toggleSidebar(open) {
  const sidebar = $("sidebar");
  const overlay = $("sidebarOverlay");
  if (!sidebar || !overlay) return;
  if (open) {
    sidebar.classList.add("open");
    overlay.classList.add("active");
  } else {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  }
}

if ($("mobileNavBtn")) $("mobileNavBtn").addEventListener("click", () => toggleSidebar(true));
if ($("closeSidebarBtn")) $("closeSidebarBtn").addEventListener("click", () => toggleSidebar(false));
if ($("sidebarOverlay")) $("sidebarOverlay").addEventListener("click", () => toggleSidebar(false));
if ($("sidebarAddBtn")) {
  $("sidebarAddBtn").addEventListener("click", (e) => {
    e.preventDefault();
    toggleSidebar(false);
    openModal();
  });
}

$("openAddBtn").addEventListener("click", openModal);
$("closeModalBtn").addEventListener("click", closeModal);
$("searchInput").addEventListener("input", renderStudents);
$("departmentFilter").addEventListener("change", renderStudents);
$("clearBtn").addEventListener("click", () => {
  $("searchInput").value = "";
  $("departmentFilter").value = "";
  renderStudents();
});
$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});
if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));
}

loadStudents();
