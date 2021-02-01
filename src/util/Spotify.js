let accessToken;

const clientID = "414ad7ecaaa54a539ad3b366d9ccbdff";
const redirectURI = "http://manujamming.surge.sh";

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }

    const spotifyUrl = window.location.href;
    const accessTokenTest = spotifyUrl.match(/access_token=([^&]*)/);
    const expirationDateTest = spotifyUrl.match(/expires_in=([^&]*)/);
    if (accessTokenTest && expirationDateTest) {
      accessToken = accessTokenTest[1];
      const expiresIn = Number(expirationDateTest[1]);
      window.setTimeout(() => (accessToken = ""), expiresIn * 1000);
      window.history.pushState("Access Token", null, "/");
      return accessToken;
    } else {
      const redirectUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
      window.location = redirectUrl;
    }
  },

  search(searchTerm) {
    const accessToken = Spotify.getAccessToken();
    const endPoint = `https://api.spotify.com/v1/search?type=track&q=${searchTerm}`;
    const header = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    return fetch(endPoint, header)
      .then(
        (response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Request failed!");
        },
        (networkError) => {
          console.log(networkError.message);
        }
      )
      .then((jsonResponse) => {
        if (!jsonResponse.tracks) {
          return [];
        }
        return jsonResponse.tracks.items.map((track) => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          uri: track.uri,
          preview_url: track.preview_url,
        }));
      });
  },

  savePlaylist(playlistName, trackURIs) {
    if (playlistName || trackURIs.length) {
      const accessToken = Spotify.getAccessToken();
      const headers = { Authorization: `Bearer ${accessToken}` };
      const endPoint = "https://api.spotify.com/v1/me";
      let userId;

      return fetch(endPoint, { headers: headers })
        .then(
          (response) => {
            if (response.ok) {
              return response.json();
            }
            throw new Error("Request failed!");
          },
          (networkError) => console.log(networkError.message)
        )
        .then((jsonResponse) => {
          userId = jsonResponse.id;
          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            headers: headers,
            method: "POST",
            body: JSON.stringify({ name: playlistName }),
          })
            .then((response) => response.json())
            .then((jsonResponse) => {
              const playlistId = jsonResponse.id;
              return fetch(
                `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
                {
                  headers: headers,
                  method: "POST",
                  body: JSON.stringify({ uris: trackURIs }),
                }
              );
            });
        });
    } else {
      return;
    }
  },
};

export default Spotify;
