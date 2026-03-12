FROM oven/bun:1 AS base

# Playwright sistem bağımlılıkları
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libwayland-client0 \
    xvfb \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

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

# Playwright tarayıcılarını kur
RUN cd packages/core && bunx playwright install chromium

WORKDIR /app/packages/worker

ENV PORT=8080
EXPOSE 8080

CMD ["bun", "run", "src/index.ts"]
