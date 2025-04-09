const editModal = document.querySelector('.bg-modal');
const editBtns = document.querySelectorAll('.edit');
const closeEditModal = editModal.querySelector('.fa-x');
const cancelEditBtn = editModal.querySelector('.cancel');

editBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        editModal.style.display = 'block';
    });
});

closeEditModal.addEventListener('click', () => {
    editModal.style.display = 'none';
});

cancelEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});
