const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const dueDateInput = document.getElementById('dueDate');
const allTodos = document.getElementById('all-todos');
const emptyState = document.getElementById('empty-state');
const submitLabel = document.getElementById('submit-label');
const addButton = document.getElementById('add-button');
const cancelEditButton = document.getElementById('cancel-edit');
const toast = document.getElementById('toast');

let todoList = loadTodos();
let activeFilter = 'all';
let editingId = null;
let toastTimer;
const notifiedTasks = new Set();

document.getElementById('today-label').textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long', month: 'long', day: 'numeric'
}).format(new Date());

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem('todoList'));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem('todoList', JSON.stringify(todoList));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function resizeInput() {
  todoInput.style.height = '48px';
  todoInput.style.height = `${Math.min(todoInput.scrollHeight, 110)}px`;
}

function toLocalInputValue(timestamp) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function resetForm() {
  editingId = null;
  todoForm.reset();
  submitLabel.textContent = 'Add task';
  addButton.querySelector('i').className = 'bx bx-plus';
  cancelEditButton.classList.add('hidden');
  resizeInput();
}

function startEdit(id) {
  const todo = todoList.find(item => item.id === id);
  if (!todo) return;
  editingId = id;
  todoInput.value = todo.task;
  dueDateInput.value = toLocalInputValue(todo.dueDate);
  submitLabel.textContent = 'Save';
  addButton.querySelector('i').className = 'bx bx-check';
  cancelEditButton.classList.remove('hidden');
  resizeInput();
  todoInput.focus();
  todoForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

todoForm.addEventListener('submit', event => {
  event.preventDefault();
  const task = todoInput.value.trim();
  const dueDate = new Date(dueDateInput.value).getTime();

  if (!task || !Number.isFinite(dueDate)) {
    showToast('Add a task and choose its due date.');
    return;
  }

  if (editingId) {
    const todo = todoList.find(item => item.id === editingId);
    if (todo) Object.assign(todo, { task, dueDate });
    showToast('Task updated');
  } else {
    todoList.unshift({ task, dueDate, id: String(Date.now()), complete: false });
    showToast('Task added');
  }

  saveTodos();
  resetForm();
  render();
});

todoInput.addEventListener('input', resizeInput);
todoInput.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    todoForm.requestSubmit();
  }
});

// Browsers fire either `input` or `change` when the final time segment is picked.
// Blur on the next frame so the native calendar has time to commit the value first.
function closeDateTimePicker() {
  if (!dueDateInput.value) return;
  window.requestAnimationFrame(() => {
    dueDateInput.blur();
  });
}

dueDateInput.addEventListener('input', closeDateTimePicker);
dueDateInput.addEventListener('change', closeDateTimePicker);

cancelEditButton.addEventListener('click', resetForm);

document.querySelectorAll('.filter-btn').forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(item => item.classList.toggle('active', item === button));
    render();
  });
});

document.getElementById('delete-selected').addEventListener('click', () => {
  const count = todoList.filter(item => item.complete).length;
  if (!count) return showToast('No completed tasks to clear');
  todoList = todoList.filter(item => !item.complete);
  if (editingId && !todoList.some(item => item.id === editingId)) resetForm();
  saveTodos();
  render();
  showToast(`${count} completed ${count === 1 ? 'task' : 'tasks'} cleared`);
});

document.getElementById('delete-all').addEventListener('click', () => {
  if (!todoList.length) return showToast('Your list is already empty');
  if (!window.confirm('Delete every task? This cannot be undone.')) return;
  todoList = [];
  resetForm();
  saveTodos();
  render();
  showToast('All tasks deleted');
});

function filteredTodos() {
  if (activeFilter === 'pending') return todoList.filter(item => !item.complete);
  if (activeFilter === 'completed') return todoList.filter(item => item.complete);
  return todoList;
}

function makeButton(label, icon, className, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  button.innerHTML = `<i class="bx ${icon}" aria-hidden="true"></i>`;
  button.addEventListener('click', handler);
  return button;
}

function render() {
  const visibleTodos = filteredTodos();
  allTodos.replaceChildren();
  emptyState.classList.toggle('hidden', visibleTodos.length > 0);

  const completed = todoList.filter(item => item.complete).length;
  document.getElementById('r-count').textContent = todoList.length;
  document.getElementById('c-count').textContent = completed;
  const progress = todoList.length ? Math.round((completed / todoList.length) * 100) : 0;
  document.getElementById('progress-value').textContent = `${progress}%`;
  document.getElementById('task-progress').style.setProperty('--progress', `${progress * 3.6}deg`);
  document.getElementById('progress-bar').style.width = `${progress}%`;

  if (!visibleTodos.length) {
    const title = emptyState.querySelector('h2');
    const copy = emptyState.querySelector('p');
    title.textContent = activeFilter === 'all' ? 'No tasks yet' : `No ${activeFilter} tasks`;
    copy.textContent = activeFilter === 'all'
      ? 'Add your first task and give your day some direction.'
      : 'Try another filter to see the rest of your list.';
  }

  visibleTodos.forEach(todo => {
    const item = document.createElement('li');
    item.className = `todo-item${todo.complete ? ' is-complete' : ''}`;

    const check = makeButton(todo.complete ? 'Mark pending' : 'Mark complete', 'bx-check', 'check-btn', () => {
      todo.complete = !todo.complete;
      saveTodos();
      render();
    });

    const copy = document.createElement('div');
    copy.className = 'task-copy';
    const title = document.createElement('p');
    title.className = 'task-title';
    title.textContent = todo.task;
    const date = document.createElement('span');
    const isOverdue = !todo.complete && todo.dueDate < Date.now();
    date.className = `task-date${isOverdue ? ' overdue' : ''}`;
    const prefix = '';
    date.innerHTML = '<i class="bx bx-calendar" aria-hidden="true"></i>';
    date.append(document.createTextNode(prefix + new Date(todo.dueDate).toLocaleString([], {
      dateStyle: 'medium', timeStyle: 'short'
    })));
    if (isOverdue) {
      const overdue = document.createElement('span');
      overdue.className = 'status-pill';
      overdue.textContent = 'Overdue';
      date.append(overdue);
    }
    copy.append(title, date);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';
    actions.append(
      makeButton('Edit task', 'bx-pencil', 'icon-btn edit', () => startEdit(todo.id)),
      makeButton('Delete task', 'bx-trash', 'icon-btn delete', () => {
        todoList = todoList.filter(item => item.id !== todo.id);
        if (editingId === todo.id) resetForm();
        saveTodos();
        render();
        showToast('Task deleted');
      })
    );
    item.append(check, copy, actions);
    allTodos.append(item);
  });
}

setInterval(() => {
  todoList.forEach(task => {
    if (!task.complete && task.dueDate <= Date.now() && !notifiedTasks.has(task.id)) {
      notifiedTasks.add(task.id);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Task reminder', { body: `“${task.task}” is due.` });
      }
    }
  });
}, 1000);

render();
resizeInput();
