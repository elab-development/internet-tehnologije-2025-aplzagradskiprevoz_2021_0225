import './globals.css';

export const metadata = {
  title: 'BG Prevoz - MVP',
  description: 'Veb aplikacija za gradski prevoz u Beogradu'
};

export default function RootLayout({ children }) {
  return (
    <html lang="sr">
      <body>{children}</body>
    </html>
  );
}