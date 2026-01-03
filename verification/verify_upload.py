
from playwright.sync_api import sync_playwright

def verify_app_renders():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # Take screenshot of the login page
            page.screenshot(path="verification/login_page.png")
            print("Took screenshot of login page")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app_renders()
