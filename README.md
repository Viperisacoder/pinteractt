# Pinner - Visual Feedback Tool

Pinner is a visual feedback tool that allows users to create projects, upload images, add pins with comments, and share projects with others. The app supports share link expiration, QR code generation, and social media sharing.

## Image Sharing Feature

The app now includes a dedicated image sharing feature that allows users to:

- Upload images with title and description
- Get a shareable link for each uploaded image
- View shared images via unique short IDs
- Add and view comments on shared images

## Features

- Create and manage multiple projects
- Upload images to create pinshots
- Add pins with comments and status tracking
- Share projects with customizable expiration periods
- Generate QR codes for easy mobile access
- View shared projects with animated pin placement
- Redirect to 404 page for expired or invalid links

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router DOM
- React Toastify
- Supabase (for database and authentication)

## Setup and Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/pinner.git
   cd pinner/my-feedback-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials
   ```
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server
   ```bash
   npm run dev
   ```

## Database Setup

The application requires a Supabase database with the following tables:

1. `projects` - Stores project information
2. `pinshots` - Stores images uploaded to projects
3. `pins` - Stores pins added to pinshots
4. `share_links` - Stores share links with expiration dates
5. `shared_images` - Stores metadata for shared images
6. `image_comments` - Stores comments for shared images

Run the SQL migration scripts in the `supabase/migrations` directory to set up your database schema:

- `20250831_share_links.sql` - Sets up the project sharing functionality
- `20250831_image_sharing.sql` - Sets up the image sharing functionality

## Deployment

### Deploying to Vercel

1. Fork this repository to your GitHub account

2. Create a new project on Vercel and connect it to your GitHub repository

3. Add the following environment variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. Deploy the project

### Supabase Configuration

1. Create a new project on Supabase

2. Navigate to the SQL Editor in your Supabase dashboard

3. Run the SQL migration script from `supabase/migrations/20250831_share_links.sql`

4. Update your environment variables with the new Supabase URL and anon key

## Share Link System

The application uses Supabase to store and validate share links. Each share link can have an optional expiration date. When a user visits a share link, the application checks if the link is valid and not expired before displaying the project.

## Using the Image Sharing Feature

### Uploading Images

1. Navigate to the `/upload` route or click on "Upload Image" in the navigation
2. Fill in the title and description for your image
3. Select an image file to upload
4. Click "Upload and Share"
5. After successful upload, you'll be redirected to the image view page

### Viewing Shared Images

1. Access a shared image via its unique URL: `/view/:id` where `:id` is the short ID
2. View the image details, including title and description
3. Copy the share link to share with others
4. Add comments to the image using the comment form
5. View existing comments below the image

### Share Link Types

- **No expiration**: Links that never expire
- **1 day expiration**: Links that expire after 1 day
- **7 day expiration**: Links that expire after 7 days
- **30 day expiration**: Links that expire after 30 days

## License

MIT
