import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for saving/loading user preferences
  app.get('/api/preferences', async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const preferences = await storage.getUserPreferences(userId);
      if (!preferences) {
        return res.status(404).json({ message: 'Preferences not found' });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({ message: 'Failed to fetch preferences' });
    }
  });

  app.post('/api/preferences', async (req, res) => {
    try {
      const { userId, mode, colorScheme, sensitivity, complexity, decay } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      
      const preferences = await storage.saveUserPreferences({
        userId,
        mode,
        colorScheme,
        sensitivity,
        complexity,
        decay
      });
      
      res.status(201).json(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      res.status(500).json({ message: 'Failed to save preferences' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
