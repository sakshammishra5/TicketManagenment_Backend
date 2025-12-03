const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(
    {
        senderType: {
            type: String,
            enum: ["client", "admin","User"],
            required: true
        },
        sender: {
            type: String, // only for admin
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