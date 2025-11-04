# ClaimEase React App 🚀

A modern, beautiful React application built with Next.js 14, TypeScript, and shadcn/ui for employee claims and benefits management.

## ✨ Features

- 🎨 **Beautiful UI** - Built with shadcn/ui components and Tailwind CSS
- 🌓 **Dark Mode** - Seamless light/dark theme switching
- ⚡ **Fast** - Next.js 14 with App Router for optimal performance
- 🔒 **Type-Safe** - Full TypeScript support
- 📱 **Responsive** - Mobile-first design
- 🎯 **Modern** - Latest React 18 features

## 🛠️ Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI)
- **Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Axios

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### 3. Start Backend API

Make sure your FastAPI backend is running on port 8000:

```bash
cd ..
python src/api.py
```

## 📁 Project Structure

```
react_app/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   ├── dashboard/         # Dashboard page
│   ├── chat/              # Chat page
│   └── submit-claim/      # Submit claim page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── theme-provider.tsx # Theme provider
│   └── ...                # Custom components
├── lib/
│   ├── utils.ts           # Utility functions
│   └── api.ts             # API client
└── public/                # Static assets
```

## 🎨 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 API Integration

The app connects to the FastAPI backend running on `http://localhost:8000`. API routes are proxied through Next.js:

```typescript
// Example API call
import axios from 'axios'

const response = await axios.post('/api/query', {
  user_email: 'user@example.com',
  query_text: 'What is my balance?'
})
```

## 🎯 Key Features

### 1. Authentication
- Simple email-based login
- Session management
- Protected routes

### 2. Dashboard
- Real-time claim balance
- Spending analytics
- Interactive charts
- Claim history

### 3. AI Chat Assistant
- Natural language queries
- Context-aware responses
- Real-time messaging
- Quick question buttons

### 4. Submit Claims
- Easy form submission
- File upload support
- Validation
- Success feedback

## 🌓 Dark Mode

Toggle between light and dark themes using the theme switcher in the navigation bar. The theme preference is saved automatically.

## 📱 Responsive Design

The app is fully responsive and works seamlessly on:
- 📱 Mobile devices
- 📱 Tablets
- 💻 Desktops
- 🖥️ Large screens

## 🎨 Customization

### Colors

Edit `app/globals.css` to customize the color scheme:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  /* ... */
}
```

### Components

All UI components are in `components/ui/` and can be customized as needed.

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

```bash
npm install -g vercel
vercel
```

## 📝 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is part of the ClaimEase system.

## 🆘 Support

For issues or questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team

---

Built with ❤️ using Next.js and shadcn/ui
