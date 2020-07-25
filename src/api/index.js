const { Router } = require('express');
const { version } = require('../package.json');

const UserAPI = require('./user');
const MemoAPI = require('./memo');
const FacilityAPI = require('./facility');

module.exports = () => {
	const API = Router();

	// routing setting
	API.use('/users', UserAPI);
	API.use('/memos', MemoAPI);
	API.use('/facilities', FacilityAPI);

	API.get('/', (req, res) => {
		res.status(200).send({ result: 'hello world' });
		res.end();
	});

	API.get('/api', (req, res) => {
		res.status(200).json({ version });
	});

	return API;
};