# upload-file-zip

A simple Laravel app to receive ZIP file uploads from friends over a static IP when your internet or social media is unreliable.

This project is intended for small self-hosted or LAN setups where friends can send ZIP archives directly to your server (for example, when mobile data or social platforms are unavailable).

## Purpose
- Provide a lightweight endpoint to upload ZIP files.
- Keep a local log of uploads in the database.
- Run on a machine with a static IP so others can reach it reliably.

## Requirements
- PHP (compatible with the Laravel version in this repo)
- Composer
- A web server (Nginx, Apache) or Laravel's built-in server for development
- SQLite (included as `database/database.sqlite`) or another database configured in `config/database.php`

## Quick setup (development)
1. Install dependencies:

```bash
composer install
```

2. Copy the environment file and generate an app key:

```bash
cp .env.example .env
php artisan key:generate
```

3. Ensure the SQLite file exists (if you keep the default):

```bash
touch database/database.sqlite
chmod 660 database/database.sqlite
```

4. Run migrations:

```bash
php artisan migrate
```

5. Start the app (bind to 0.0.0.0 so friends on the LAN can connect):

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

Then provide your static IP and port to your friends (for example, http://192.168.1.10:8000/upload).

## Usage
- The app accepts ZIP file uploads and stores them using Laravel's filesystem. Uploaded entries are logged in the `uploaded_files_log` table (see migrations).
- Check received files under `storage/app/public` (or the configured disk).

## Notes
- This project is intentionally minimal — secure it before exposing to the internet (HTTPS, authentication, file size/type checks).
- If you want, I can add an example upload form, a simple API endpoint with curl examples, or authentication.

## License
MIT
