document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('projectId')) || 1;

    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const users = JSON.parse(localStorage.getItem("user")) || [];
    let allTasks = JSON.parse(localStorage.getItem("tasks")) || [];

    // Loại bỏ các task có assigneeId: null
    allTasks = allTasks.filter(task => task.assigneeId !== null && !isNaN(task.assigneeId));
    localStorage.setItem("tasks", JSON.stringify(allTasks));

    const project = projects.find(p => p.id === projectId);
    if (!project) {
        console.error("Không tìm thấy dự án!");
        return;
    }

    // Hiển thị thông tin dự án
    const projectInfo = document.querySelector('.project-info');
    projectInfo.querySelector('h2').textContent = project.projectName;
    projectInfo.querySelector('p').textContent = project.projectInfo || "Không có mô tả.";

    // Hiển thị thành viên
    const listMember = document.querySelector('.list-member');
    listMember.innerHTML = '';
    project.members.forEach(member => {
        const user = users.find(u => u.id == member.userId);
        if (user) {
            const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
            listMember.innerHTML += `
                <div class="member">
                    <div class="avatar ${initials.toLowerCase()}">${initials}</div>
                    <div class="info">
                        <span>${user.fullName}</span>
                        <small>${member.role}</small>
                    </div>
                </div>`;
        }
    });
    listMember.innerHTML += `<span class="more"><i class="fa-solid fa-ellipsis"></i></span>`;

    // Điền danh sách người phụ trách vào select (chỉ gồm Project Owner và 1 member)
    const personInChargeSelect = document.getElementById("person-in-charge");
    personInChargeSelect.innerHTML = '<option value="">Chọn người phụ trách</option>';
    
    const projectOwner = project.members.find(m => m.role === "Project owner");
    const otherMember = project.members.find(m => m.role !== "Project owner");

    if (projectOwner) {
        const owner = users.find(u => u.id === projectOwner.userId);
        if (owner) {
            personInChargeSelect.innerHTML += `<option value="${owner.id}">${owner.fullName}</option>`;
        }
    }
    if (otherMember) {
        const member = users.find(u => u.id === otherMember.userId);
        if (member) {
            personInChargeSelect.innerHTML += `<option value="${member.id}">${member.fullName}</option>`;
        }
    }

    // Kiểm tra nếu không có thành viên hợp lệ
    if (!projectOwner && !otherMember) {
        alert("Dự án không có thành viên hợp lệ để phân công nhiệm vụ!");
        document.querySelector(".btn").disabled = true;
    }

    // Task Logic
    const taskModal = document.querySelector(".addModal").parentElement;
    const modalTitle = taskModal.querySelector("p");
    const saveBtn = taskModal.querySelector(".save");
    const cancelBtns = document.querySelectorAll(".cancel, .fa-x");
    const confirmModal = document.querySelector(".confirmModal").parentElement;
    const confirmDeleteBtn = confirmModal.querySelector(".confirmDelete");
    const addMemModal = document.querySelector(".addMemModal")?.parentElement;
    const addMemBtn = document.querySelector(".addMemBtn");

    let editingRow = null;
    let deletingRow = null;
    let currentTaskStartDate = null; // Lưu ngày bắt đầu hiện tại của nhiệm vụ khi chỉnh sửa
    let currentTaskEndDate = null;   // Lưu ngày hạn hiện tại của nhiệm vụ khi chỉnh sửa

    function openModal(modal) {
        modal.style.display = "flex";
    }

    function closeModal(modal) {
        modal.style.display = "none";
        editingRow = null;
        deletingRow = null;
        currentTaskStartDate = null; // Reset ngày bắt đầu hiện tại
        currentTaskEndDate = null;   // Reset ngày hạn hiện tại
        // Xóa thuộc tính min khi đóng modal
        document.getElementById("assignDate").removeAttribute("min");
        document.getElementById("dueDate").removeAttribute("min");
        // Xóa sự kiện onchange của assignDate
        document.getElementById("assignDate").onchange = null;
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
        return p === "on-track" ? "Đúng tiến độ" : p === "risky" ? "Có rủi ro" : "overdue" ? "Trễ hạn" : "";
    }

    function getStatusFromId(id) {
        return {
            "todo-list": "To do",
            "inprogress-list": "In progress",
            "pending-list": "Pending",
            "done-list": "Done"
        }[id] || "";
    }

    function getTbodyByStatus(status) {
        return document.querySelector(`#${status.toLowerCase().replace(" ", "")}-list`);
    }

    function getUserFullName(userId) {
        const user = users.find(u => u.id == userId);
        return user ? user.fullName : "Không rõ";
    }

    function renderTaskRow(task) {
        return `
        <tr data-id="${task.id}">
            <td>${task.name}</td>
            <td>${getUserFullName(parseInt(task.assigneeId))}</td>
            <td><span class="priority ${task.priority}">${getPriorityText(task.priority)}</span></td>
            <td class="start-date">${formatDisplayDate(task.start)}</td>
            <td class="deadline">${formatDisplayDate(task.end)}</td>
            <td><span class="status ${task.progress}">${getProgressText(task.progress)}</span></td>
            <td>
                <button class="edit">Sửa</button>
                <button class="delete">Xóa</button>
            </td>
        </tr>`;
    }

    function clearForm() {
        document.querySelector(".modalForm").reset();
        // Thiết lập giá trị tối thiểu cho assignDate và dueDate khi thêm mới
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        document.getElementById("assignDate").setAttribute("min", todayStr);
        document.getElementById("dueDate").setAttribute("min", todayStr);
        // Xóa sự kiện onchange của assignDate
        document.getElementById("assignDate").onchange = null;
    }

    function bindEvents() {
        document.querySelectorAll("tbody .edit").forEach(btn => {
            btn.onclick = () => openEditModal(btn.closest("tr"));
        });
        document.querySelectorAll("tbody .delete").forEach(btn => {
            btn.onclick = () => openDeleteModal(btn.closest("tr"));
        });
    }

    function openEditModal(row) {
        editingRow = row;
        modalTitle.textContent = "Sửa nhiệm vụ";
        saveBtn.textContent = "Lưu";

        const taskId = row.dataset.id;
        const task = tasks.find(t => t.id == taskId);

        if (!task) return;

        document.getElementById("taskName").value = task.name;
        document.getElementById("person-in-charge").value = task.assigneeId;
        document.getElementById("priority").value = task.priority;
        document.getElementById("assignDate").value = task.start;
        document.getElementById("dueDate").value = task.end;
        document.getElementById("progress").value = task.progress;
        document.getElementById("status").value = task.status;

        // Lưu ngày bắt đầu và ngày hạn hiện tại của nhiệm vụ
        currentTaskStartDate = task.start;
        currentTaskEndDate = task.end;
        // Thiết lập giá trị tối thiểu cho assignDate và dueDate
        document.getElementById("assignDate").setAttribute("min", currentTaskStartDate);
        // Ban đầu, giá trị min của dueDate là ngày hạn hiện tại hoặc ngày bắt đầu hiện tại (lấy giá trị lớn hơn)
        const initialMinDueDate = new Date(currentTaskStartDate) > new Date(currentTaskEndDate) ? currentTaskStartDate : currentTaskEndDate;
        document.getElementById("dueDate").setAttribute("min", initialMinDueDate);

        // Thêm sự kiện onchange cho assignDate để cập nhật min của dueDate
        document.getElementById("assignDate").onchange = function () {
            const newStartDate = this.value;
            // Cập nhật min của dueDate dựa trên ngày bắt đầu mới, nhưng không nhỏ hơn currentTaskEndDate
            const minDueDate = new Date(newStartDate) > new Date(currentTaskEndDate) ? newStartDate : currentTaskEndDate;
            document.getElementById("dueDate").setAttribute("min", minDueDate);
            // Nếu ngày hạn hiện tại nhỏ hơn ngày bắt đầu mới, reset giá trị của dueDate
            if (new Date(document.getElementById("dueDate").value) < new Date(newStartDate)) {
                document.getElementById("dueDate").value = newStartDate;
            }
        };

        openModal(taskModal);
    }

    function openDeleteModal(row) {
        deletingRow = row;
        openModal(confirmModal);
    }

    function saveTasksToLocalStorage() {
        const dataToSave = tasks.filter(t => t.projectId === projectId);
        localStorage.setItem("tasks", JSON.stringify([...allTasks.filter(t => t.projectId !== projectId), ...dataToSave]));
    }

    let tasks = allTasks.filter(t => t.projectId === projectId);

    function loadTasks() {
        const fragment = document.createDocumentFragment();
        tasks.forEach(task => {
            const tr = document.createElement('tr');
            tr.innerHTML = renderTaskRow(task);
            fragment.appendChild(tr);
            getTbodyByStatus(task.status).appendChild(fragment);
        });
        bindEvents();
    }

    document.querySelector(".btn").addEventListener("click", () => {
        openModal(taskModal);
        modalTitle.textContent = "Thêm nhiệm vụ";
        saveBtn.textContent = "Lưu";
        clearForm();
        editingRow = null;
    });

    if (addMemBtn && addMemModal) {
        addMemBtn.addEventListener("click", () => openModal(addMemModal));
    }

    cancelBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const modal = btn.closest(".bg-modal");
            closeModal(modal);
        });
    });
    
    saveBtn.addEventListener("click", () => {
        const name = document.getElementById("taskName").value.trim();
        const assigneeId = parseInt(document.getElementById("person-in-charge").value);
        const priority = document.getElementById("priority").value;
        const start = document.getElementById("assignDate").value;
        const end = document.getElementById("dueDate").value;
        const progress = document.getElementById("progress").value;
        const status = document.getElementById("status").value;

        if (isNaN(assigneeId) || !start || !end || !priority || !progress || !status) {
            alert("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (new Date(start) > new Date(end)) {
            alert("Ngày bắt đầu phải nhỏ hơn ngày kết thúc.");
            return;
        }

        if (!users.some(u => u.id === assigneeId)) {
            alert("Người phụ trách không tồn tại.");
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (!editingRow) {
            if (startDate < today) {
                alert("Ngày bắt đầu không được trước ngày hiện tại.");
                return;
            }
            if (endDate < today) {
                alert("Ngày hạn không được trước ngày hiện tại.");
                return;
            }
        }

        // Kiểm tra ngày bắt đầu và ngày hạn khi chỉnh sửa
        if (editingRow && currentTaskStartDate && currentTaskEndDate) {
            const newStartDate = new Date(start);
            const currentStartDate = new Date(currentTaskStartDate);
            const newEndDate = new Date(end);
            const currentEndDate = new Date(currentTaskEndDate);
            if (newStartDate < currentStartDate) {
                alert("Ngày bắt đầu mới không được sớm hơn ngày bắt đầu hiện tại.");
                return;
            }
            if (newEndDate < currentEndDate) {
                alert("Ngày hạn mới không được sớm hơn ngày hạn hiện tại.");
                return;
            }
        }

        const task = {
            id: editingRow ? parseInt(editingRow.dataset.id) : (allTasks.length ? Math.max(...allTasks.map(t => t.id)) + 1 : 1),
            name,
            assigneeId,
            priority,
            start,
            end,
            progress,
            status,
            projectId
        };

        if (editingRow) {
            const index = tasks.findIndex(t => t.id === task.id);
            tasks[index] = task;
            // Xóa hàng cũ
            editingRow.remove();
            // Thêm hàng mới vào bảng tương ứng với trạng thái mới
            const statusTbody = getTbodyByStatus(task.status);
            statusTbody.insertAdjacentHTML("beforeend", renderTaskRow(task));
        } else {
            tasks.push(task);
            const statusTbody = getTbodyByStatus(task.status);
            statusTbody.insertAdjacentHTML("beforeend", renderTaskRow(task));
        }

        saveTasksToLocalStorage();
        bindEvents();
        closeModal(taskModal);
    });

    confirmDeleteBtn.addEventListener("click", () => {
        const id = parseInt(deletingRow.dataset.id);
        const index = tasks.findIndex(t => t.id === id);
        if (index > -1) tasks.splice(index, 1);
        deletingRow.remove();
        saveTasksToLocalStorage();
        closeModal(confirmModal);
    });

    loadTasks();
});