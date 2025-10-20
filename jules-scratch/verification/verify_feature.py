from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Use a more descriptive input text to ensure a clear question
        page.get_by_label("Enter your study material").fill("Generate a multiple choice question about the capital of France.")
        page.get_by_label("Number of Questions").fill("1")
        page.get_by_role("button", name="Generate Quiz").click()

        # Wait for the question itself to appear, which is more reliable than a specific answer
        # Increased timeout to handle potentially slow API responses
        question_locator = page.get_by_text("France", exact=False)
        expect(question_locator).to_be_visible(timeout=60000)

        # Select the first answer option, whatever it is
        page.locator('input[type="radio"]').first.check()
        page.get_by_role("button", name="Submit Quiz").click()

        # Check that the score is visible, confirming submission
        expect(page.get_by_text("Your score:")).to_be_visible()

        # Now, take the screenshot. The "Practice Wrong Answers" button will be visible if the answer was wrong.
        # This is sufficient for visual verification.
        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

run()
