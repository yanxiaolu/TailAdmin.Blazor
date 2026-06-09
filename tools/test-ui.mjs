import { chromium } from "playwright";
import { spawn } from "node:child_process";
import http from "node:http";

const waitUrl = "http://localhost:9090/";
let serverProcess = null;

function waitServer(timeout = 40000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (Date.now() - start > timeout) {
        reject(new Error("Server start timeout"));
        return;
      }
      http
        .get(waitUrl, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            setTimeout(check, 1000);
          }
        })
        .on("error", () => {
          setTimeout(check, 1000);
        });
    };
    check();
  });
}

async function runTests() {
  console.log("Starting dotnet Blazor WASM local server...");
  serverProcess = spawn("dotnet", ["run", "--project", ".", "--no-build"], {
    stdio: "pipe",
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`DotNet Error: ${data}`);
  });

  // Ensure server process is terminated on exit
  process.on("exit", () => {
    if (serverProcess) serverProcess.kill();
  });
  process.on("SIGINT", () => {
    if (serverProcess) serverProcess.kill();
    process.exit();
  });

  try {
    await waitServer();
    console.log("✓ Blazor WASM server is ready at http://localhost:9090");

    console.log("Launching headless browser...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set viewport for testing desktop/mobile responsiveness
    await page.setViewportSize({ width: 1280, height: 800 });

    console.log("Scenario 1: Testing Dashboard / eCommerce page loading...");
    await page.goto("http://localhost:9090/");
    await page.waitForSelector("#chartOne", { timeout: 15000 });
    await page.waitForSelector("#chartTwo", { timeout: 5000 });
    await page.waitForSelector("#chartThree", { timeout: 5000 });
    await page.waitForSelector("#mapOne", { timeout: 5000 });
    console.log("  ✓ Dashboard loading & chart assets rendering: OK");

    console.log("Scenario 2: Testing Sidebar collapse toggle...");
    // Retrieve collapsed width class list of the sidebar
    // Click the Hamburger Toggle button in the Header to collapse
    await page.click("header button"); // Clicking first button in header toggles the sidebar
    await page.waitForFunction(() => {
      const sidebar = document.querySelector(".sidebar");
      return sidebar && sidebar.classList.contains("lg:w-[90px]");
    }, { timeout: 5000 });
    console.log("  ✓ Sidebar collapse is functional: OK");

    // Click again to expand the sidebar
    await page.click("header button");
    await page.waitForFunction(() => {
      const sidebar = document.querySelector(".sidebar");
      return sidebar && !sidebar.classList.contains("lg:w-[90px]");
    }, { timeout: 5000 });
    console.log("  ✓ Sidebar expand toggle is functional: OK");

    console.log("Scenario 3: Testing Dark Mode Toggler...");
    // Click the Dark Mode Toggle button
    const darkModeBtn = page.locator("button:has(svg.dark\\:block)");
    await darkModeBtn.click();
    await page.waitForFunction(() => {
      const wrapper = document.querySelector("[x-data]");
      return wrapper && wrapper.classList.contains("dark");
    }, { timeout: 5000 });
    console.log("  ✓ Dark Mode toggle is functional: OK");

    // Toggle back to light mode
    await darkModeBtn.click();
    await page.waitForFunction(() => {
      const wrapper = document.querySelector("[x-data]");
      return wrapper && !wrapper.classList.contains("dark");
    }, { timeout: 5000 });
    console.log("  ✓ Light Mode toggle is functional: OK");

    console.log("Scenario 4: Testing Calendar Page grid rendering...");
    await page.goto("http://localhost:9090/calendar");
    await page.waitForSelector("#calendar", { timeout: 10000 });
    // Check if full calendar grid components load
    const fcEventCount = await page.locator(".fc").count();
    if (fcEventCount > 0) {
      console.log("  ✓ Calendar Page components & JS grids: OK");
    } else {
      throw new Error("Calendar failed to load Calendar elements");
    }

    console.log("Scenario 5: Testing Sign-In / Auth pages Layout...");
    await page.goto("http://localhost:9090/signin");
    const sidebarCount = await page.locator(".sidebar").count();
    const headerCount = await page.locator("header").count();
    if (sidebarCount === 0 && headerCount === 0) {
      console.log("  ✓ Signin renders with EmptyLayout (no headers/sidebars): OK");
    } else {
      throw new Error("Auth page incorrectly loaded sidebar/header layouts");
    }

    console.log("Scenario 6: Testing Blank Page titles and Breadcrumbs...");
    await page.goto("http://localhost:9090/blank");
    await page.waitForFunction(() => document.title.includes("Blank Page"), { timeout: 8000 });
    console.log("  ✓ PageTitle matches: OK");

    const breadcrumbCount = await page.locator(".mb-6.flex.flex-wrap").count();
    if (breadcrumbCount > 0) {
      console.log("  ✓ Breadcrumbs component rendered: OK");
    } else {
      throw new Error("Breadcrumbs failed to render");
    }

    console.log("Scenario 7: Testing all remaining migrated pages for successful load and runtime integrity...");
    const pagesToTest = [
      { path: "/", expectedTitle: "eCommerce Dashboard" },
      { path: "/calendar", expectedTitle: "Calendar" },
      { path: "/profile", expectedTitle: "Profile" },
      { path: "/form-elements", expectedTitle: "Form Elements" },
      { path: "/basic-tables", expectedTitle: "Basic Tables" },
      { path: "/signin", expectedTitle: "Sign In" },
      { path: "/signup", expectedTitle: "Sign Up" },
      { path: "/alerts", expectedTitle: "Alerts" },
      { path: "/avatars", expectedTitle: "Avatars" },
      { path: "/badge", expectedTitle: "Badge" },
      { path: "/buttons", expectedTitle: "Buttons" },
      { path: "/images", expectedTitle: "Images" },
      { path: "/videos", expectedTitle: "Videos" },
      { path: "/bar-chart", expectedTitle: "Bar Chart" },
      { path: "/line-chart", expectedTitle: "Line Chart" },
      { path: "/sidebar", expectedTitle: "TailAdmin" },
      { path: "/blank", expectedTitle: "Blank Page" },
      { path: "/404", expectedTitle: "404 Error Page" }
    ];

    const pageErrors = [];
    page.on("pageerror", (err) => {
      console.error(`Page error on ${page.url()}:`, err);
      pageErrors.push({ url: page.url(), error: err });
    });

    for (const testPage of pagesToTest) {
      console.log(`  Visiting http://localhost:9090${testPage.path}...`);
      await page.goto(`http://localhost:9090${testPage.path}`);
      await page.waitForFunction(
        (expected) => document.title.toLowerCase().includes(expected.toLowerCase()),
        testPage.expectedTitle,
        { timeout: 8000 }
      );
    }

    if (pageErrors.length > 0) {
      throw new Error(`Detected ${pageErrors.length} JavaScript runtime page errors during navigation.`);
    }
    console.log("  ✓ All 18 pages loaded and resolved title checks with 0 JS exceptions: OK");

    console.log("\n==============================================");
    console.log("🎉 ALL AUTOMATED UI TESTS PASSED SUCCESSFULLY!");
    console.log("==============================================");

    await browser.close();
    serverProcess.kill();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ AUTOMATED UI TEST FAILED:");
    console.error(error);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
}

runTests();
