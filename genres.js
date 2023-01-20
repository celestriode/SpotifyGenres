import axios, { AxiosHeaders } from 'axios';
import url from 'url';

export class Genres
{
    /**
     * Hostname for the playlist link.
     */
    spotify_hostname = 'open.spotify.com';

    /**
     * API endpoint for accessing Spotify playlist data. The playlist ID must be concatenated.
     */
    playlist_endpoint = 'https://api.spotify.com/v1/playlists/'; // + {playlist_id}';

    /**
     * API endpoint for accessing Spotify artist data. The artist ID must be concatenated.
     */
    artist_endpoint = 'https://api.spotify.com/v1/artists/'; // + {artist_id}';

    /**
     * The auth token for accessing the API.
     */
    token = '';

    /**
     * Generated configuration based on the token.
     */
    axios_config = {};

    constructor(token)
    {
        this.token = token;
        this.axios_config = {
            headers: {
                Authorization: 'Bearer ' + this.token
            }
        };
    }

    /**
     * Returns genre statistics from a given playlist.
     * 
     * @param {string} playlist_input A playlist link or ID.
     * @returns An object containing all genres, their frequencies, and the total number of genres across all songs.
     */
    async getStatsFromPlaylist(playlist_input)
    {
        const playlist_id = this.getIDFromInput(playlist_input);

        // Get the track listing for the playlist.

        const tracks = await this.getTracksFromPlaylist(playlist_id);

        // Get the list of artists from all the songs in the playlist.

        const artists = this.getArtistsFromTracks(tracks);

        // Get the list of genres for all artists in the playlist.

        return await this.getGenresFromArtists(artists);
    }

    /**
     * Looks up the genres for each artist and tallies them up.
     * 
     * @param {array} artists An array of promises, which are individual artists.
     * @returns Genre statistics
     */
    async getGenresFromArtists(artists)
    {
        let stats = {
            genres: {},
            total: 0
        };
        let genres = [];

        // Cycle through each promise.

        for (const artist_promise of artists) {

            // Fulfill the promise.

            await artist_promise.then(artist => {

                // For each of the artist's genre...

                for (const genre of artist.genres) {

                    // If the genre is tracked, increment its tally.

                    if (genre in stats.genres) {

                        stats.genres[genre] = stats.genres[genre] + 1;
                    } else {

                        // Otherwise track it anew.

                        stats.genres[genre] = 1;
                    }

                    // And then increment the total.

                    stats.total = stats.total + 1;
                }
            });
        }

        // Return the statistics.

        return stats;
    }

    /**
     * Returns the track listing of a playlist.
     * 
     * @param {string} playlist_id The ID of the playlist.
     * @returns The tracks of the playlist.
     */
    getTracksFromPlaylist(playlist_id)
    {
        return axios.get(this.playlist_endpoint + playlist_id, this.axios_config).then(res => res.data.tracks.items);
    }

    /**
     * Gets a list of all artists, including duplicates, from the given track listing.
     * 
     * @param {array} tracks The list of tracks for a playlist.
     * @returns A list of non-unique artists from the playlist.
     */
    getArtistsFromTracks(tracks)
    {
        let all_artists = [];

        for (const track of tracks) {

            const artists = this.getArtistsFromTrack(track);
            all_artists = all_artists.concat(artists);
        }

        return all_artists;
    }

    /**
     * Returns a list of artists for a single track.
     * 
     * @param {object} track A single track.
     * @returns A list of artists for that track (typically 1, could be more).
     */
    getArtistsFromTrack(track)
    {
        let artists = [];

        for (const track_artist of track.track.artists) {

            const artist = this.getArtistFromID(track_artist.id);

            artists.push(artist);
        }

        return artists;
    }

    /**
     * Returns the data for an artist given an ID.
     * 
     * @param {string} artist_id The ID of the artist.
     * @returns Data for the artist in question.
     */
    getArtistFromID(artist_id)
    {
        return axios.get(this.artist_endpoint + artist_id, this.axios_config).then(res => res.data);
    }

    /**
     * Returns the Spotify playlist ID from raw input.
     * 
     * @param {string} input The input, being either a link to a Spotify playlist or the ID of a playlist.
     * @returns The string ID of the playlist, extracted from the URL or resupplied from the input.
     */
    getIDFromInput(input)
    {
        const parsedUrl = url.parse(input);
        let id;

        // If the host of the URL is correct, get the ID from the pathname.
        
        if (parsedUrl.host === this.spotify_hostname) {

            id = parsedUrl.pathname.substring(10);  // Substring to get past "/playlist/" in the URL.
        } else if (parsedUrl.host === null && parsedUrl.pathname !== null) {

            // Otherwise if the host is missing but the pathname exists, use that pathname alone.

            id = parsedUrl.pathname;
        } else {

            // Otherwise, there is not a valid input.

            throw new Error('Invalid input');
        }

        return id;
    }
}