// Load configurations
const config = require('../config/env');
const mongoose = require('mongoose');
const passport = require('passport');

module.exports.seed = (collection, model) => {
    const seedData = require(`./seeds/${collection}.json`);
    const seedModel = require(`../models/${model}`);
    mongoose.connect(config.database.name);
    mongoose.connection.on('connected', () => {
        seedModel.collection.drop((err) => {
            seedModel.collection.insert(seedData, (err, documents) => {
                if(!err) {
                    console.info(`Seeded collection ${collection}`);
                }
                else {
                    console.info(`Unable to seed collection ${collection}: ${err}`);
                }
                mongoose.disconnect();                     
            });
        });
    });
}