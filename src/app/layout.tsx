import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Echoes — listen closer', description: 'A quieter place for your music.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
