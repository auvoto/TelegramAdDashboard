import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertChannelSchema, insertPixelSettingsSchema } from "@shared/schema";
import multer from "multer";
import { join } from "path";
import express from 'express';
import { mkdir } from 'fs/promises';
import { cache } from "./db";
import { eq } from "drizzle-orm";
import compression from "compression";

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Serve static files from uploads directory
const uploadsPath = join(process.cwd(), 'uploads');

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable compression for all routes
  app.use(compression());

  setupAuth(app);

  // Serve uploaded files with aggressive caching
  app.use('/uploads', express.static(uploadsPath, {
    maxAge: '7d', // Cache for 7 days
    etag: true,
    lastModified: true,
    immutable: true // Indicates the file will never change
  }));

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'uploads', 'logos');
  await mkdir(uploadsDir, { recursive: true }).catch(err => {
    console.error('Error creating uploads directory:', err);
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.sendStatus(403);

    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.sendStatus(403);

    const { role } = req.body;
    if (!role || !["admin", "employee"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    try {
      const user = await storage.updateUserRole(parseInt(req.params.id), role);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Pixel settings routes
  app.get("/api/pixel-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const settings = await storage.getPixelSettings(req.user.id);
    res.json(settings);
  });

  app.post("/api/pixel-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const settingsData = insertPixelSettingsSchema.parse(req.body);
      const existingSettings = await storage.getPixelSettings(req.user.id);

      let settings;
      if (existingSettings) {
        settings = await storage.updatePixelSettings(req.user.id, settingsData);
      } else {
        settings = await storage.createPixelSettings(settingsData, req.user.id);
      }

      res.json(settings);
    } catch (error) {
      console.error('Pixel settings error:', error);
      res.status(400).json({ error: String(error) });
    }
  });

  // Channel management routes
  app.post("/api/channels", upload.single('logo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ error: "Logo file is required" });

    try {
      const channelData = insertChannelSchema.parse({
        name: req.body.name,
        nickname: req.body.nickname || undefined,
        subscribers: req.body.subscribers,
        inviteLink: req.body.inviteLink,
        description: req.body.description || undefined,
        customPixelId: req.body.customPixelId || undefined,
        customAccessToken: req.body.customAccessToken || undefined,
      });

      console.log('Creating channel with data:', channelData);
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
    const cacheKey = `channel_${req.params.uuid}`;
    const cachedChannel = cache.get(cacheKey);

    // Generate ETag based on channel data
    const generateETag = (channel: any) => {
      return `"${channel.id}-${channel.updatedAt || Date.now()}"`;
    };

    if (cachedChannel) {
      const etag = generateETag(cachedChannel);
      res.set('ETag', etag);

      // Check if client cache is still valid
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }

      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      return res.json(cachedChannel);
    }

    const channel = await storage.getChannel(req.params.uuid);
    if (!channel) return res.sendStatus(404);

    // Cache for 5 minutes
    cache.set(cacheKey, channel);

    const etag = generateETag(channel);
    res.set('ETag', etag);
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(channel);
  });

  // Add DELETE endpoint for channels
  app.delete("/api/channels/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const channelId = parseInt(req.params.id);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: "Invalid channel ID" });
    }

    try {
      await storage.deleteChannel(channelId);
      res.sendStatus(200);
    } catch (error) {
      console.error('Error deleting channel:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Track subscribe events with channel-specific or user's default pixel settings
  app.post("/api/channels/:uuid/track-subscribe", async (req, res) => {
    try {
      console.log('Tracking channel contact event for:', req.params.uuid);

      const channel = await storage.getChannel(req.params.uuid);
      if (!channel) {
        console.error('Channel not found:', req.params.uuid);
        return res.sendStatus(404);
      }

      console.log('Found channel:', channel.name, 'userId:', channel.userId);

      // Use channel-specific pixel settings if available, otherwise fall back to user's default settings
      let pixelId: string | undefined;
      let accessToken: string | undefined;

      if (channel.customPixelId && channel.customAccessToken) {
        pixelId = channel.customPixelId;
        accessToken = channel.customAccessToken;
        console.log('Using channel-specific pixel settings');
      } else {
        const pixelSettings = await storage.getPixelSettings(channel.userId);
        if (!pixelSettings) {
          console.error('Pixel settings not found for userId:', channel.userId);
          return res.status(500).json({ error: 'Pixel settings not configured' });
        }
        pixelId = pixelSettings.pixelId;
        accessToken = pixelSettings.accessToken;
        console.log('Using default pixel settings');
      }

      // Get available cookies, defaulting to empty strings if not present
      const fbp = req.cookies?._fbp || '';
      const fbc = req.cookies?._fbc || '';

      console.log('Sending event to Facebook API with pixelId:', pixelId);

      // Track event using Facebook Conversion API
      const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          data: [{
            event_name: 'Contact',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            event_source_url: req.headers.referer || '',
            user_data: {
              client_ip_address: req.ip || '',
              client_user_agent: req.headers['user-agent'] || '',
              fbp: fbp || undefined,
              fbc: fbc || undefined
            },
            custom_data: {
              content_name: channel.name,
              content_type: 'channel',
              content_ids: [channel.uuid]
            }
          }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Facebook API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          pixelId,
          channelId: channel.uuid
        });
        return res.status(500).json({
          error: 'Failed to track event',
          details: errorText
        });
      }

      const responseData = await response.json();
      console.log('Facebook API Response:', responseData);
      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking event:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add PATCH endpoint for channels
  app.patch("/api/channels/:id", upload.single('logo'), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const channelId = parseInt(req.params.id);
    if (isNaN(channelId)) {
      return res.status(400).json({ error: "Invalid channel ID" });
    }

    try {
      const updatedChannel = await storage.updateChannel(channelId, req.body, req.file);

      // Clear the cache for this channel
      const channel = await storage.getChannel(updatedChannel.uuid);
      if (channel) {
        cache.del(`channel_${channel.uuid}`);
      }

      res.json(updatedChannel);
    } catch (error) {
      console.error('Error updating channel:', error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Create http server and return it
  const httpServer = createServer(app);
  return httpServer;
}