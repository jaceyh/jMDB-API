const express = require ('express'),
  fs = require('fs'), // import built in node modules fs and path 
  path = require('path'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan'),
  mongoose = require('mongoose'),
  Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const Tags = Models.Tag;
const Directors = Models.Director;

const app = express();

app.use(bodyParser.json());

//allow mongoose to connect to [cfDB]
mongoose.connect('mongodb://localhost:27017/[cfDB]', { useNewUrlParser: true, useUnifiedTopology: true });

// create a write stream (in append mode)
// a ‘log.txt’ file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}));

app.use('/documentation.html', express.static('public/documentation.html'));



// GET requests
app.get('/', (req, res) => {
  res.send('Welcome to jMDB');
  });

app.get('/movies', (req, res) => {
  Movies.find()
  .then((movies) => {
    res.status(200).json(movies);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('Error: ' + err);
  });
});  

app.get('/movies/:Name', (req, res) => {
  Movies.findOne({ Name: req.params.Name })
  .then(movie => {
  res.json(movie);
 })
 .catch(err => {
  console.error(err);
  res.status(500).send('Something broke!' + err);
 });
});

/*
app.get('/movies/director/:directorName', (req, res) => {
  populateDirector();
  Movies.findOne({ 'Director.Name' : req.params.directorName })
  .then(movie => {
  res.json(movie);
 })
 .catch(err => {
  console.error(err);
  res.status(500).send('Something broke!' + err);
 });
});

app.get('/movies/tags/:tags', (req, res) => {
    res.json(movies.find((movie) =>
      { return movie.tags === req.params.tags }));
  });
*/
  
app.get('/director/:Name', (req, res) => {
  Directors.findOne({ Name : req.params.Name})
  .then(director => {
    res.json(director);
  })
  .catch(err => {
    console.error(err);
    res.status(500).send('Something broke!' + err);
  });
});

// Get all users
app.get('/users', (req, res) => {
  Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
app.get('/users/:Username', (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


//POST requests

//Add a user
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post('/users', (req, res) => {
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + 'already exists');
      } else {
        Users
        .create({
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        })
        .then((user) =>{res.status(201).json(user)})
        .catch((error) => {
          console.error(error);
          res.status(500).send('Error:' + error);
        })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});



//DELETE user account request
app.delete('/user/delete/:id', (req, res) => {
  const { id } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    users = users.filter( user => user.id != id );
    res.status(201).send('User was deleted.');
  } else {
    res.status(400).send('User not found.')
  }
});


//PUT requests (add to favorites, add to watchlist, UPDATE user info)

// Update a user's info, by username
/* We’ll expect JSON in this format
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}*/
app.put('/users/:Username', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
    {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if(err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});


// Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
     $push: { FavoriteMovies: req.params.MovieID }
   },
   { new: true }, // This line makes sure that the updated document is returned
  (err, updatedUser) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    } else {
      res.json(updatedUser);
    }
  });
});


//DELETE Remove from favorites

//Delete a user by username
app.delete('/users/:Username', (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.delete('/user/:id/favorites/delete/:title', (req, res) => {
  const { id, movieTitle } = req.params;
  
  let user = users.find(user => user.id == id);

  user.favoriteMovies.filter(title => title !== movieTitle);
  res.status(200).send('The movie was deleted from your favorites.');
});


//POPULATE functions
  function populateDirector () {
  Movies.
  find().
  populate('Director').
  exec(function(Movie) {
      Movie.director.name = directorName;
    })
  };



//error handling with express
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  
// listen for requests
  app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
  });