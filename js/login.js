import * as db from './database-functions.js';

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
		const { data: adminData, error: adminError } = await db.fetchAdminIdUsingEmail(email);

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
		const { data: selectData, error: selectErr } = await db.fetchStudentUsingNameAndEmail(name, email);

		// error handling again
		if (selectErr) {
			console.error('User fetch error.', selectErr);
			popUpNotification('Failed to fetch user.');
			return;
		}
		
		// if no user found, create new user
		if (!selectData || selectData.length === 0) {
			// insert new user
			const { data: insertUsers, error: insertUserErr } = await db.insertNewUser(name, email);

			if (insertUserErr) {
				console.error('User insert error.', insertUserErr);
				popUpNotification('Could not create user.');
				return;
			}
			
			// store userId in localStorage
			const insertedId = insertUsers[0].id;
			localStorage.setItem('userId', insertedId);
			
			const { error: initErr } = await db.initializeUserRowInNecessaryTables(insertedId);
			if (initErr) {
				console.error('Initialization error.', initErr);
				popUpNotification('Could not initialize user data.');
				return;
			}

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