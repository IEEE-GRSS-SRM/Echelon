// supabase client initialization
const SUPABASE_URL = 'https://asccuwumidjqcwdcmsrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzY2N1d3VtaWRqcWN3ZGNtc3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjk1OTQsImV4cCI6MjA2Njg0NTU5NH0.eqmYPNdSoIjvAxKFlR4c-xQzW4FomEWSEe7nv-X4mFU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// popup notification (tailwind-based)
function popUpNotification(message, type = 'error') {

	// get the popup element
	const popup = document.getElementById('pop-up');
	if (!popup) return alert(message);

	// remove all background colours as we will set them according to what the input type is (look at function parameters)
	popup.classList.remove('bg-red-500', 'bg-green-600', 'bg-yellow-500');
	// success = green, warn = yellow, error = red
	popup.classList.add(type === 'success' ? 'bg-green-600' : type === 'warn' ? 'bg-yellow-500' : 'bg-red-500');

	// set the message and show the popup
	popup.querySelector('h2').textContent = message;
	popup.setAttribute('data-position', 'down');
	popup.style.opacity = '1';

	// after 3 seconds, hide the popup
	setTimeout(() => {
		popup.setAttribute('data-position', 'up');
		popup.style.opacity = '0';
	}, 3000);

}

// google credential callback
// since it must be global (accessible from html), we attach it to the window object
window.handleCredentialResponse = async function(response) {
	try {
		// error handling
		if (!response || !response.credential) {
			popUpNotification('Invalid Google Response');
			return;
		}

		// unpack token
		const token = response.credential;
		const payload = JSON.parse(atob(token.split('.')[1]));
		const { name, email, picture } = payload;

		// validate SRM email
		if (!email || !email.endsWith('@srmist.edu.in')) {
			popUpNotification('Please use your SRM email address.');
			return;
		}
		
		// store basic info in localStorage
		// will be used across the app
		localStorage.setItem('userName', name);
		localStorage.setItem('userEmail', email);
		localStorage.setItem('userPicture', picture);

		// checks if whoever logs in is an admin
		const { data: adminData, error: adminError } = await supabaseClient
			.from('Admins')
			.select('email,id')
			.eq('email', email)
			.maybeSingle();

		if (adminError) {
			console.warn('Admin check error.', adminError);
		}
		
		// if a record is found, redirect to admin dashboard
		if (adminData) {
			localStorage.setItem('userId', adminData.id);
			window.location.href = '../html/admin-dashboard.html';
			return;
		}

		// we only reach here if the user is not an admin (then they are a user)
		// check if user exists
		const { data: selectData, error: selectErr } = await supabaseClient
			.from('Users')
			.select('*')
			.eq('name', name)
			.eq('email', email);

		// error handling again
		if (selectErr) {
			console.error('User fetch error.', selectErr);
			popUpNotification('Failed to fetch user.');
			return;
		}
		
		// if no user found, create new user
		if (!selectData || selectData.length === 0) {
			// insert new user
			const { data: insertUsers, error: insertUserErr } = await supabaseClient
				.from('Users')
				.insert([{ name, email }])
				.select();

			if (insertUserErr) {
				console.error('User insert error.', insertUserErr);
				popUpNotification('Could not create user.');
				return;
			}
			
			// store userId in localStorage
			const insertedId = insertUsers[0].id;
			localStorage.setItem('userId', insertedId);

			// create uploads row (will contain the things the user uploads)
			const { error: uploadsErr } = await supabaseClient
				.from('Uploads')
				.insert([{ user_id: insertedId }]);
			if (uploadsErr) console.warn('Uploads insert warning.', uploadsErr);

			// Create UploadsMarks row (will contain the marks for uploads, the marks will be entered by an admin)
			const { error: uploadsMarksErr } = await supabaseClient
				.from('UploadsMarks')
				.insert([{ user_id: insertedId }]);
			if (uploadsMarksErr) console.warn('UploadsMarks insert warning.', uploadsMarksErr);

			// since it's a new user, redirect to profile setup
			popUpNotification('Welcome! Redirecting...', 'success');
			setTimeout(() => {
				window.location.href = '../html/profile-setup.html';
			}, 600);
			return;
		}

		// existing user, store userId and redirect to student dashboard
		const userId = selectData[0].id;
		localStorage.setItem('userId', userId);

		popUpNotification('Login successful', 'success');
		setTimeout(() => {
			window.location.href = '../html/student-dashboard.html';
		}, 400);

	} catch (err) {
		// if any error just say something went wrong since we don't know what happened
		console.error('Unexpected login error.', err);
		popUpNotification('Unexpected error during login.');
	}
};

// is this necessary? probably not, but just in case
// fallback if Google script fails
window.addEventListener('DOMContentLoaded', () => {
	const fallbackBtn = document.getElementById('fallback-google-btn');
	setTimeout(() => {
		if (!window.google || !window.google.accounts || !window.google.accounts.id) {
			// if no google creds make button visible
			if (fallbackBtn) fallbackBtn.classList.remove('hidden');
		}
	}, 1500);
});