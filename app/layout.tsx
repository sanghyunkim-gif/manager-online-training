import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '플랩풋볼 매니저 온라인 실습',
  description: '플랩풋볼 매니저 지원을 위한 온라인 교육 프로그램',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
