// index.js
let swRegistration = null;
const notifiedTasks = new Set(); // Track notified tasks
var todoList = [];
var comdoList = [];
var remList = [];
var addButton = document.getElementById("add-button");
var todoInput = document.getElementById("todo-input");
var deleteAllButton = document.getElementById("delete-all");
var allTodos = document.getElementById("all-todos");
var deleteSButton = document.getElementById("delete-selected");

// Initial size settings
const initialHeight = todoInput.scrollHeight; // Get the initial height

// Set initial height to prevent extra rows initially
todoInput.style.height = initialHeight + "px";

// Event listener for Enter key
todoInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && e.shiftKey) {
    e.preventDefault(); // Prevent default Enter behavior for Shift+Enter
    todoInput.value += "\n"; // Add a new line
    adjustHeight(); // Adjust height based on content
  } else if (e.key === "Enter") {
    e.preventDefault(); // Prevent default Enter behavior
    add(); // Call your add function
  }
});

// Event listener for Down Arrow to move cursor down
todoInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    e.preventDefault(); // Prevent default down arrow behavior
    todoInput.value += "\n"; // Add a new line
    adjustHeight(); // Adjust height based on content
  }
});

// Adjust the rows of the textarea dynamically
todoInput.addEventListener("input", function () {
  // Reset height only if more than one line is present
  if (this.value.split("\n").length > 1) {
    adjustHeight(); // Adjust height based on scrollHeight
  } else {
    // Reset to initial height if there's text on one line or it's empty
    this.style.height = initialHeight + "px"; // Maintain initial height for single-line text
  }
});

// Function to adjust the textarea height
function adjustHeight() {
  todoInput.style.height = "auto"; // Reset the height to auto to shrink back if needed
  // Expand based on scrollHeight
  todoInput.style.height =
    Math.max(todoInput.scrollHeight, initialHeight) + "px";
}
// Initialize push notifications
async function initializePushNotifications() {
  try {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      console.log("Registering service worker...");

      swRegistration = await navigator.serviceWorker.register(
        "service-worker.js",
        {
          scope: "/frontend/",
          updateViaCache: "none",
        }
      );

      console.log("Service Worker registered:", swRegistration);

      if (Notification.permission === "granted") {
        console.log("Notification permission already granted");
      } else {
        const permission = await Notification.requestPermission();
        console.log("Notification permission status:", permission);
      }

      console.log("Push notification setup complete");
    } else {
      console.warn("Push messaging is not supported");
    }
  } catch (error) {
    console.error("Error setting up push notifications:", error);
  }
}

// Event listeners
addButton.addEventListener("click", add);
deleteAllButton.addEventListener("click", deleteAll);
deleteSButton.addEventListener("click", deleteS);

// Local Storage Functions
function saveToLocalStorage() {
  localStorage.setItem("todoList", JSON.stringify(todoList));
}

function loadFromLocalStorage() {
  const savedTodos = localStorage.getItem("todoList");
  if (savedTodos) {
    todoList = JSON.parse(savedTodos);
    update();
    addinmain(todoList);
  }
}

// Event delegation
document.addEventListener("click", (e) => {
  if (
    e.target.className.split(" ")[0] == "complete" ||
    e.target.className.split(" ")[0] == "ci"
  ) {
    completeTodo(e);
  }
  if (
    e.target.className.split(" ")[0] == "delete" ||
    e.target.className.split(" ")[0] == "di"
  ) {
    deleteTodo(e);
  }
  if (e.target.id == "all") viewAll();
  if (e.target.id == "rem") viewRemaining();
  if (e.target.id == "com") viewCompleted();
});

// Testing Functions
function addTestTask() {
  const now = new Date();
  const testDate = new Date(now.getTime() + 10000); // 10 seconds from now

  const newTask = {
    task: "Test Task - Due in 10 seconds",
    id: Date.now().toString(),
    complete: false,
    dueDate: testDate.getTime(),
  };

  todoList.push(newTask);
  update();
  addinmain(todoList);
  saveToLocalStorage();

  console.log(`Test task scheduled for: ${testDate.toLocaleString()}`);
}

function checkNotificationStatus() {
  console.log("Checking notification status...");
  console.log("Notification Permission:", Notification.permission);
  console.log("Service Worker Registration:", swRegistration);

  if (swRegistration) {
    console.log("Service Worker State:", swRegistration.active?.state);
  }
}

// Notification Function
async function notifyUser(task) {
  try {
    // Check if already notified
    if (notifiedTasks.has(task.id)) {
      return;
    }

    // Play alarm sound
    // var audio = new Audio("./resources/audio/alarm.mp3");
    // await audio.play();

    // Mark as notified
    notifiedTasks.add(task.id);

    if (Notification.permission === "granted" && swRegistration) {
      const options = {
        body: `Task "${task.task}" is due!`,
        icon: "./resources/images/notification-icon.png",
        badge: "./resources/images/notification-badge.png",
        vibrate: [100, 50, 100],
        data: {
          task: task,
          timestamp: Date.now(),
        },
        actions: [
          {
            action: "complete",
            title: "Mark Complete",
          },
          {
            action: "dismiss",
            title: "Dismiss",
          },
        ],
      };

      await swRegistration.showNotification("Task Reminder", options);
    }
  } catch (error) {
    console.error("Error showing notification:", error);
  }
}

