import './globals.css';

export const metadata = {
  title: 'Bus Minus',
  description: 'Veb aplikacija za gradski prevoz u Beogradu'
};

export default function RootLayout({ children }) {
  return (
    <html lang="sr">
      <body>{children}</body>
    </html>
  );
}