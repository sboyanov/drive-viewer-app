// Replace this with your actual OAuth 2.0 client ID from Google Cloud Console
const CLIENT_ID = '862215580889-v7lu8b32b3rd6003butt1rjbtk0e9i2d.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

// These two variables track when both GIS and GAPI are initialized
let tokenClient;   // Will be initialized with GIS
let gapiInited = false;
let gisInited = false;

/**
 * Called automatically when the Google API script (`gapi.js`) finishes loading.
 * It loads the Drive API client configuration (discovery doc).
 */
function gapiLoaded() {
  console.log('123');
  //gapi.load('client', initializeGapiClient);
}

/**
 * Initializes the Google API client by loading the Drive API definitions.
 * Once done, marks `gapiInited` and tries to start the auth process.
 */
function initializeGapiClient() {
  gapi.client.init({
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  }).then(() => {
    gapiInited = true;
    maybeEnableAuth();
  });
}

/**
 * Called automatically when the full page is loaded.
 * This initializes the GIS token client which handles OAuth.
 */
window.onload = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      // Once the user authorizes, the token is passed here
      gapi.client.setToken(tokenResponse);
      updateStatus("Loading Drive files...");
      listFiles();
    },
  });

  gisInited = true;
  maybeEnableAuth();
};

/**
 * When both the Google API and Identity Services are ready,
 * this requests the access token, which will trigger the consent popup.
 */
function maybeEnableAuth() {
  if (gapiInited && gisInited) {
    tokenClient.requestAccessToken();
  }
}

/**
 * Calls the Drive API to list the user's files.
 * Displays them in the sidebar and loads selected file in the iframe.
 */
function listFiles() {
  gapi.client.drive.files.list({
    pageSize: 10,
    fields: "files(id, name, mimeType, webViewLink)"
  }).then(response => {
    const files = response.result.files;
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '<div id="loginStatus">Files:</div>';

    if (!files || files.length === 0) {
      sidebar.innerHTML += '<div>No files found.</div>';
      return;
    }

    files.forEach(file => {
      const div = document.createElement('div');
      div.textContent = file.name;
      div.style.cursor = 'pointer';
      div.style.padding = '6px 0';
      div.onclick = () => {
        // Show the file in the iframe using its webViewLink
        document.getElementById('viewer').src = file.webViewLink;
      };
      sidebar.appendChild(div);
    });
  }).catch(error => {
    updateStatus("Failed to list files: " + error.message);
    console.error(error);
  });
}

/**
 * Updates the text at the top of the sidebar (login status or loading messages).
 */
function updateStatus(msg) {
  const status = document.getElementById('loginStatus');
  if (status) status.textContent = msg;
}
