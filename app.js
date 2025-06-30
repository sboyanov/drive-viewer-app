const CLIENT_ID = '862215580889-v7lu8b32b3rd6003butt1rjbtk0e9i2d.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';


let tokenClient;   
let gapiInited = false;
let gisInited = false;


function gapiLoaded() {
  console.log('gapiLoaded');
  gapi.load('client', initializeGapiClient);
}

function initializeGapiClient() {
  console.log('initializeGapiClient');
  gapi.client.init({
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  }).then(() => {
    gapiInited = true;
    function onload();
  });
}

function onload()  {
  console.log('OnLoad');
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      // Once the user authorizes, the token is passed here 123
      gapi.client.setToken(tokenResponse);
      updateStatus("Loading Drive files...");
      listFiles();
    },
  });
  gisInited = true;
  maybeEnableAuth();
};

function maybeEnableAuth() {
  console.log('maybeEnableAuth');
  if (gapiInited && gisInited) {
    tokenClient.requestAccessToken();
  }
}

function listFiles() {
  console.log('ListFiles');
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

function updateStatus(msg) {
  console.log('updateStatus');
  const status = document.getElementById('loginStatus');
  if (status) status.textContent = msg;
}
