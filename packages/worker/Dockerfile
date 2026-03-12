FROM oven/bun:1 AS base

# Install system dependencies for full Chromium + virtual display
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libpango-1.0-0 libcairo2 libasound2 libwayland-client0 \
    fonts-liberation fonts-noto-color-emoji xvfb dbus \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright browsers
RUN bunx playwright install --with-deps chromium

WORKDIR /app

# Monorepo root — workspace resolution için
COPY package.json bun.lock ./
COPY packages/core/package.json packages/core/
COPY packages/cli/package.json packages/cli/
COPY packages/sandbox/package.json packages/sandbox/
COPY packages/web/package.json packages/web/
COPY packages/worker/package.json packages/worker/

RUN bun install

COPY packages/core/ packages/core/
COPY packages/worker/ packages/worker/

# Log installed browsers
RUN echo "=== Installed browsers ===" && \
    ls -la /root/.cache/ms-playwright/ && \
    find /root/.cache/ms-playwright -maxdepth 3 -name "chrome" -o -name "chrome-headless-shell" 2>/dev/null

WORKDIR /app/packages/worker

ENV PORT=8080
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
ENV DISPLAY=:99
EXPOSE 8080

# Start Xvfb virtual display, then run worker
CMD ["sh", "-c", "Xvfb :99 -screen 0 1280x1100x24 -nolisten tcp &>/dev/null & sleep 1 && bun run src/index.ts"]
