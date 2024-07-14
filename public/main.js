const socket = io('https://127.0.0.1:3000', { secure: true });

let currentUser = null;
let selectedUser = null;

const modal = document.getElementById('auth-modal');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const closeButton = document.getElementsByClassName('close')[0];
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginSubmit = document.getElementById('login-submit');
const registerSubmit = document.getElementById('register-submit');
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('chat-messages');
const currentUserDisplay = document.getElementById('current-user');
const userList = document.getElementById('user-list');
const chattingWithDisplay = document.getElementById('chatting-with');

// Modal control
loginButton.onclick = () => {
    modal.style.display = 'block';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
};

logoutButton.onclick = () => {
    socket.emit('user disconnected', currentUser);
    currentUser = null;
    selectedUser = null;
    currentUserDisplay.textContent = 'Not Logged In';
    //chattingWithDisplay.textContent = 'None';
    loginButton.style.display = 'block';
    logoutButton.style.display = 'none';
    userList.innerHTML = ''; // Clear the user list
    chatMessages.innerHTML = ''; // Clear chat messages
};

closeButton.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

showRegisterLink.onclick = () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
};

showLoginLink.onclick = () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
};

loginSubmit.addEventListener('click', async () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('https://127.0.0.1:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
        });
        
        if (response.ok) {
            currentUser = username;
            modal.style.display = 'none';
            currentUserDisplay.textContent = username;
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';   
            socket.emit('user connected', username);
            fetchUserList();
        } else {
            alert('Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

registerSubmit.addEventListener('click', async () => {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('https://127.0.0.1:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
        });
        
        if (response.ok) {
            alert('Registration successful. Please log in.');
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        } else {
            alert('Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

// Chat functionality
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    
    if (currentUser && selectedUser) {
        socket.emit('chat message', {
            from: currentUser,
            to: selectedUser,
            content: msg
        });
    } else {
        alert('You must be logged in and select a user to send messages.');
        modal.style.display = 'block';
    }

    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

socket.on('chat message', (msg) => {
    if (msg.from === selectedUser || msg.to === selectedUser) {
        outputMessage(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

function outputMessage(msg) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${msg.from} <span>${new Date().toLocaleTimeString()}</span></p>
    <p class="text meta">${msg.content}</p>`;
    chatMessages.appendChild(div);
}

async function fetchUserList() {
    try {
        const response = await fetch(`https://127.0.0.1:3000/users?exclude=${currentUser}`);
        const users = await response.json();
        userList.innerHTML = '';
        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.classList.add('user');
            userDiv.textContent = user.username;
            userDiv.onclick = () => selectUser(user.username);
            userList.appendChild(userDiv);
        });
    } catch (error) {
        console.error('Error fetching user list:', error);
    }
}

function selectUser(username) {
    selectedUser = username;
    document.querySelectorAll('.user').forEach(user => {
        user.classList.remove('selected');
    });
    document.querySelector(`.user:contains(${username})`).classList.add('selected');
    chattingWithDisplay.textContent = username;
}
