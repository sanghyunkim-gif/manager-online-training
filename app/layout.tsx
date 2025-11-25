import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PLAB FOOTBALL 매니저 온라인 실습',
  description: 'PLAB FOOTBALL 매니저 지원을 위한 온라인 교육 프로그램',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
