const express = require('express');
const router = express.Router();
const { Anthropic } = require('@anthropic-ai/sdk');

// Initialize Anthropic client with your API key
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-iICOYoxgeLXJcmYnQ3Ve6NePkh6KhPwxhyOu2JBZakXyRSnGrqaqgJsVSPuBIPTz',
  baseURL: process.env.ANTHROPIC_BASE_URL || 'https://opencode.ai/zen'
});

// System prompt for bus route assistance
const SYSTEM_PROMPT = `You are an AI assistant for Gontoboddh BD, a smart bus route and fare management system for Bangladesh. 
Help users with:
- Finding bus routes between locations
- Checking bus fares and schedules
- Providing traffic updates
- Answering questions about bus services in Bangladesh
- Assisting with route planning and navigation

Be helpful, concise, and provide accurate information about Bangladesh's bus transportation system.`;

// POST /api/claude/chat - Chat with Claude AI
router.post('/chat', async (req, res) => {
  try {
    const { message, context = [] } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Build messages array with context
    const messages = [
      ...context,
      { role: 'user', content: message }
    ];

    const completion = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'minimax-m2.5-free',
      system: SYSTEM_PROMPT,
      messages: messages,
      max_tokens: 1000,
    });

    const response = completion.content[0].text;

    res.json({
      success: true,
      response: response,
      usage: completion.usage
    });
  } catch (error) {
    console.error('Claude API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get response from Claude AI',
      details: error.message
    });
  }
});

// POST /api/claude/route-assistant - Get route recommendations
router.post('/route-assistant', async (req, res) => {
  try {
    const { from, to, preferences = {} } = req.body;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Both "from" and "to" locations are required'
      });
    }

    const prompt = `I need to travel from ${from} to ${to} in Bangladesh. 
    Preferences: ${JSON.stringify(preferences)}
    
    Please suggest the best bus routes, estimated fares, and travel time. 
    Also mention any traffic considerations and alternative routes if available.`;

    const completion = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'minimax-m2.5-free',
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
    });

    res.json({
      success: true,
      response: completion.content[0].text,
      usage: completion.usage
    });
  } catch (error) {
    console.error('Route Assistant Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get route recommendations',
      details: error.message
    });
  }
});

// GET /api/claude/health - Check Claude API connection
router.get('/health', async (req, res) => {
  try {
    // Simple test to verify API connection
    const completion = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'minimax-m2.5-free',
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Hello, test connection' }],
      max_tokens: 50,
    });

    res.json({
      success: true,
      status: 'connected',
      model: process.env.ANTHROPIC_MODEL || 'minimax-m2.5-free',
      message: 'Claude AI is working correctly'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;