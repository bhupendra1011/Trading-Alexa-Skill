const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  contact_number: {
    type: Number,
    required: true,
    unique: true,
  },
  leadGenerated_on: {
    type: String,
    default: Date,
  },
  contactLead_on: {
    type: String,
    default: Date,
  },
});

// user.pre("save", function (next) {
//   now = new Date();
//   this.contactLead_on = now;
//   if (!this.leadGenerated_on) {
//     this.leadGenerated_on = now;
//   }
//   next();
// });

mongoose.model("User", userSchema);
