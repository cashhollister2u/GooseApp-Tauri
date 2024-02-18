import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from '../context/AuthContext'
import {NextUIProvider} from "@nextui-org/react";
import { useEffect } from 'react';


export default function App({ Component, pageProps }: AppProps) {

  useEffect(() => {
    const preventBackspaceNav = (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        const activeElement = document.activeElement;
        const tags = ['INPUT', 'TEXTAREA'];
        if (activeElement && tags.includes(activeElement.tagName)) {
    
          if ((activeElement as HTMLInputElement | HTMLTextAreaElement).value === '') {
            
            event.preventDefault();
          }
        } else if (!activeElement || !(activeElement as HTMLElement).isContentEditable) {
        
          event.preventDefault();
        }
      }
    };
  
    document.addEventListener('keydown', preventBackspaceNav);
  
    return () => {
      document.removeEventListener('keydown', preventBackspaceNav);
    };
  }, []);

  return (
    <AuthProvider>
      <NextUIProvider>
      <div className="bg-black min-h-screen">
      <Component {...pageProps} />
      </div>
      </NextUIProvider>
    </AuthProvider>
  )
}