// Task Management Functions
function update() {
  comdoList = todoList.filter((ele) => ele.complete);
  remList = todoList.filter((ele) => !ele.complete);
  document.getElementById("r-count").innerText = todoList.length.toString();
  document.getElementById("c-count").innerText = comdoList.length.toString();
}

function add() {
  var value = todoInput.value.trim();
  var dueDate = document.getElementById("dueDate").value;

  if (value === "" || dueDate === "") {
    alert("😮 Task and due date cannot be empty");
    return;
  }

  const dueDateTime = new Date(dueDate).getTime();

  const newTask = {
    task: value,
    id: Date.now().toString(),
    complete: false,
    dueDate: dueDateTime,
  };

  todoList.push(newTask);
  todoInput.value = "";
  document.getElementById("dueDate").value = "";
  todoInput.style.height = initialHeight + "px"; // Reset height after adding

  update();
  addinmain(todoList);
  saveToLocalStorage();
}

function addinmain(todoList) {
  allTodos.innerHTML = "";
  todoList.forEach((element) => {
    var x = `<li id=${element.id} class="todo-item">
                <div>
                    <p id="task"> ${element.complete
        ? `<strike>${element.task}</strike>`
        : element.task
      } </p>
                    <small class="text-gray-500">
                        Due on ${new Date(element.dueDate).toLocaleString()}
                    </small>
                </div>
                <div class="todo-actions">
                    <button class="complete btn btn-success">
                        <i class="ci bx bx-check bx-sm"></i>
                    </button>
                    <button class="delete btn btn-error" >
                        <i class="di bx bx-trash bx-sm"></i>
                    </button>
                </div>
            </li>`;
    allTodos.innerHTML += x;
  });
}

// Check tasks periodically
setInterval(() => {
  const now = Date.now();
  todoList.forEach((task) => {
    if (!task.complete && task.dueDate <= now) {
      notifyUser(task);
    }
  });
}, 1000);

// Task Actions
function deleteTodo(e) {
  var deleted = e.target.parentElement.parentElement.getAttribute("id");
  todoList = todoList.filter((ele) => ele.id != deleted);
  update();
  addinmain(todoList);
  saveToLocalStorage();
}

function completeTodo(e) {
  var completed = e.target.parentElement.parentElement.getAttribute("id");
  todoList.forEach((obj) => {
    if (obj.id == completed) {
      obj.complete = !obj.complete;
    }
  });
  update();
  addinmain(todoList);
  saveToLocalStorage();
}

function deleteAll() {
  todoList = [];
  update();
  addinmain(todoList);
  saveToLocalStorage();
}

function deleteS() {
  todoList = todoList.filter((ele) => !ele.complete);
  update();
  addinmain(todoList);
  saveToLocalStorage();
}

// View Filters
function viewCompleted() {
  addinmain(comdoList);
}

function viewRemaining() {
  addinmain(remList);
}

function viewAll() {
  addinmain(todoList);
}

document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  initializePushNotifications();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.action === "completeTask") {
        const taskId = event.data.taskId;
        markTaskComplete(taskId); // Call the function to complete the task
      }
    });
  }

  // Log initial status
  console.log("Initial Notification Permission:", Notification.permission);
  console.log("Service Worker Support:", "serviceWorker" in navigator);
});

function markTaskComplete(taskId) {
  todoList.forEach((task) => {
    if (task.id === taskId) {
      task.complete = true; // Mark the task as complete
    }
  });

  update(); // Update the UI
  addinmain(todoList); // Refresh the task list
  saveToLocalStorage(); // Save the updated list
}

async function initializePushNotifications() {
  try {
    // Fetch the VAPID public key from the backend
    const response = await fetch(
      "https://to-do-app-alpha-sepia.vercel.app/api/public-key"
    );
    const data = await response.json();
    const vapidPublicKey = data.publicKey;

    if ("serviceWorker" in navigator && "PushManager" in window) {
      console.log("Registering service worker...");

      swRegistration = await navigator.serviceWorker.register(
        "service-worker.js",
        {
          scope: "/frontend/",
          updateViaCache: "none",
        }
      );

      console.log("Service Worker registered:", swRegistration);

      if (Notification.permission === "granted") {
        console.log("Notification permission already granted");
      } else {
        const permission = await Notification.requestPermission();
        console.log("Notification permission status:", permission);
      }

      if (Notification.permission === "granted") {
        // Convert the VAPID public key to a Uint8Array (required by PushManager)
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // Subscribe the user to push notifications
        const subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey,
        });

        console.log("User subscribed to push notifications:", subscription);

        // Send the subscription to the backend
        await fetch("http://localhost:5000/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription),
        });

        console.log("Subscription sent to the server");
      }

      console.log("Push notification setup complete");
    } else {
      console.warn("Push messaging is not supported");
    }
  } catch (error) {
    console.error("Error setting up push notifications:", error);
  }
}

// Helper function to convert the base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
