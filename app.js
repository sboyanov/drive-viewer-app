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
        document.getElementById('g_id_signin'),
        { theme: 'outline', size: 'large' }
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
        }
      });
    };

    /**
     * After user selects account, request access token.
     * This does not reload or redirect.
     */
  function handleIdToken(response) {
      // Optional: decode response.credential to inspect ID token.
      tokenClient.requestAccessToken(); // OAuth2 token for Drive API
  }
/**
 * Entry point: Finds the folder named "Мария" in root and loads its children.
 */
function loadMariaFolderTree() {
  gapi.load('client', async () => {
    await gapi.client.init({
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });

    gapi.client.setToken({ access_token: accessToken });

    // Step 1: Find the folder "Мария" at top level
    const response = await gapi.client.drive.files.list({
      q: "name = 'Мария' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false",
      fields: 'files(id, name)',
    });

    const folder = response.result.files?.[0];

    if (!folder) {
      document.getElementById('tree-root').innerHTML = '<li>Folder "Мария" not found.</li>';
      return;
    }

    // Step 2: Add "Мария" folder to tree
    const treeRoot = document.getElementById('tree-root');
    treeRoot.innerHTML = ''; // clear old content
    const li = createFolderListItem(folder.name, folder.id);
    treeRoot.appendChild(li);
  });
}

/**
 * Creates a <li> element for a folder, and loads children on first click.
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

/**
 * Lists subfolders for a given folder ID.
 */
async function getSubfolders(parentId) {
  const res = await gapi.client.drive.files.list({
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 50
  });
  return res.result.files;
}
