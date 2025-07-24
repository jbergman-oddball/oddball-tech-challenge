import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oddball Tech Challenge',
  description: 'The ultimate tech challenge system.',
};

export default function DashboardMetadataLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
