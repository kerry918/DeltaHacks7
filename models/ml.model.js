const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const mlSchema = new Schema(
  {
    username: {
      type: String,
    },
    model: {
      type: Object,
    },
    classes: {
      type: Array,
    },
  },
  {
    timestamps: true,
  }
);

const ML = mongoose.model("ML", mlSchema);

module.exports = ML;
