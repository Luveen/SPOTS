
const mongoose = require('mongoose');

const UserRegisterSchema = new mongoose.Schema({
//   1. ADD this field. Make it required and unique.
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  nic: {
    type: String,
    required: true,
  },
}, { timestamps: true }); // Adding timestamps is good practice

const NewUser = mongoose.model('users', UserRegisterSchema)
module.exports = NewUser;
