const express = require("express");
const app = express();
const PORT = 5000;
const mongoose = require("mongoose");
const router = require("./routes/auth.route");
const profileRouter = require("./routes/profile.route")
const teamRouter = require("./routes/team.route")
const ticketRouter = require("./routes/ticket.route")
const timeRouter = require("./routes/analytics.route")
const cors = require("cors")
require('dotenv').config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use("/auth", router);
app.use("/user", profileRouter)
app.use("/team", teamRouter)
app.use("/ticket", ticketRouter)
app.use("/analytics",timeRouter)

app.listen(PORT, async () => {
    await mongoose.connect(process.env.MONGO_URL, {
        dbName: "ticketManagement"
    })
    console.log("db connected!")
})