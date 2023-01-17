const BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator');
const Book = require('../models/book');
const async = require("async");


// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find() // find all BookInstance objects
    .populate('book') // replace book id stored for each BookInstance with full Book content
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
        res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render('bookinstance_detail', {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, 'title').exec((err, books) => {
    if (err) {
      return next(err);
    }
    // render if successful
    // gets a list of all books (book_list) and passes it to the view bookinstance_form.pug (along with the title)
    res.render('bookinstance_form', {
      title: 'Create BookInstance',
      book_list: books,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields
  body('book', 'Book must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('status').escape(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true }) //
    .isISO8601()
    .toDate(),

  // process request after val and san
  (req, res, next) => {
    const errors = validationResult(req);

    // create BookInstance obj with escaped and trimmed data
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title').exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // render if successful
        res.render('bookinstance_form', {
          title: 'Create BookInstance',
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    }
    // Data from form is valid
    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }
      // successful: redirect to record
      res.redirect(bookinstance.url);
    });
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  // get book instance info
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      // return error if error
      if (err) {
        return next(err);
      }
      // return not found if no results
      if (bookinstance == null) {
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      // found, so render
      res.render('bookinstance_delete', {
        title: `Title: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findByIdAndDelete(req.params.id, (err) => {
    // if error, return error
    if (err) {
      return next(err);
    }
    // on success, return to book catalog
    res.redirect('/catalog/books');
  });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      // return error if error
      if (err) {
        return next(err);
      }
      // populate form if success
      res.render('bookinstance_update_form', {
        title: 'Update Copy',
        bookinstance,
      });
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
  // Get book, authors and genres for form.
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
      books: function (callback) {
        Book.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        // No results.
        var err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      res.render("bookinstance_form", {
        title: "Update  BookInstance",
        book_list: results.books,
        selected_book: results.bookinstance.book._id,
        bookinstance: results.bookinstance,
      });
    }
  );
};

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and current id.
    var bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors so render the form again, passing sanitized values and errors.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Update BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance: bookinstance,
        });
      });
      return;
    } else {
      // Data from form is valid.
      BookInstance.findByIdAndUpdate(
        req.params.id,
        bookinstance,
        {},
        function (err, newBookInstance) {
          if (err) {
            return next(err);
          }
          // Successful - redirect to detail page.
          res.redirect(newBookInstance.url);
        }
      );
    }
  },
];
