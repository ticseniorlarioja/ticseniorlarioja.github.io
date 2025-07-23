// Variables globales
let isLoggedIn = false;
let participants = [];

// URLs de la API
const API_BASE = '/api';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Cargar participantes
    loadParticipants();
    
    // Event listeners
    document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
    document.getElementById('invitationForm').addEventListener('submit', handleInvitation);
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('showParticipants').addEventListener('click', toggleParticipantsList);
    document.getElementById('exportData').addEventListener('click', exportData);
}

// Funciones de utilidad
function showMessage(elementId, message, type = 'success') {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

function clearForm(formId) {
    document.getElementById(formId).reset();
}

// Cargar participantes
async function loadParticipants() {
    try {
        const response = await fetch(`${API_BASE}/participantes`);
        if (response.ok) {
            participants = await response.json();
            updateParticipantCount();
        }
    } catch (error) {
        console.error('Error cargando participantes:', error);
    }
}

function updateParticipantCount() {
    document.getElementById('participantCount').textContent = participants.length;
}

// Manejo de inscripciones
async function handleRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`${API_BASE}/participantes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('registrationMessage', '¡Inscripción realizada con éxito!', 'success');
            clearForm('registrationForm');
            loadParticipants();
        } else {
            const error = await response.json();
            showMessage('registrationMessage', error.error || 'Error en la inscripción', 'error');
        }
    } catch (error) {
        showMessage('registrationMessage', 'Error de conexión. Inténtalo de nuevo.', 'error');
    }
}

// Manejo de invitaciones
async function handleInvitation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const response = await fetch(`${API_BASE}/invitar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showMessage('invitationMessage', '¡Invitación enviada con éxito!', 'success');
            clearForm('invitationForm');
        } else {
            const error = await response.json();
            showMessage('invitationMessage', error.error || 'Error enviando invitación', 'error');
        }
    } catch (error) {
        showMessage('invitationMessage', 'Error de conexión. Inténtalo de nuevo.', 'error');
    }
}

// Manejo de login
async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage('loginMessage', 'Por favor, completa todos los campos', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            isLoggedIn = true;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            showMessage('loginMessage', '¡Sesión iniciada correctamente!', 'success');
        } else {
            showMessage('loginMessage', 'Credenciales incorrectas', 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Error de conexión. Inténtalo de nuevo.', 'error');
    }
}

// Manejo de logout
function handleLogout() {
    isLoggedIn = false;
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showMessage('loginMessage', 'Sesión cerrada', 'success');
}

// Mostrar/ocultar lista de participantes
function toggleParticipantsList() {
    const listEl = document.getElementById('participantsList');
    const btnEl = document.getElementById('showParticipants');
    
    if (listEl.style.display === 'none') {
        displayParticipants();
        listEl.style.display = 'block';
        btnEl.textContent = 'Ocultar Lista';
    } else {
        listEl.style.display = 'none';
        btnEl.textContent = 'Ver Lista de Inscritos';
    }
}

function displayParticipants() {
    const listEl = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        listEl.innerHTML = '<p>No hay participantes inscritos aún.</p>';
        return;
    }
    
    const html = participants.map(participant => `
        <div class="participant-item">
            <div class="participant-name">${participant.nombre} ${participant.apellidos}</div>
            <div class="participant-details">
                Email: ${participant.email}
                ${participant.telefono ? ` | Teléfono: ${participant.telefono}` : ''}
                ${participant.empresa ? ` | Empresa: ${participant.empresa}` : ''}
                ${participant.cargo ? ` | Cargo: ${participant.cargo}` : ''}
            </div>
            ${participant.comentarios ? `<div class="participant-details">Comentarios: ${participant.comentarios}</div>` : ''}
        </div>
    `).join('');
    
    listEl.innerHTML = html;
}

// Exportar datos (solo para administradores)
async function exportData() {
    if (!isLoggedIn) {
        showMessage('loginMessage', 'Debes iniciar sesión para exportar datos', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/participantes/export`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `participantes_evento_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            showMessage('loginMessage', 'Error exportando datos', 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Error de conexión', 'error');
    }
}

// Validación de formularios en tiempo real
document.addEventListener('input', function(e) {
    if (e.target.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (e.target.value && !emailRegex.test(e.target.value)) {
            e.target.style.borderColor = '#e74c3c';
        } else {
            e.target.style.borderColor = '#ecf0f1';
        }
    }
});

// Efectos visuales
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn')) {
        e.target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
    }
});

