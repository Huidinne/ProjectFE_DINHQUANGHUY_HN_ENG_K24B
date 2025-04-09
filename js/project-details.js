document.addEventListener('DOMContentLoaded', () => {
    //modal
    function openTaskModal(taskId, isEditing) {
        addTaskModal.style.display = 'block';
        const form = addTaskModal.querySelector('.modalForm');
        form.reset();
        addTaskModal.querySelector('p').textContent = isEditing ? 'Sửa nhiệm vụ' : 'Thêm nhiệm vụ';
    }
    const addTaskModal = document.querySelector('.bg-modal:nth-of-type(1)');
    const addMemberModal = document.querySelector('.bg-modal:nth-of-type(2)');
    const confirmModal = document.querySelector('.bg-modal:nth-of-type(3)');

    const addTaskBtn = document.querySelector('.project-info .btn');
    const addMemberBtn = document.querySelector('.addMemBtn');
    

    const closeAddTaskModal = addTaskModal.querySelector('.fa-x');
    const cancelAddTaskBtn = addTaskModal.querySelector('.cancel');
    const closeAddMemberModal = addMemberModal.querySelector('.fa-x');
    const cancelAddMemberBtn = addMemberModal.querySelector('.cancel');
    const closeConfirmModal = confirmModal.querySelector('.fa-x');
    const cancelConfirmBtn = confirmModal.querySelector('.cancel');

    addTaskBtn.addEventListener('click', () => {
        openTaskModal(null, false);
    });

    addMemberBtn.addEventListener('click', () => {
        addMemberModal.style.display = 'block';
    });

    closeAddTaskModal.addEventListener('click', () => {
        addTaskModal.style.display = 'none';
    });
    cancelAddTaskBtn.addEventListener('click', () => {
        addTaskModal.style.display = 'none';
    });

    closeAddMemberModal.addEventListener('click', () => {
        addMemberModal.style.display = 'none';
    });
    cancelAddMemberBtn.addEventListener('click', () => {
        addMemberModal.style.display = 'none';
    });

    closeConfirmModal.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
    cancelConfirmBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
    document.querySelectorAll(".statusNow i").forEach(icon => {
        icon.addEventListener("click", function () {
            this.classList.toggle("rotate");
        });
    });
});