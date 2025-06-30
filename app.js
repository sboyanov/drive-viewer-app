    // Replace this with your own Google OAuth 2.0 Web Client ID
    const CLIENT_ID = '862215580889-v7lu8b32b3rd6003butt1rjbtk0e9i2d.apps.googleusercontent.com';

    // This runs once the GIS library has loaded
    window.onload = () => {
      // Initialize the Google Identity Service client
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse, // called after successful login
        auto_select: false, // Don't auto-select previously signed-in user
        ux_mode: 'popup' // Use 'popup' for traditional login or 'redirect' for full-page
      });

      // Render the Sign-In button directly into the page
      google.accounts.id.renderButton(
        document.getElementById('g_id_signin'),
        {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill'
        }
      );
    };

    /**
     * Called when the user successfully signs in.
     * Receives a Google ID token (JWT), which contains user info.
     */
    function handleCredentialResponse(response) {
      const jwt = response.credential;

      // Decode the ID token to extract basic user info
      const payload = JSON.parse(atob(jwt.split('.')[1]));

      // Display user info on the page
      document.getElementById('user-info').innerHTML = `
        <p><strong>Signed in as:</strong> ${payload.name}</p>
        <p><strong>Email:</strong> ${payload.email}</p>
        <img src="${payload.picture}" alt="User Picture" style="border-radius:50%; margin-top:10px;">
      `;

      // You can now use the ID token to authenticate requests to your server or call Google APIs
      console.log("ID Token: ", jwt);
    }