// Lấy người dùng hiện tại từ localStorage (có thể null nếu chưa đăng nhập)
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

// Dữ liệu dự án từ localStorage
let projects = JSON.parse(localStorage.getItem("projects")) || [];

// Phân trang
const itemsPerPage = 4;
let currentPage = 1;
let filteredProjects = [];

// Lọc dự án theo ownerId (nếu có currentUser)
function getUserProjects() {
    if (!currentUser) return [];
    return projects.filter(project => project.ownerId === currentUser.id);
}

// Hiển thị danh sách dự án theo trang
function displayProjects(projectList, page) {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    if (!currentUser) {
        tbody.innerHTML = '<tr><td colspan="3">Vui lòng đăng nhập để xem và quản lý dự án</td></tr>';
        document.querySelector('.add-project').disabled = true;
        updatePagination(0);
        return;
    }

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedProjects = projectList.slice(start, end);

    paginatedProjects.forEach(project => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${project.id}</td>
            <td>${project.name}</td>
            <td>
                <button class="edit" onclick="editProject(${project.id})">Sửa</button>
                <button class="delete" onclick="deleteProject(${project.id})">Xóa</button>
                <button class="details"><a href="../pages/project-details.html">Chi tiết</a></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePagination(projectList.length);
}

// Cập nhật phân trang
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';

    if (totalItems === 0) return;

    const prev = document.createElement('span');
    prev.className = 'prev';
    prev.innerHTML = '<';
    if (currentPage === 1) prev.classList.add('disabled');
    else prev.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayProjects(filteredProjects, currentPage);
        }
    });
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const page = document.createElement('span');
        page.textContent = i;
        if (i === currentPage) page.className = 'active';
        page.addEventListener('click', () => {
            currentPage = i;
            displayProjects(filteredProjects, currentPage);
        });
        pagination.appendChild(page);
    }

    const next = document.createElement('span');
    next.className = 'next';
    next.innerHTML = '>';
    if (currentPage === totalPages || totalPages === 0) next.classList.add('disabled');
    else next.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayProjects(filteredProjects, currentPage);
        }
    });
    pagination.appendChild(next);
}

// Mở modal thêm/sửa dự án
const addProjectBtn = document.querySelector('.add-project');
const modal = document.querySelector('.bg-modal');
const closeModal = modal.querySelector('.fa-x');
const form = modal.querySelector('.modalForm');
const saveBtn = modal.querySelector('.save');
const cancelBtn = modal.querySelector('.cancel');
let isEditing = false;
let editingId = null;

addProjectBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để thêm dự án!");
        return;
    }
    isEditing = false;
    editingId = null;
    modal.style.display = 'block';
    form.reset();
    modal.querySelector('p').textContent = 'Thêm dự án';
    document.querySelector('.error-message').style.display = 'none';
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Lưu dự án
saveBtn.addEventListener('click', () => {
    const projectName = document.getElementById('projectName').value.trim();
    const projectDescription = document.getElementById('projectDescription').value.trim();
    const errorMessage = document.querySelector('.error-message');

    // Kiểm tra độ dài tên dự án
    if (!projectName) {
        errorMessage.textContent = 'Vui lòng nhập tên dự án';
        errorMessage.style.display = 'block';
        return;
    } else if (projectName.length < 3 || projectName.length > 50) {
        errorMessage.textContent = `Tên dự án phải từ 3 đến 50 ký tự`;
        errorMessage.style.display = 'block';
        return;
    }

    // Kiểm tra độ dài mô tả dự án
    if (!projectDescription) {
        errorMessage.textContent = 'Vui lòng nhập mô tả dự án';
        errorMessage.style.display = 'block';
        return;
    } else if (projectDescription.length < 10 || projectDescription.length > 200) {
        errorMessage.textContent = `Mô tả dự án phải từ 10 đến 200 ký tự`;
        errorMessage.style.display = 'block';
        return;
    }

    // Kiểm tra trùng tên
    const isDuplicate = projects.some(project => 
        project.name.toLowerCase() === projectName.toLowerCase() && 
        (!isEditing || project.id !== editingId)
    );
    if (isDuplicate) {
        errorMessage.textContent = 'Tên dự án đã tồn tại';
        errorMessage.style.display = 'block';
        return;
    }

    if (isEditing) {
        const projectIndex = projects.findIndex(p => p.id === editingId);
        projects[projectIndex] = { id: editingId, name: projectName, description: projectDescription, ownerId: currentUser.id };
    } else {
        const newId = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1;
        projects.push({ id: newId, name: projectName, description: projectDescription, ownerId: currentUser.id });
    }

    localStorage.setItem('projects', JSON.stringify(projects));
    filteredProjects = getUserProjects();
    displayProjects(filteredProjects, currentPage);
    modal.style.display = 'none';
});

// Sửa dự án
function editProject(id) {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để sửa dự án!");
        return;
    }
    isEditing = true;
    editingId = id;
    const project = projects.find(p => p.id === id);
    if (project.ownerId !== currentUser.id) return;
    modal.style.display = 'block';
    modal.querySelector('p').textContent = 'Sửa dự án';
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description;
    document.querySelector('.error-message').style.display = 'none';
}

// Xóa dự án và cập nhật lại ID
const confirmModal = document.querySelectorAll('.bg-modal')[1];
const confirmDeleteBtn = confirmModal.querySelector('button[style*="dc3545"]');
const cancelDeleteBtn = confirmModal.querySelector('.cancel');
const closeConfirmModal = confirmModal.querySelector('.fa-x');
let deleteId = null;

function deleteProject(id) {
    if (!currentUser) {
        alert("Vui lòng đăng nhập để xóa dự án!");
        return;
    }
    const project = projects.find(p => p.id === id);
    if (project.ownerId !== currentUser.id) return;
    deleteId = id;
    confirmModal.style.display = 'block';
}

closeConfirmModal.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

cancelDeleteBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
});

confirmDeleteBtn.addEventListener('click', () => {
    // Xóa dự án
    projects = projects.filter(p => p.id !== deleteId);
    // Cập nhật lại ID
    projects = projects.map((project, index) => ({
        ...project,
        id: index + 1
    }));
    localStorage.setItem('projects', JSON.stringify(projects));
    filteredProjects = getUserProjects();
    currentPage = Math.min(currentPage, Math.ceil(filteredProjects.length / itemsPerPage)) || 1;
    displayProjects(filteredProjects, currentPage);
    confirmModal.style.display = 'none';
});

// Tìm kiếm dự án
const searchBox = document.querySelector('.search-box');
searchBox.addEventListener('input', (e) => {
    if (!currentUser) return;
    const searchTerm = e.target.value.toLowerCase();
    filteredProjects = getUserProjects().filter(project => 
        project.name.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayProjects(filteredProjects, currentPage);
});

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    filteredProjects = getUserProjects();
    displayProjects(filteredProjects, currentPage);
});

// Xử lý đăng xuất
document.querySelector('a[href="../pages/login.html"]').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.location.href = "../pages/login.html";
});