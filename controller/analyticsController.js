const Ticket = require("../model/ticketSchema"); 

const getDashboardStats = async (req, res) => {
  try {
    const ownerId = req.user._id; // Assumes you have auth middleware
    const { startDate, endDate } = req.query;

    // 1. Build Query
    let query = { owner: ownerId };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // 2. Fetch Tickets (Project only necessary fields for speed)
    const tickets = await Ticket.find(query)
      .select("status messages createdAt")
      .lean();

    // 3. Initialize Variables
    let totalChats = tickets.length;
    let closedChats = 0;
    
    // Variables for Reply Time
    let totalReplyTimeMs = 0;
    let totalResponseCount = 0;

    // 4. Single Loop Calculation
    tickets.forEach((ticket) => {
      // --- Metric: Resolved Tickets ---
      if (ticket.status === "closed") {
        closedChats++;
      }

      // --- Metric: Average Reply Time ---
      // We sort messages to ensure time accuracy
      const sortedMessages = ticket.messages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      let pendingClientMessageTime = null;

      sortedMessages.forEach((msg) => {
        // If Client sends a message, start the timer
        if (msg.senderType === "client") {
          if (!pendingClientMessageTime) {
            pendingClientMessageTime = new Date(msg.createdAt).getTime();
          }
        } 
        // If Admin/User replies, stop the timer and record difference
        else if (
          (msg.senderType === "admin" || msg.senderType === "User") && 
          pendingClientMessageTime !== null
        ) {
          const diff = new Date(msg.createdAt).getTime() - pendingClientMessageTime;
          totalReplyTimeMs += diff;
          totalResponseCount++;
          pendingClientMessageTime = null; // Reset for next interaction
        }
      });
    });

    // 5. Final Calculations

    // Average Reply Time
    let averageSeconds = 0;
    if (totalResponseCount > 0) {
      averageSeconds = (totalReplyTimeMs / totalResponseCount) / 1000;
    }

    // Format Time (e.g., "45 secs" or "2.5 mins")
    let formattedReplyTime = "";
    if (averageSeconds < 60) {
      formattedReplyTime = `${Math.round(averageSeconds)} secs`;
    } else if (averageSeconds < 3600) {
      formattedReplyTime = `${Math.round(averageSeconds / 60)} mins`;
    } else {
      formattedReplyTime = `${(averageSeconds / 3600).toFixed(1)} hours`;
    }

    // Resolved Percentage (For the donut chart)
    let resolvedPercentage = 0;
    if (totalChats > 0) {
      resolvedPercentage = Math.round((closedChats / totalChats) * 100);
    }

    // 6. Send Response
    return res.status(200).json({
      success: true,
      stats: {
        totalChats: totalChats,
        resolvedTickets: {
          count: closedChats,
          percentage: resolvedPercentage, // e.g., 80
        },
        averageReplyTime: {
          seconds: averageSeconds,
          formatted: formattedReplyTime, // e.g., "0 secs"
        }
      }
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { getDashboardStats };