# ZeroConfig Marketing Website

> **Tagline:** Zero setup. Instant productivity.

A modern, developer-first marketing website built with React, TypeScript, Tailwind CSS, Zustand, and Framer Motion.

## 🚀 Features

- ⚛️ **React 18** with TypeScript
- 🎨 **Tailwind CSS** for styling
- 🔄 **Zustand** for state management
- ✨ **Framer Motion** for smooth animations
- 📱 **Fully Responsive** design
- 🎯 **SEO Optimized** with structured data
- ⚡ **Lightning Fast** with Vite

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/         # React components
│   ├── Header.tsx     # Navigation header with mobile menu
│   ├── Hero.tsx       # Hero section with terminal demo
│   ├── TrustBadges.tsx
│   ├── Features.tsx   # 10 feature cards
│   ├── HowItWorks.tsx # 3-step process flow
│   ├── Architecture.tsx
│   ├── ProductDemo.tsx # Tabbed demo (CLI/Desktop/Web)
│   ├── Comparison.tsx  # Comparison table
│   ├── Pricing.tsx     # Pricing cards with toggle
│   ├── Testimonials.tsx
│   ├── FAQ.tsx         # Accordion FAQ
│   ├── CTA.tsx
│   └── Footer.tsx
├── store/
│   └── useStore.ts     # Zustand state management
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles with Tailwind
```

## 🎨 Design System

### Colors

- **Primary:** `#0F1724` (Deep slate)
- **Accent:** `#FF6A00` (Rust orange)
- **Accent Purple:** `#7C5CFF` (Indigo/violet)
- **Success:** `#00C48C`
- **Muted:** `#94A3B8`
- **Card:** `#0B1320`

### Typography

- **Sans:** Inter (headings, body)
- **Mono:** JetBrains Mono (code, terminal)

## 🧩 Components Overview

### Header
- Sticky navigation with glassmorphism
- Mobile menu with smooth animations
- Auto-hides/shows on scroll

### Hero
- Animated terminal demo
- Floating badges
- Gradient text effects
- Responsive grid layout

### Features
- 10 feature cards in responsive grid
- Hover effects and animations
- Icon + title + description layout

### Product Demo
- Tabbed interface (CLI/Desktop/Web)
- State managed with Zustand
- Smooth transitions with Framer Motion

### Pricing
- Annual/Monthly toggle
- 3 pricing tiers
- Highlighted "Most Popular" plan

### FAQ
- Accordion with smooth animations
- Controlled by Zustand state
- Auto-scrolls to opened item

## 🔧 Customization

### Update Colors

Edit `tailwind.config.js`:

```js
colors: {
  accent: '#FF6A00',        // Your brand color
  'accent-purple': '#7C5CFF',
  // ...
}
```

### Add New Sections

1. Create component in `src/components/`
2. Import in `App.tsx`
3. Add to main layout

### Update Content

- Features: Edit `Features.tsx` features array
- Testimonials: Edit `Testimonials.tsx` testimonials array
- FAQ: Edit `FAQ.tsx` faqs array
- Pricing: Edit `Pricing.tsx` plans array

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## ✨ Animations

All animations use Framer Motion with:
- Scroll-triggered animations via `whileInView`
- Reduced motion support via CSS media query
- Spring physics for natural feel

## 🌐 Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ♥ using React + Vite + Tailwind CSS
