require("./models/User");

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;

const app = express();

const User = mongoose.model("User");

app.use(bodyParser.json());

/*URL TO ACCESS MONGODB */
const mongoUri =
  "mongodb+srv://admin:pass@cluster0.e1ifg.mongodb.net/leads_db?retryWrites=true&w=majority";

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
});

mongoose.connection.on("connected", () => {
  console.log("connected to mongoDB.com ");
});
mongoose.connection.on("error", (err) => {
  console.error("Error in connecting to mongo DB ", err);
});

app.get("/", (req, res) => {
  res.send(
    "welcome to open account api ,this is for lead generation of new users on trading platform"
  );
});

app.post("/openaccount", async (req, res) => {
  const { name, contact_number, contactLead_on } = req.body;
  if (!name || !contact_number)
    return res.status(422).send({
      error:
        "You must provide your name  and contact number for account creation",
    });
  try {
    const user = new User({ name, contact_number, contactLead_on });
    await user.save();
    res.send({
      suceess:
        "Thank you for your interest , to complete account verification process, our team would contact you soon.",
    });
  } catch (err) {
    return res.status(422).send({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`listening to port 3000 ${port}`);
});
