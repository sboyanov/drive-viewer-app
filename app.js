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
/**
 * Loads the folder tree starting from children of the "Мария" folder.
 * Includes files (PDFs only) and folders.
 */
function loadMariaSubfoldersTree() {
  gapi.load('client', async () => {
    await gapi.client.init({
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });

    gapi.client.setToken({ access_token: accessToken });

    // Find "Мария" folder in root
    const response = await gapi.client.drive.files.list({
      q: "name = 'Мария' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false",
      fields: 'files(id, name)',
    });

    const maria = response.result.files?.[0];

    if (!maria) {
      document.getElementById('tree-root').innerHTML = '<li>"Мария" folder not found.</li>';
      return;
    }

    const children = await getFilesAndFolders(maria.id);
    renderFolderTree(children, document.getElementById('tree-root'));
  });
}

/**
 * Renders a list of folders and files under a given UL element.
 */
function renderFolderTree(items, parentUL) {
  parentUL.innerHTML = '';

  if (items.length === 0) {
    parentUL.innerHTML = '<li>(No items)</li>';
    return;
  }

  // Sort: Files first, then folders
  items.sort((a, b) => {
    if (a.mimeType !== b.mimeType) {
      return a.mimeType.startsWith('application/') ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  items.forEach(item => {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      parentUL.appendChild(createFolderListItem(item.name, item.id));
    } else if (item.mimeType === 'application/pdf') {
      parentUL.appendChild(createFileListItem(item.name, item.id));
    }
  });
}

/**
 * Creates a folder list item with lazy-loading on click.
 */
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
      const children = await getFilesAndFolders(folderId);
      renderFolderTree(children, ul);
      loaded = true;
    }
  });

  return li;
}

/**
 * Creates a file item (PDF only) that loads in iframe on click.
 */
function createFileListItem(name, fileId) {
  const li = document.createElement('li');
  li.className = 'folder-item';

  const span = document.createElement('span');
  span.textContent = `📄 ${name}`;
  span.style.color = '#1a73e8'; // blue highlight
  span.addEventListener('click', () => {
    const iframe = document.getElementById('file-frame');
    iframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
  });

  li.appendChild(span);
  return li;
}

/**
 * Gets both files (PDF) and folders under a given parent.
 */
async function getFilesAndFolders(parentId) {
  const res = await gapi.client.drive.files.list({
    q: `'${parentId}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/pdf')`,
    fields: 'files(id, name, mimeType)',
    pageSize: 100,
  });
  return res.result.files;
}
