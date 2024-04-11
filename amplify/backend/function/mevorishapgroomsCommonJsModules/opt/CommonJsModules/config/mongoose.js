const mongoose = require("mongoose");
const env = require("./env");

mongoose.plugin(require("../models/plugins/toJSON"));

const mongodbUriWithDb = env.MONGODB_URI.replace(
  /\$\{MONGODB_DATABASE\}/,
  env.MONGODB_DATABASE
);

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(mongodbUriWithDb, {
      autoIndex: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
};

module.exports = connectToMongoDB;
