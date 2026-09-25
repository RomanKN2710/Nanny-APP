"use client";

export function ConfirmSubmit({ message, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      {...rest}
      type="submit"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
