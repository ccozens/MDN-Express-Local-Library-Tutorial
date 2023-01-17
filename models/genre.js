const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GenreSchema = new Schema({
    name: { type: String, minLength: 3, maxLength: 100},
});

// Virtual for genre's url
GenreSchema.virtual("url").get(function () {
    // don't use an arrow function as we'll need the this object
    return `/catalog/genre/${this._id}`;
})

// export
module.exports = mongoose.model("Genre", GenreSchema);