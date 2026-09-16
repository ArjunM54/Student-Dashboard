// Learning note: this file connects the UI to the REST API.
// Frontend flow: user action -> fetch() -> backend API -> database -> response -> UI.

const API_URL = "http://localhost:5000/api/students";

const $ = (id) => document.getElementById(id);
const form = $("studentForm");
let allStudents = [];

async function loadStudents() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Could not load students");
    allStudents = await response.json();
    renderStudents();
    updateStats();
  } catch (error) {
    showToast("Backend is not running");
    console.error(error);
  }
}

// READ
function renderStudents() {
  const search = $("searchInput").value.toLowerCase();
  const department = $("departmentFilter").value;

  const students = allStudents.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search) ||
      s.studentId.toLowerCase().includes(search) ||
      s.email.toLowerCase().includes(search);
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

  const url = editingId ? `${API_URL}/${editingId}` : API_URL;
  const method = editingId ? "PUT" : "POST";

  try {
    $("saveBtn").disabled = true;
    $("saveBtn").textContent = "Saving...";

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

  try {
    const response = await fetch(`${API_URL}/${id}`, {method: "DELETE"});
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Delete failed");

    showToast("Student deleted successfully");
    await loadStudents();
  } catch (error) {
    showToast(error.message);
  }
};

function openModal() { $("studentModal").classList.remove("hidden"); }
function closeModal() {
  $("studentModal").classList.add("hidden");
  form.reset();
  $("editingId").value = "";
  $("modalTitle").textContent = "Add Student";
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
