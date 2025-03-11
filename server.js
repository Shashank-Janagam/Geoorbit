import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const auth = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);
auth.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

app.get("/create-meet", async (req, res) => {
    try {
        const calendar = google.calendar({ version: "v3", auth });
        const event = {
            summary: "Meeting",
            start: { dateTime: new Date().toISOString(), timeZone: "UTC" },
            end: { dateTime: new Date(Date.now() + 3600000).toISOString(), timeZone: "UTC" },
            conferenceData: { createRequest: { requestId: "meeting-" + Date.now() } },
        };

        const response = await calendar.events.insert({
            calendarId: "primary",
            resource: event,
            conferenceDataVersion: 1,
        });

        res.json({ meetLink: response.data.hangoutLink });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
