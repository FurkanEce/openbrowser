FROM oven/bun:1 AS base

# Playwright'ın kendi deps installer'ını kullan
RUN bunx playwright install --with-deps chromium

WORKDIR /app

# Monorepo root — tüm package.json'ları kopyala (workspace resolution için)
COPY package.json bun.lock ./
COPY packages/core/package.json packages/core/
COPY packages/cli/package.json packages/cli/
COPY packages/sandbox/package.json packages/sandbox/
COPY packages/web/package.json packages/web/
COPY packages/worker/package.json packages/worker/

# Install dependencies
RUN bun install

# Kaynak kodu kopyala
COPY packages/core/ packages/core/
COPY packages/worker/ packages/worker/

# Chromium'un başlayabildiğini doğrula
RUN bunx playwright install chromium && \
    echo "Chromium installed at:" && \
    find /root/.cache/ms-playwright -name "chrome" -o -name "chromium" -o -name "chrome-headless-shell" 2>/dev/null | head -5

WORKDIR /app/packages/worker

ENV PORT=8080
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
EXPOSE 8080

CMD ["bun", "run", "src/index.ts"]
