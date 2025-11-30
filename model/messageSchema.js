const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(
    {
        senderType: {
            type: String,
            enum: ["client", "admin"],
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // only for admin
            default: null
        },
        text: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

let Message = mongoose.model("Message", messageSchema)
module.exports = { Message, messageSchema }