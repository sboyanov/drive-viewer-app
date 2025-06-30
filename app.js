const CLIENT_ID = '862215580889-v7lu8b32b3rd6003butt1rjbtk0e9i2d.apps.googleusercontent.com'; // Replace this
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

let tokenClient;
let accessToken = null;

window.onload = () => {
	// Render the embedded Sign-In button
	google.accounts.id.initialize({
		client_id: CLIENT_ID,
		callback: handleIdToken, // triggered after user selects account
		auto_select: false,
		ux_mode: 'popup'
	});

	google.accounts.id.renderButton(
		document.getElementById('g_id_signin'), {
			theme: 'outline',
			size: 'large'
		}
	);

	// Prepare OAuth token client (for Drive API access)
	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: CLIENT_ID,
		scope: SCOPES,
		callback: (tokenResponse) => {
			if (tokenResponse.error) {
				console.error(tokenResponse);
				return;
			}
			accessToken = tokenResponse.access_token;
			document.getElementById('login-div').style.display = 'none';
			document.getElementById('content').style.display = 'block';
			loadMariaSubfoldersTree();
		}
	});
};

function handleIdToken(response) {
	// Optional: decode response.credential to inspect ID token.
	tokenClient.requestAccessToken(); // OAuth2 token for Drive API
}

function loadMariaSubfoldersTree() {
	gapi.load('client', async () => {
		await gapi.client.init({
			discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
		});

		gapi.client.setToken({
			access_token: accessToken
		});

		// Find folder "Мария"
		const response = await gapi.client.drive.files.list({
			q: "name = 'Мария' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false",
			fields: 'files(name,id)',
		});

		const maria = response.result.files?.[0];

		if (!maria) {
			console.error('Maria folder not found');
			return;
		}

		const children = await getSubfolders(maria.id);
		const rootList = document.getElementById('tree-root');
		rootList.innerHTML = '';

		if (children.length === 0) {
			console.error('No children');
		} else {
			children.forEach(child => {
				rootList.appendChild(createFolderListItem(child.name, child.id));
			});
		}
	});
}

function createFolderListItem(name, folderId) {
	const li = document.createElement('li');
	li.className = 'folder-item';

	const span = document.createElement('span');
	span.textContent = `📁 ${name}`;
	li.appendChild(span);

	const ul = document.createElement('ul');
	ul.className = 'folder';
	ul.style.display = 'none';
	li.appendChild(ul);

	let loaded = false;

	span.addEventListener('click', async () => {
		ul.style.display = ul.style.display === 'none' ? 'block' : 'none';

		if (!loaded && ul.style.display === 'block') {
			const children = await getSubfolders(folderId);
			if (children.length === 0) {
				const empty = document.createElement('li');
				empty.textContent = '(No subfolders)';
				ul.appendChild(empty);
			} else {
				children.forEach(child => {
					ul.appendChild(createFolderListItem(child.name, child.id));
				});
			}
			loaded = true;
		}
	});

	return li;
}

async function getSubfolders(parentId) {
	const res = await gapi.client.drive.files.list({
		q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
		fields: 'files(id, name)',
		pageSize: 50
	});
	return res.result.files;
}