const Genre = require('../models/genre');
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = (req, res) => {
  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, list_genres) {
      if (err) {
        return next(err);
      }
      //successful, so render
      res.render('genre_list', {
        title: 'Genre List',
        genre_list: list_genres,
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("genre_detail", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
  res.render("genre_form", {title: "Create Genre"});
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize name field
  body("name", "Genre name required") // check "name" field and send error "Genre name required" if fail
  .trim() // removes whitespace from start and end of string
  .isLength({ min: 1}) // checks string at least 1 char
  .escape(),  // removes HTML characters from the variable

  // Process request after validation and sanitization.
  (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create new genre object with escaped and trimmed data
      const genre = new Genre({name: req.body.name});
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("genre_form", {
          title: "Create Genre",
          genre,
          errors: errors.array(),
        });
        return;
      } else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
          if (err) {
            return next(err);
          }
  
          if (found_genre) {
            // Genre exists, redirect to its detail page.
            res.redirect(found_genre.url);
          } else {
            genre.save((err) => {
              if (err) {
                return next(err);
              }
              // Genre saved. Redirect to genre detail page.
              res.redirect(genre.url);
            });
          }
        });
      };  
  }
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  // get genre record and associated books
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books(callback) {
        Book.find( { genre: req.params.id}).exec(callback);
      }
    },
    (err, results) => {
      // if error, show error
      if (err)  {
        return (next, err)
      }
      // if no results, show genre list
      if (results.genre === null) {
        res.redirect('catalog/genres');
      }
      // successful, so render
        res.render("genre_delete", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genre_books
        });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  // get genre record and all associated books in parallel
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genre_books(callback) {
        Book.find( { genre: req.params.id}).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // success
      if (results.genre_books.length > 0) {
        // Author has books so render as per GET route
        res.render('author_delete', {
          title: 'Delete Genre',
          genre: results.genre,
          genre_books: results.genre_books,
        });
        return;
      }
      // Genre has no books. Delete object and redirect to the list of genres.
      Genre.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
          return next(err);
        }
        // success - go to author list
        res.redirect('/catalog/genres');
      });
    });
}

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  Genre.findById(req.params.id).exec((err, foundGenre) => {
     // if error, display error
     if (err) {
      return next(err);
    }
    // display author form on success
    res.render('genre_form', {
      title: 'Update Genre',
      genre: foundGenre,
    });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // validate and sanitize field
  body('name')
  .trim()
  .isLength({ min: 3, max: 100 })
  .escape()
  .withMessage('Genre must be 3-100 characters'),
  // proces request
  (req, res, next) => {
    const errors = validationResult(req);

    // create genre object with new name and extant id
    const genreUpdate = new Genre({
      name: req.body.name,
      _id: req.params.id
    });

    // if errors, render form again with sanitized values/error messages
    if (!errors.isEmpty()) {
      res.render('genre_form', {
        title: 'Update Genre',
        genre: genreUpdate,
        errors: errors.array(),
      });
      // if success, render
      res.render('author_form', {
        title: 'Update Genre',
        genre: req.body,
      });
      return;
    } else {
      // if data valid, update record
      Genre.findByIdAndUpdate(
        req.params.id,
        genreUpdate,
        {},
        function (err, updatedGenre) {
          if (err) {
            return next(err);
          }
          // successful so redirect to detail page
          res.redirect(updatedGenre.url);
        }
      );
    }
  }
];
