export const metadata = {
  title: 'Style. — Lisa\'s Personal Stylist',
  description: 'AI-powered personal stylist built for Lisa',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0a' }}>
        {children}
      </body>
    </html>
  );
}
