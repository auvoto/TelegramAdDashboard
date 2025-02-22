import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertChannelSchema } from "@shared/schema";
import multer from "multer";
import { join } from "path";
import express from 'express';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files from uploads directory
const uploadsPath = join(process.cwd(), 'uploads');

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static(uploadsPath));

  app.post("/api/channels", upload.single('logo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ error: "Logo file is required" });

    try {
      const channelData = insertChannelSchema.parse({
        name: req.body.name,
        subscribers: req.body.subscribers,
        inviteLink: req.body.inviteLink,
        description: req.body.description || undefined,
      });

      const channel = await storage.createChannel(channelData, req.user.id, req.file);
      res.status(201).json(channel);
    } catch (error) {
      console.error('Channel creation error:', error);
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/channels", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const channels = await storage.getUserChannels(req.user.id);
    res.json(channels);
  });

  app.get("/api/channels/:uuid", async (req, res) => {
    const channel = await storage.getChannel(req.params.uuid);
    if (!channel) return res.sendStatus(404);
    res.json(channel);
  });

  // New endpoint to track subscribe events
  app.post("/api/channels/:uuid/track-subscribe", async (req, res) => {
    try {
      const channel = await storage.getChannel(req.params.uuid);
      if (!channel) return res.sendStatus(404);

      if (!process.env.FACEBOOK_ACCESS_TOKEN) {
        console.error('Facebook access token not found');
        return res.sendStatus(500);
      }

      // Track event using Facebook Conversion API
      const response = await fetch('https://graph.facebook.com/v18.0/485785431234952/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FACEBOOK_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          data: [{
            event_name: 'Subscribe',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            user_data: {
              client_ip_address: req.ip,
              client_user_agent: req.headers['user-agent'],
            },
            custom_data: {
              content_name: channel.name,
              channel_uuid: channel.uuid
            }
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Facebook API Error:', errorText);
        return res.status(500).json({ error: 'Failed to track event' });
      }

      const responseData = await response.json();
      console.log('Facebook API Response:', responseData);
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking subscribe event:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}