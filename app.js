import * as dotenv from 'dotenv'
import express from 'express';
import { engine } from 'express-handlebars';
import { Genres } from './genres.js';

dotenv.config()
const app = express();

// Setup.

app.engine('handlebars', engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.urlencoded({extended: false}));
app.use(express.json());

// Routing.

app.get('/', (req, res) => {

    res.render('home', {
        playlist: ''
    });
});

app.post('/', (req, res) => {

    // Get genres from the input using the Spotify API.

    const genresClass = new Genres(process.env.spotify_token);

    genresClass.getStatsFromPlaylist(req.body.playlist).then(stats => {

        // Sort the genres in decreasing order based on their frequency.

        let genres = Object.entries(stats.genres);
        genres = genres.sort((a, b) => b[1] - a[1]);

        // Transform the value into a percentage (2 decimal places).

        genres = genres.map(arr => [arr[0], (arr[1] / stats.total * 100).toFixed(2)]);

        // Render the "genres" page with the list of genres from the playlist.

        res.render('genres', {
            playlist: req.body.playlist,
            total: stats.total,
            genres: genres
        })}
    );

});

// Start the web server.

app.listen(process.env.web_port, () => {
    console.log(`Server started on port ${process.env.web_port}.`);
});
