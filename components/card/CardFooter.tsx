export function CardFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`cd-muted px-5 pb-7 pt-2 text-center text-[0.7rem] tracking-wide ${className}`}>
      Tarjeta digital
    </footer>
  );
}
