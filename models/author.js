const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for author's full name
AuthorSchema.virtual("name").get(function () {
  // To avoid errors in cases where an author does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case
  let fullname = "";
  if (this.first_name && this.family_name) {
    fullname = `${this.family_name}, ${this.first_name}`;
  }
  if (!this.first_name || !this.family_name) {
    fullname = "";
  }
  return fullname;
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/author/${this._id}`;
});

// Virtual for author's date of birth
AuthorSchema.virtual("formatted_date_of_birth").get(function() {
  // return formatted string if present or "unknown" if not
  return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED) : 'unknown';
});

// Virtual for author's date of death
AuthorSchema.virtual("formatted_date_of_death").get(function() {
  // return formatted string if present or blank string if not recorded
  return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED) : '';
});

// Virtual for author's date of birth formatted yyyy-mm-dd
AuthorSchema.virtual("isodate_of_birth").get(function() {
  return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toISODate() : '';
});

// Virtual for author's date of death formatted yyyy-mm-dd
AuthorSchema.virtual("isodate_of_death").get(function() {
  return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toISODate() : '';
});

// Export model
module.exports = mongoose.model("Author", AuthorSchema);
