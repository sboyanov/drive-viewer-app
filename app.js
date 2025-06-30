    const CLIENT_ID = '862215580889-v7lu8b32b3rd6003butt1rjbtk0e9i2d.apps.googleusercontent.com'; // Replace this
    const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

    let tokenClient;
    let accessToken = null;

    /**
     * On load: Initialize Sign-In button and token client.
     */
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
     * Loads Google Drive API and lists user's files.
     */
    function listDriveFiles() {
      gapi.load('client', async () => {
        await gapi.client.init({
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });

        gapi.client.setToken({ access_token: accessToken });

        const response = await gapi.client.drive.files.list({
          pageSize: 10,
          fields: 'files(id, name)',
        });

        const files = response.result.files;
        const list = document.getElementById('file-list');
        list.innerHTML = '';

        if (!files || files.length === 0) {
          list.innerHTML = '<li>No files found.</li>';
        } else {
          files.forEach(file => {
            const li = document.createElement('li');
            li.textContent = `${file.name} (${file.id})`;
            list.appendChild(li);
          });
        }
      });
    }