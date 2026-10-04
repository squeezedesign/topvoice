FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
      icu-libs libzip libpng libjpeg-turbo libwebp freetype yaml \
    && apk add --no-cache --virtual .build-deps \
      $PHPIZE_DEPS \
      icu-dev libzip-dev libpng-dev libjpeg-turbo-dev \
      libwebp-dev freetype-dev yaml-dev oniguruma-dev libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) gd intl mbstring opcache simplexml xml zip \
    && pecl install yaml \
    && docker-php-ext-enable yaml \
    && apk del .build-deps \
    && rm -rf /tmp/pear /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
