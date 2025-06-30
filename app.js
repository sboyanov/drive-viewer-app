const CLIENT_ID = '862215580889-v7lu8b32b3rd6003butt1rjbtk0e9i2d.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

function initializeGapiClient() {
  gapi.client.init({
    apiKey: '', // Optional, only needed for public APIs
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  }).then(() => {
    gapiInited = true;
    maybeEnableAuth();
  });
}

window.onload = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      gapi.client.setToken(tokenResponse);
      listFiles();
    },
  });

  gisInited = true;
  maybeEnableAuth();
};

function maybeEnableAuth() {
  if (gapiInited && gisInited) {
    // Show a login button if you want — or auto sign-in:
    tokenClient.requestAccessToken();
  }
}

function listFiles() {
  gapi.client.drive.files.list({
    pageSize: 10,
    fields: "files(id, name, mimeType, webViewLink)"
  }).then(response => {
    const files = response.result.files;
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';
    files.forEach(file => {
      const div = document.createElement('div');
      div.textContent = file.name;
      div.style.cursor = 'pointer';
      div.onclick = () => {
        document.getElementById('viewer').src = file.webViewLink;
      };
      sidebar.appendChild(div);
    });
  });
}