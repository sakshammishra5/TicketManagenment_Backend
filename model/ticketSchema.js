const mongoose = require("mongoose");
const { messageSchema } = require("../model/messageSchema");
const ticketSchema = new mongoose.Schema(
    {
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true // admin who owns the chatbot
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // start with default admin
        },
        status: {
            type: String,
            enum: ["open", "pending", "closed"],
            default: "open"
        },

        subject: {
            type: String,
            default: "New Chat"
        },

        messages: [messageSchema]
    },
    { timestamps: true }
);

module.exports= mongoose.model("Ticket", ticketSchema);