# Select the php image with apache
FROM php:8.2-apache

# Copy the src folder to the container
COPY src/ /var/www/html/

# Use the www-data user
RUN chown -R www-data:www-data /var/www/html

# Habilitar módulos do Apache
RUN a2enmod rewrite

# Configuração de variáveis de ambiente, se necessário
# Exemplo: definir timezone para São Paulo
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Expose the port 80
EXPOSE 80

# Run the apache server
CMD ["apache2-foreground"]