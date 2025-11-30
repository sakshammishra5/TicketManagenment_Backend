const express = require("express");
const router = express.Router();
const Client = require("../model/clientSchema")
const Ticket = require("../model/ticketSchema");
const verifyToken = require("../middleware/authMiddleware");

router.post("/createTicket", async (req, res) => {
  try {

    const { name, phone, email, message } = req.body;
    const adminId = "692c3e61fef7bf8244b27441"; // who owns this chatbot

    let client = await Client.findOne({ email, owner: adminId });


    // client creation
    if (!client) {
      client = await Client.create({ name, phone, email, owner: adminId });
    }


    // creation of the ticket
    const ticket = await Ticket.create({
      client: client._id,
      owner: adminId,
      assignedTo: adminId,
      subject: "New Chat",
      messages: [
        {
          senderType: "client",
          text: message,
        },
      ]
    });

    res.status(201).json({
      clientId: client._id,
      ticketId: ticket._id,
      ticket,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to start chat" });

  }
})

router.get("/getTickets", verifyToken, async (req, res) => {
  try {
    const adminId = req.user._id; // logged-in admin or teammate

    const tickets = await Ticket.find({ owner: adminId })
      .populate("client", "name phone email")   // include client details
      .populate("assignedTo", "firstName lastName email") // who is handling the ticket
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
})

// getting a particular ticket
router.get("/getParticularTicket/:ticketId", verifyToken, async (req, res) => {
  try {
    
    const { ticketId } = req.params;
    console.log(ticketId)
    const adminId = req.user._id; // logged-in admin or teammate

    // Find ticket and ensure it belongs to this admin's workspace
    const ticket = await Ticket.findOne({
      _id: ticketId,
      owner: adminId,   // important: prevents other admins from accessing
    })
      .populate("client", "name phone email")
      .populate("assignedTo", "firstName lastName email role")
      .lean(); // convert to plain JS object (easier to send to frontend)

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Sort messages by timestamp (old → new)
    ticket.messages.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    res.status(200).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch ticket" });
  }
})


// admin sending the reply
router.post("/reply/:ticketId", verifyToken, async (req, res) => {
  try {
    console.log("req.body ",req.body)
    const { ticketId } = req.params;
    const { text } = req.body;
    const userId = req.user._id; // admin or teammate sending the reply

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Find ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Only allow replies if user belongs to this workspace
    if (ticket.owner.toString() !== userId.toString() &&
      ticket.assignedTo.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not assigned to this ticket"
      });
    }

    // Add admin/teammate message
    ticket.messages.push({
      senderType: "admin",
      sender: userId,
      text,
    });

    await ticket.save();

    // return updated ticket
    const updated = await Ticket.findById(ticketId)
      .populate("client", "name phone email")
      .populate("assignedTo", "firstName lastName email");

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send reply" });
  }
});


//  Route: Assign ticket to a teammate
router.patch("/assign/:ticketId", verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { userId } = req.body; // teammate id to assign to
    const currentUserId = req.user._id; // logged-in admin

    // 1) find ticket and make sure it belongs to this admin
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // only the workspace owner can reassign (you can relax this if you want)
    if (ticket.owner.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Not allowed to assign this ticket" });
    }

    // 2) check that the teammate exists
    const assignee = await User.findById(userId);
    if (!assignee) {
      return res.status(404).json({ message: "Assignee user not found" });
    }

    // (optional) if you keep teamMembers on admin, check membership:
    // const isTeammate = currentUser.teamMembers.includes(userId)
    // if (!isTeammate) return res.status(400).json({ message: "User is not your teammate" });

    // 3) assign the ticket
    ticket.assignedTo = assignee._id;
    await ticket.save();

    // 4) return updated ticket (populated)
    const updated = await Ticket.findById(ticketId)
      .populate("client", "name phone email")
      .populate("assignedTo", "firstName lastName email role");

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to assign ticket" });
  }
});

// PATCH /tickets/:ticketId/status
router.patch("/changeStatus/:ticketId", verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    // validate status
    const allowed = ["open", "pending", "closed"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Allowed: open, pending, closed" });
    }

    // normalize current user id (depends on your verifyToken)
    const currentUserId = typeof req.user === "string"
      ? req.user
      : (req.user && (req.user._id || req.user.id)) || null;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // find ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // permission check: allow if owner or assignedTo
    const isOwner = ticket.owner && ticket.owner.toString() === currentUserId.toString();
    const isAssignee = ticket.assignedTo && ticket.assignedTo.toString() === currentUserId.toString();

    if (!isOwner && !isAssignee) {
      return res.status(403).json({ message: "Not allowed to change status of this ticket" });
    }

    // update status
    ticket.status = status;
    await ticket.save();

    // return populated updated ticket
    const updated = await Ticket.findById(ticketId)
      .populate("client", "name phone email")
      .populate("assignedTo", "firstName lastName email role");

    return res.status(200).json({ message: "Status updated", ticket: updated });
  } catch (err) {
    console.error("Update status error:", err);
    return res.status(500).json({ message: "Failed to update status", error: String(err) });
  }
});





module.exports = router