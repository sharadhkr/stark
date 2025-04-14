const express = require('express');
const router = express.Router();
const natural = require('natural');
const userLoggedin = require('../middleware/userLoggedin');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const classifier = new natural.BayesClassifier();

// Train the classifier with basic intents (you can expand this)
classifier.addDocument('go to cart', 'navigate_cart');
classifier.addDocument('navigate to cart', 'navigate_cart');
classifier.addDocument('show my cart', 'navigate_cart');
classifier.addDocument('go to home', 'navigate_home');
classifier.addDocument('navigate to home', 'navigate_home');
classifier.addDocument('show home page', 'navigate_home');
classifier.addDocument('go to profile', 'navigate_profile');
classifier.addDocument('navigate to profile', 'navigate_profile');
classifier.addDocument('show my profile', 'navigate_profile');
classifier.addDocument('help me', 'provide_help');
classifier.addDocument('how to use', 'provide_help');
classifier.addDocument('guide me', 'provide_help');
classifier.train();

// AI Assist Route
router.post('/assist', async (req, res) => {
  try {
    const { input, language = 'en' } = req.body; // Input from user, language preference (default: English)

    if (!input) {
      return res.status(400).json({ message: 'Input is required' });
    }

    // Tokenize and classify the input
    const tokens = tokenizer.tokenize(input.toLowerCase());
    const intent = classifier.classify(input.toLowerCase());

    // Define responses and actions based on intent
    let response = '';
    let action = null;

    switch (intent) {
      case 'navigate_cart':
        response = language === 'hi'
          ? 'मैं आपको कार्ट पेज पर ले जा रहा हूँ।'
          : 'I am taking you to the cart page.';
        action = { type: 'navigate', path: '/cart' };
        break;

      case 'navigate_home':
        response = language === 'hi'
          ? 'मैं आपको होम पेज पर ले जा रहा हूँ।'
          : 'I am taking you to the home page.';
        action = { type: 'navigate', path: '/' };
        break;

      case 'navigate_profile':
        response = language === 'hi'
          ? 'मैं आपको प्रोफाइल पेज पर ले जा रहा हूँ।'
          : 'I am taking you to your profile page.';
        action = { type: 'navigate', path: '/profile' };
        break;

      case 'provide_help':
        response = language === 'hi'
          ? 'यहाँ कुछ बुनियादी निर्देश हैं: किसी उत्पाद को खरीदने के लिए, "Buy Now" बटन पर क्लिक करें और अपनी UPI डिटेल्स दर्ज करें। नेविगेट करने के लिए, मुझे बताएं कि आप कहाँ जाना चाहते हैं, जैसे "कार्ट पर जाएँ" या "होम पर जाएँ"।'
          : 'Here are some basic instructions: To buy a product, click the "Buy Now" button and enter your UPI details. To navigate, tell me where you want to go, like "Go to cart" or "Go to home".';
        action = null;
        break;

      default:
        response = language === 'hi'
          ? 'मुझे समझ नहीं आया। कृपया फिर से बताएं, जैसे "कार्ट पर जाएँ" या "मदद करें"।'
          : 'I didn’t understand. Please try again, like "Go to cart" or "Help me".';
        action = null;
        break;
    }

    res.status(200).json({ response, action });
  } catch (error) {
    console.error('AI Assist Error:', error);
    res.status(500).json({ message: 'Failed to process request', error: error.message });
  }
});

module.exports = router;