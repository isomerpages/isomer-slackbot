/* eslint-disable */
// slugify function provided by Matthew Bryne
// source: https://gist.github.com/mathewbyrne/1280286
function slugify (name) {
  return name.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with '-'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple '-' with single '-'
    .replace(/^-+/, '') // Trim '-' from start of text
    .replace(/-+$/, '') // Trim '-' from end of text
}

// check for transforming text into useable form
function textTransform (text) {
  return text.toLowerCase().trim()
}

// get the default date for the date picker
function defaultDateGenerator () {
  // get the default date for the date picker
  const today = new Date()
  return`${today.getFullYear()}-${today.getMonth()}-05`
}

// function to check whether user can make the action based on a
// key-value map of whitelisted users

// export functions
module.exports = {
  slugify,
  textTransform,
  defaultDateGenerator,
}
