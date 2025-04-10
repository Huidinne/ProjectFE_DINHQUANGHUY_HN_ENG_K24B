document.addEventListener("DOMContentLoaded", () => {
    const taskModal = document.querySelector(".addModal").parentElement;
    const modalTitle = taskModal.querySelector("p");
    const saveBtn = taskModal.querySelector(".save");
    const cancelBtns = document.querySelectorAll(".cancel, .fa-x");
    const confirmModal = document.querySelector(".confirmModal").parentElement;
    const confirmDeleteBtn = confirmModal.querySelector(".confirmDelete");
    const addMemModal = document.querySelector(".addMemModal").parentElement;
    const addMemBtn = document.querySelector(".addMemBtn");

    let editingRow = null;
    let deletingRow = null;

    loadTasksFromLocalStorage();

    document.querySelector(".btn").addEventListener("click", () => {
        openModal(taskModal);
        modalTitle.textContent = "Thêm nhiệm vụ";
        saveBtn.textContent = "Lưu";
        clearForm();
        editingRow = null;
    });

    if (addMemBtn) {
        addMemBtn.addEventListener("click", () => {
            openModal(addMemModal);
        });
    }

    saveBtn.addEventListener("click", () => {
        const task = {
            name: document.getElementById("taskName").value,
            person: document.getElementById("person-in-charge").value,
            priority: document.getElementById("priority").value,
            start: document.getElementById("assignDate").value,
            end: document.getElementById("dueDate").value,
            progress: document.getElementById("progress").value,
            status: document.getElementById("status").value
        };

        const statusTbody = getTbodyByStatus(task.status);
        const rowHTML = `
            <tr>
                <td>${task.name}</td>
                <td>${task.person}</td>
                <td><span class="priority ${task.priority}">${getPriorityText(task.priority)}</span></td>
                <td class="start-date">${formatDisplayDate(task.start)}</td>
                <td class="deadline">${formatDisplayDate(task.end)}</td>
                <td><span class="status ${task.progress}">${getProgressText(task.progress)}</span></td>
                <td>
                    <button class="edit">Sửa</button>
                    <button class="delete">Xóa</button>
                </td>
            </tr>
        `;

        if (editingRow) {
            editingRow.outerHTML = rowHTML;
        } else {
            statusTbody.insertAdjacentHTML("beforeend", rowHTML);
        }

        saveTasksToLocalStorage();
        bindEvents();
        closeModal(taskModal);
    });

    confirmDeleteBtn.addEventListener("click", () => {
        if (deletingRow) {
            deletingRow.remove();
            saveTasksToLocalStorage();
        }
        closeModal(confirmModal);
    });

    cancelBtns.forEach(btn => btn.addEventListener("click", () => {
        const modal = btn.closest(".bg-modal");
        if (modal) closeModal(modal);
    }));

    function openEditModal(row) {
        editingRow = row;
        modalTitle.textContent = "Sửa nhiệm vụ";
        saveBtn.textContent = "Lưu";

        document.getElementById("taskName").value = row.cells[0].textContent.trim();
        document.getElementById("person-in-charge").value = row.cells[1].textContent.trim();
        document.getElementById("priority").value = row.querySelector(".priority")?.classList[1] || "";
        document.getElementById("assignDate").value = formatInputDate(row.querySelector(".start-date")?.textContent);
        document.getElementById("dueDate").value = formatInputDate(row.querySelector(".deadline")?.textContent);
        document.getElementById("progress").value = row.querySelector(".status")?.classList[1] || "";

        const sectionId = row.closest("tbody")?.id || "";
        document.getElementById("status").value = getStatusFromId(sectionId);

        openModal(taskModal);
    }

    function openDeleteModal(row) {
        deletingRow = row;
        openModal(confirmModal);
    }

    function bindEvents() {
        document.querySelectorAll("tbody .edit").forEach(btn => {
            btn.onclick = () => openEditModal(btn.closest("tr"));
        });
        document.querySelectorAll("tbody .delete").forEach(btn => {
            btn.onclick = () => openDeleteModal(btn.closest("tr"));
        });
    }

    function clearForm() {
        document.querySelector(".modalForm").reset();
    }

    function openModal(modal) {
        modal.style.display = "flex";
    }

    function closeModal(modal) {
        modal.style.display = "none";
        editingRow = null;
        deletingRow = null;
    }

    function getTbodyByStatus(status) {
        return document.querySelector(`#${status.toLowerCase().replace(" ", "")}-list`);
    }

    function getStatusFromId(id) {
        switch (id) {
            case "todo-list": return "To do";
            case "inprogress-list": return "In progress";
            case "pending-list": return "Pending";
            case "done-list": return "Done";
            default: return "";
        }
    }

    function formatDisplayDate(dateStr) {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split("-");
        return `${month}-${day}`;
    }

    function formatInputDate(dateStr) {
        if (!dateStr || !dateStr.includes("-")) return "";
        const [month, day] = dateStr.split("-");
        const year = new Date().getFullYear();
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    function getPriorityText(p) {
        return p === "high" ? "Cao" : p === "medium" ? "Trung bình" : "Thấp";
    }

    function getProgressText(p) {
        return p === "on-track" ? "Đúng tiến độ" : p === "risky" ? "Có rủi ro" : "Trễ hạn";
    }

    function saveTasksToLocalStorage() {
        const allTasks = [];
        document.querySelectorAll("tbody tr").forEach(row => {
            if (!row || row.cells.length < 2) return;

            const name = row.cells[0]?.textContent.trim() || "";
            const person = row.cells[1]?.textContent.trim() || "";
            const priority = row.querySelector(".priority")?.classList[1] || "";
            const start = formatInputDate(row.querySelector(".start-date")?.textContent || "");
            const end = formatInputDate(row.querySelector(".deadline")?.textContent || "");
            const progress = row.querySelector(".status")?.classList[1] || "";
            const status = getStatusFromId(row.closest("tbody")?.id || "");

            allTasks.push({ name, person, priority, start, end, progress, status });
        });
        localStorage.setItem("tasks", JSON.stringify(allTasks));
    }

    function loadTasksFromLocalStorage() {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
        tasks.forEach(task => {
            const statusTbody = getTbodyByStatus(task.status);
            const rowHTML = `
                <tr>
                    <td>${task.name}</td>
                    <td>${task.person}</td>
                    <td><span class="priority ${task.priority}">${getPriorityText(task.priority)}</span></td>
                    <td class="start-date">${formatDisplayDate(task.start)}</td>
                    <td class="deadline">${formatDisplayDate(task.end)}</td>
                    <td><span class="status ${task.progress}">${getProgressText(task.progress)}</span></td>
                    <td>
                        <button class="edit">Sửa</button>
                        <button class="delete">Xóa</button>
                    </td>
                </tr>
            `;
            statusTbody.insertAdjacentHTML("beforeend", rowHTML);
        });
        bindEvents();
    }
});