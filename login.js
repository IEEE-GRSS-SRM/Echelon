// Supabase initialization
const SUPABASE_URL = 'https://asccuwumidjqcwdcmsrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzY2N1d3VtaWRqcWN3ZGNtc3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjk1OTQsImV4cCI6MjA2Njg0NTU5NH0.eqmYPNdSoIjvAxKFlR4c-xQzW4FomEWSEe7nv-X4mFU';
let supabaseClient;

try {
	supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
	console.error('Failed to initialize Supabase client', e);
}

// Popup notification (Tailwind-based)
function popUpNotification(message, type = 'error') {
	const popup = document.getElementById('pop-up');
	if (!popup) return alert(message);
	popup.classList.remove('bg-red-500', 'bg-green-600', 'bg-yellow-500');
	popup.classList.add(type === 'success' ? 'bg-green-600' : type === 'warn' ? 'bg-yellow-500' : 'bg-red-500');
	popup.querySelector('h2').textContent = message;
	popup.setAttribute('data-position', 'down');
	popup.style.opacity = '1';
	setTimeout(() => {
		popup.setAttribute('data-position', 'up');
		popup.style.opacity = '0';
	}, 3000);
}

// Google Credential callback (must be global)
window.handleCredentialResponse = async function(response) {
	try {
		if (!response || !response.credential) {
			popUpNotification('Invalid Google response');
			return;
		}

		const token = response.credential;
		const payload = JSON.parse(atob(token.split('.')[1]));
		const { name, email, picture } = payload;

		if (!email || !email.endsWith('@srmist.edu.in')) {
			popUpNotification('Please use your SRM email address.');
			return;
		}

		localStorage.setItem('userName', name);
		localStorage.setItem('userEmail', email);
		localStorage.setItem('userPicture', picture);

		if (!supabaseClient) {
			popUpNotification('Supabase not ready');
			return;
		}

		// Admin check
		const { data: adminData, error: adminError } = await supabaseClient
			.from('Admins')
			.select('email,id')
			.eq('email', email)
			.maybeSingle();

		if (adminError) {
			console.warn('Admin check error', adminError);
		}

		if (adminData) {
			localStorage.setItem('userId', adminData.id);
			window.location.href = 'admin-dashboard.html';
			return;
		}

		// Existing user lookup
		const { data: selectData, error: selectErr } = await supabaseClient
			.from('Users')
			.select('*')
			.eq('name', name)
			.eq('email', email);

		if (selectErr) {
			console.error('User fetch error', selectErr);
			popUpNotification('Failed to fetch user.');
			return;
		}

		if (!selectData || selectData.length === 0) {
			// Insert new user
			const { data: insertUsers, error: insertUserErr } = await supabaseClient
				.from('Users')
				.insert([{ name, email }])
				.select();

			if (insertUserErr) {
				console.error('User insert error', insertUserErr);
				popUpNotification('Could not create user.');
				return;
			}

			const insertedId = insertUsers[0].id;
			localStorage.setItem('userId', insertedId);

			// Create Uploads row
			const { error: uploadsErr } = await supabaseClient
				.from('Uploads')
				.insert([{ user_id: insertedId }]);
			if (uploadsErr) console.warn('Uploads insert warning', uploadsErr);

			// Create UploadsMarks row
			const { error: uploadsMarksErr } = await supabaseClient
				.from('UploadsMarks')
				.insert([{ user_id: insertedId }]);
			if (uploadsMarksErr) console.warn('UploadsMarks insert warning', uploadsMarksErr);

			popUpNotification('Welcome! Redirecting...', 'success');
			setTimeout(() => {
				window.location.href = 'profile-setup.html';
			}, 600);
			return;
		}

		const userId = selectData[0].id;
		localStorage.setItem('userId', userId);
		popUpNotification('Login successful', 'success');
		setTimeout(() => {
			window.location.href = 'student-dashboard.html';
		}, 400);
	} catch (err) {
		console.error('Unexpected login error', err);
		popUpNotification('Unexpected error during login');
	}
};

// Fallback if Google script fails
window.addEventListener('DOMContentLoaded', () => {
	const fallbackBtn = document.getElementById('fallback-google-btn');
	setTimeout(() => {
		if (!window.google || !window.google.accounts || !window.google.accounts.id) {
			if (fallbackBtn) fallbackBtn.classList.remove('hidden');
		}
	}, 1500);
});

