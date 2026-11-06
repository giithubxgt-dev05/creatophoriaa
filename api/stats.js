module.exports = (req, res) => {
  req.query = req.query || {};
  req.query.action = 'stats';
  return require('./leads.js')(req, res);
};
