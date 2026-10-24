FROM php:7.4-apache

WORKDIR /var/www/html

COPY composer.json composer.lock ./
COPY src ./src
COPY public ./public
COPY config ./config

EXPOSE 80
