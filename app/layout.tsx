import './globals.css';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

// Pretendard 가변 폰트 (plab-design-system 권장 서체, 셀프 호스팅)
const pretendard = localFont({
  src: '../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
  weight: '45 920',
});

export const metadata: Metadata = {
  title: '플랩풋볼 매니저 온라인 실습',
  description: '플랩풋볼 매니저 지원을 위한 온라인 교육 프로그램',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
