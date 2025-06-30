const CLIENT_ID = '862215580889-v7lu8b32b3rd6003butt1rjbtk0e9i2d.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

function onGapiLoad() {
    console.log('test');
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    clientId: CLIENT_ID,
    scope: SCOPES
  }).then(() => {
    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
    if (!isSignedIn) {
      gapi.auth2.getAuthInstance().signIn().then(listFiles);
    } else {
      listFiles();
    }
  });
}

function listFiles() {
  gapi.client.drive.files.list({
    pageSize: 10,
    fields: 'files(id, name, mimeType, webViewLink)'
  }).then(response => {
    const files = response.result.files;
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';
    files.forEach(file => {
      const link = document.createElement('div');
      link.textContent = `${file.name}`;
      link.style.cursor = 'pointer';
      link.onclick = () => {
        document.getElementById('viewer').src = file.webViewLink;
      };
      sidebar.appendChild(link);
    });
  });
}
