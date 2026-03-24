from playwright.sync_api import sync_playwright

def verify_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()

        try:
            page.goto("http://localhost:3000/login")
            page.wait_for_timeout(1000)

            # Fill out phone number
            page.fill('input#phone', '+221770000000')
            page.wait_for_timeout(500)

            # Click the submit button to request OTP
            page.click('button[type="submit"]')
            page.wait_for_timeout(1000)

            # We won't be able to actually receive the OTP without the backend integration
            # fully running and mocked, but we should verify the form updates

            page.screenshot(path="/home/jules/verification/verification.png")
            page.wait_for_timeout(1000)
        except Exception as e:
            print(f"Error occurred: {e}")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs("/home/jules/verification/video", exist_ok=True)
    verify_feature()
