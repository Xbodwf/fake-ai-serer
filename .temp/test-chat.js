const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:5173/chat...');
    await page.goto('http://localhost:5173/chat', { waitUntil: 'networkidle' });
    console.log('Page loaded successfully');

    // Take a screenshot
    await page.screenshot({ path: '/home/orangepi/apps/fake-ai-server/.temp/chat-page-1.png', fullPage: true });
    console.log('Screenshot saved to .temp/chat-page-1.png');

    // Check page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for errors in console
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
        errors.push(msg.text());
      }
    });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Take another screenshot
    await page.screenshot({ path: '/home/orangepi/apps/fake-ai-server/.temp/chat-page-2.png', fullPage: true });
    console.log('Screenshot saved to .temp/chat-page-2.png');

    // Check if chat interface is visible
    const chatInterface = await page.locator('.chat-container, .chat-interface, [class*="chat"]').count();
    console.log('Chat interface elements found:', chatInterface);

    // Check for session list
    const sessionList = await page.locator('.session-list, [class*="session"], [class*="sidebar"]').count();
    console.log('Session list elements found:', sessionList);

    // Check for chat window
    const chatWindow = await page.locator('.chat-window, [class*="message"], [class*="chat"]').count();
    console.log('Chat window elements found:', chatWindow);

    console.log('\n=== Test Summary ===');
    console.log('Title:', title);
    console.log('Console errors:', errors.length);
    console.log('Chat interface:', chatInterface > 0 ? 'Found' : 'Not found');
    console.log('Session list:', sessionList > 0 ? 'Found' : 'Not found');
    console.log('Chat window:', chatWindow > 0 ? 'Found' : 'Not found');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();