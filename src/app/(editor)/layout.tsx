/**
 * Editor layout — full-bleed, no dashboard sidebar.
 * The editor shell manages its own split layout.
 */
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
