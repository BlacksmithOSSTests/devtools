import { Page, expect } from "@playwright/test";
import chalk from "chalk";

import { debugPrint, waitFor } from "./utils";

export async function convertCoordinatesForScreenshot(
  page: Page,
  xPercentage: number,
  yPercentage: number
) {
  const graphicsElement = getGraphicsElement(page);

  const { width, height } = (await graphicsElement.boundingBox())!;

  const x = xPercentage * width;
  const y = yPercentage * height;

  await debugPrint(
    page,
    `Scaling coordinates ${chalk.bold(xPercentage.toFixed(2))}%, ${chalk.bold(
      yPercentage.toFixed(2)
    )}% to ${chalk.bold(Math.round(x))}px, ${chalk.bold(Math.round(y))}px of ${chalk.bold(
      Math.round(width)
    )}px x ${chalk.bold(Math.round(height))}px`,
    "convertCoordinatesForScreenshot"
  );

  return { x, y };
}

export function getGraphicsElement(page: Page) {
  return page.locator("#graphics");
}

export function getVideoElement(page: Page) {
  return page.locator("#video");
}

export async function clickScreenshot(page: Page, xPercentage: number, yPercentage: number) {
  await debugPrint(
    page,
    `Click screenshot coordinates ${chalk.bold(xPercentage.toFixed(2))}%, ${chalk.bold(
      yPercentage.toFixed(2)
    )}%`,
    "clickScreenshot"
  );

  const screenshot = getGraphicsElement(page);
  const position = await convertCoordinatesForScreenshot(page, xPercentage, yPercentage);
  await screenshot.click({ position, force: true });
}

export async function getGraphicsElementScale(page: Page) {
  const element = getGraphicsElement(page);
  const scaleString = await element.getAttribute("data-scale");
  return Number(scaleString);
}

export async function hoverScreenshot(page: Page, xPercentage: number, yPercentage: number) {
  await debugPrint(
    page,
    `Hover over screenshot coordinates ${chalk.bold(xPercentage.toFixed(2))}%, ${chalk.bold(
      yPercentage.toFixed(2)
    )}%`,
    "hoverScreenshot"
  );

  const screenshot = getGraphicsElement(page);
  const position = await convertCoordinatesForScreenshot(page, xPercentage, yPercentage);
  await screenshot.hover({ position, force: true });
}

export async function getGraphicsDataUrl(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const element = document.querySelector("#graphics") as HTMLImageElement;
    return element?.src ?? null;
  });
}

export async function getGraphicsExecutionPoint(page: Page): Promise<string | null> {
  const element = getVideoElement(page);
  return await element.getAttribute("data-execution-point");
}

export async function getGraphicsStatus(page: Page): Promise<string | null> {
  const element = getVideoElement(page);
  return await element.getAttribute("data-status");
}

export async function getGraphicsTime(page: Page): Promise<number | null> {
  const element = getVideoElement(page);
  const value = await element.getAttribute("data-time");
  return value != null ? parseInt(value) : null;
}

export async function getGraphicsPixelColor(page: Page, x: number, y: number) {
  return await page.evaluate(
    ([x, y]) => {
      const element = document.querySelector("#graphics");
      if (element == null) {
        return null;
      }

      const imageElement = element as HTMLImageElement;

      const canvas = document.createElement("canvas");
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;

      const context = canvas.getContext("2d");
      if (context == null) {
        return null;
      }

      context.drawImage(imageElement, 0, 0);

      const { data } = context.getImageData(x, y, 1, 1);

      const red = data[0] << 16;
      const green = data[1] << 8;
      const blue = data[2];

      return `#${(red + green + blue).toString(16).padStart(6, "0")}`.toUpperCase();
    },
    [x, y]
  );
}

export async function waitForGraphicsToLoad(page: Page) {
  await waitFor(async () => {
    await expect(await getGraphicsStatus(page)).not.toBe("fetching-cached-paint");
  });
}
