const WHATSAPP_PHONE = "573176055855";
const WHATSAPP_MESSAGE = "Hola, tengo un problema con mi reserva. ¿Me puedes ayudar, por favor?";

const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export function WhatsAppFloatButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir chat de WhatsApp"
      title="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1ebe5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
    >
      <svg viewBox="0 0 24 24" className="size-7 fill-current" aria-hidden="true">
        <path d="M20.52 3.48A11.78 11.78 0 0 0 12.06 0C5.52 0 .2 5.33.2 11.87c0 2.09.55 4.14 1.6 5.95L0 24l6.34-1.66a11.83 11.83 0 0 0 5.72 1.46h.01c6.54 0 11.87-5.33 11.87-11.87 0-3.17-1.23-6.14-3.42-8.45ZM12.07 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.76.99 1-3.67-.24-.38a9.9 9.9 0 0 1-1.52-5.28c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.98 2.89a9.8 9.8 0 0 1 2.9 6.99c0 5.45-4.45 9.89-9.9 9.89Zm5.43-7.4c-.3-.15-1.77-.88-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.76.97-.93 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.48a8.9 8.9 0 0 1-1.65-2.05c-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.08-.8.38-.27.3-1.05 1.03-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.11 3.22 5.1 4.52.71.31 1.27.5 1.7.64.71.22 1.35.19 1.86.11.57-.09 1.77-.72 2.03-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}